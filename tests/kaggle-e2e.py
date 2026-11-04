"""Operational E2E with injected Kaggle transport and real local notebook artifacts."""
import copy,json,runpy,subprocess,sys,tempfile,threading,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from executor.workflow import Workflow
from executor.transport import Policy
from executor.package import create,inspect,execution,source_identity
from executor.contracts import ROOT,example,fingerprint
from executor.notebooks import build,metadata
from executor.errors import ExecutorError
from executor import files
from executor.sdk_worker import invoke
base=runpy.run_path(str(ROOT/'tests/executor.py'),run_name='fixture')
class Fake(base['Fake']):
    def call(self,op,payload):
        if op=='inspect':
            self.calls.append((op,copy.deepcopy(payload)))
            if self.fault:raise ExecutorError(self.fault)
            return {'notebook':build(self.job),'metadata':metadata(self.job,'testowner','pat-'+self.job['id']+'-'+fingerprint(self.job)[:8])}
        return super().call(op,payload)
class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.job=example();self.fake=Fake(self.job);self.clock=base['Clock']()
        self.policy=Policy(enabled=True,allow_run=True,owner='testowner',approved_sha256=fingerprint(execution(self.job,'testowner',True)))
        self.e=self.restart()
    def tearDown(self):self.tmp.cleanup()
    def restart(self):return Workflow(self.root,policy=self.policy,transport=self.fake,clock=self.clock,sleep=self.clock.sleep)
    def code(self,code,fn,*args,**kw):
        with self.assertRaises(ExecutorError) as cm:fn(*args,**kw)
        self.assertEqual(cm.exception.code,code)
    def approve(self):self.e.approve(self.job)
    def submit(self):self.approve();return self.e.submit(self.job,run=True)
    def uncertain(self):
        self.approve();self.fake.fault='TIMEOUT';self.code('TIMEOUT',self.e.submit,self.job,run=True);self.fake.fault=None
    def test_package_mutations_rejected(self):
        p=create(self.job);self.assertEqual(inspect(p),self.job)
        for change in [lambda b:b['notebook']['cells'][2]['source'].append('print(42)'),lambda b:b['job']['config'].update(inputs=['other']),lambda b:b['metadata'].update(enable_internet=True),lambda b:b.update(path='../secret'),lambda b:b.update(version=True)]:
            b=copy.deepcopy(p);change(b)
            with self.assertRaises(ExecutorError):inspect(b)
    def test_no_receipt_no_submission(self):
        self.code('AUTHORIZATION_REQUIRED',self.e.submit,self.job,run=True);self.assertEqual(self.fake.calls,[])
        self.assertEqual(self.e.snapshot(self.job)['status'],'awaiting_authorization')
    def test_offline_authorize_then_restart_submit(self):
        self.approve();self.assertEqual(self.e.snapshot(self.job)['status'],'authorized');self.assertEqual(self.fake.calls,[])
        e=self.restart();self.assertEqual(e.submit(self.job,run=True)['status'],'submitted');self.assertEqual(e.submit(self.job,run=True)['remote_version'],1);self.assertEqual(len(self.fake.calls),1)
    def test_approval_binds_notebook_owner_and_intent(self):
        self.approve();self.code('APPROVAL_MISMATCH',self.e.submit,self.job,run=False)
        original=execution(self.job,'testowner',True);altered=copy.deepcopy(original);altered['notebook_sha256']='0'*64
        with patch('executor.workflow.execution',return_value=altered):self.code('APPROVAL_MISMATCH',self.e.submit,self.job,run=True)
        for field in ['config','dataset']:
            j=copy.deepcopy(self.job)
            if field=='config':j[field]['inputs']=['changed']
            else:j[field]['sha256']='0'*64
            with self.assertRaises(ExecutorError):self.e.submit(j,run=True)
        self.assertEqual(self.fake.calls,[])
    def test_tampered_approval_not_used(self):
        self.approve();root=self.e.directory(self.job['id']);r=files.read(root,'authorization.json');r['execution']['run']=False;files.atomic(root,'authorization.json',r)
        self.code('APPROVAL_MISMATCH',self.e.submit,self.job,run=True);self.assertFalse(self.fake.calls)
    def test_timeout_restart_reconcile_version_then_collect(self):
        self.uncertain();e=self.restart();self.code('RECONCILIATION_REQUIRED',e.submit,self.job,run=True)
        self.fake.statuses=['RUNNING'];self.assertEqual(e.reconcile(self.job,7)['remote_version'],7)
        self.assertEqual(self.restart().prepare(self.job)['status'],'running');self.clock.sleep(15);self.fake.statuses=['COMPLETE'];e.status(self.job)
        report=e.collect(self.job);self.assertEqual(report['provenance']['remote_version'],7);self.assertEqual(report['provenance']['source'],'injected-transport');self.assertEqual(len(report['artifacts']),3)
        self.assertEqual(sum(op=='submit' for op,_ in self.fake.calls),1)
        self.assertEqual(e.snapshot(self.job),report)
    def test_reconcile_rejects_changed_remote_source(self):
        self.uncertain();original=self.fake.call
        def changed(op,payload):
            r=original(op,payload)
            if op=='inspect':r['notebook']['cells'][2]['source'].append('raise RuntimeError()')
            return r
        self.fake.call=changed;self.code('REMOTE_IDENTITY_MISMATCH',self.e.reconcile,self.job,1)
        self.assertEqual(self.e.prepare(self.job)['status'],'submission_unknown');self.code('RECONCILIATION_REQUIRED',self.e.submit,self.job,run=True)
    def test_reconcile_rejects_remote_gpu_and_unknown_state(self):
        self.uncertain();original=self.fake.call
        def gpu(op,payload):
            r=original(op,payload)
            if op=='inspect':r['metadata']['enable_gpu']=True
            return r
        self.fake.call=gpu;self.code('REMOTE_IDENTITY_MISMATCH',self.e.reconcile,self.job,1)
        self.fake.call=original;self.fake.statuses=['NEW_SCRIPT'];self.code('REMOTE_STATE_UNKNOWN',self.e.reconcile,self.job,1)
        self.assertIsNone(self.e.prepare(self.job)['remote_version'])
    def test_uncertain_reconcile_network_error_never_releases_fence(self):
        self.uncertain();self.fake.fault='TIMEOUT';self.code('TIMEOUT',self.e.reconcile,self.job,1);self.fake.fault=None
        self.code('RECONCILIATION_REQUIRED',self.e.submit,self.job,run=True)
    def test_download_retry_does_not_submit(self):
        self.submit();self.fake.statuses=['COMPLETE'];self.e.status(self.job)
        original=self.fake.call
        def interrupted(op,payload):
            if op=='outputs':raise ExecutorError('TIMEOUT')
            return original(op,payload)
        self.fake.call=interrupted;self.code('TIMEOUT',self.e.collect,self.job);self.assertEqual(self.e.prepare(self.job)['status'],'remote_complete')
        self.fake.call=original;self.assertEqual(self.restart().collect(self.job)['status'],'completed');self.assertEqual(sum(op=='submit' for op,_ in self.fake.calls),1)
    def test_missing_corrupt_approval_and_state_fail_closed(self):
        self.approve();(self.e.directory(self.job['id'])/'authorization.json').write_text('{bad')
        self.code('AUTHORIZATION_REQUIRED',self.e.submit,self.job,run=True);self.assertEqual(self.fake.calls,[])
        (self.e.directory(self.job['id'])/'state.json').write_text('{bad')
        self.code('STATE_CORRUPT',self.e.snapshot,self.job)
    def test_logs_persist_without_sensitive_lines(self):
        self.submit();logs=self.e.logs(self.job);self.assertNotIn('Bearer',json.dumps(logs));self.assertEqual(files.read(self.e.directory(self.job['id']),'logs.json'),logs)
    def test_archives_not_extracted(self):
        path=self.root/'bad.zip';path.write_bytes(b'PK\x03\x04../../evil')
        r=subprocess.run([sys.executable,'-m','executor.cli','validate','--job',str(path)],cwd=ROOT,capture_output=True,text=True,timeout=10)
        self.assertNotEqual(r.returncode,0);self.assertFalse((self.root/'evil').exists())
    def test_offline_cli_package_authorization_and_smoke(self):
        j=json.loads((ROOT/'experiments/kaggle-smoke-job.json').read_text());p=self.root/'package.json';p.write_text(json.dumps(create(j)))
        def cli(op,*args):
            r=subprocess.run([sys.executable,'-m','executor.cli',op,'--job',str(p),'--workspace',str(self.root),'--owner','testowner','--run',*args],cwd=ROOT,capture_output=True,text=True,timeout=15)
            return r,json.loads(r.stdout)
        _,v=cli('validate');sha=v['result']['execution_sha256'];self.assertEqual(sha,fingerprint(execution(j,'testowner',True)))
        self.assertEqual(cli('authorize','--approve',sha)[1]['result']['status'],'authorized');self.assertEqual(cli('submit','--approve',sha)[1]['error'],'REMOTE_DISABLED')
        report=cli('local')[1]['result'];self.assertEqual(report['notebook_result']['metrics']['prediction_count'],1);self.assertEqual(report['provenance']['source'],'local-cpu')
    def test_sdk_pull_fixed_path_and_version(self):
        j=self.job
        class Api:
            def kernels_pull(self,ref,path,metadata=False,quiet=True):
                self.ref=ref;self.path=path;Path(path).write_text(json.dumps(build(j)));Path(path).with_name('kernel-metadata.json').write_text('{}')
        a=Api();r=invoke(a,'inspect',{'version_ref':'testowner/slug/9'});self.assertEqual(a.ref,'testowner/slug/9');self.assertEqual(Path(a.path).name,'remote.ipynb');self.assertEqual(source_identity(r['notebook']),source_identity(build(j)))

if __name__=='__main__':unittest.main(verbosity=2)
