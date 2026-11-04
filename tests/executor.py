"""Reference executor tests: fake SDK/transport, real local artifacts, zero Kaggle calls."""
import copy, json, os, re, shutil, subprocess, sys, tempfile, threading, types, unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from executor import files
from executor.contracts import example, fingerprint, validate, ROOT
from executor.errors import ExecutorError
from executor.transport import Policy,SdkTransport
from executor.service import Executor
from executor.local import execute
from executor.artifacts import verify,expected
from executor.sdk_worker import invoke,safe_logs,error_code

class Clock:
    def __init__(self):self.now=1000
    def __call__(self):return self.now
    def sleep(self,n):self.now+=n
class Fake:
    def __init__(self,job):self.calls=[];self.job=job;self.statuses=['QUEUED','RUNNING','COMPLETE'];self.fault=None;self.preflight_error=None;self.outputs_fault=None
    def preflight(self):
        if self.preflight_error:raise ExecutorError(self.preflight_error)
    def call(self,op,payload):
        self.calls.append((op,copy.deepcopy(payload)))
        if self.fault:raise ExecutorError(self.fault,retry_after=45 if self.fault=='RATE_LIMIT' else None)
        if op=='submit':return {'remote_ref':payload['remote_ref'],'version':1}
        if op=='status':return {'status':self.statuses.pop(0) if len(self.statuses)>1 else self.statuses[0]}
        if op=='logs':return safe_logs('Bearer should-never-return\n{"event":"inference_complete","examples":3}')
        if op=='outputs':
            execute(self.job,payload['destination'])
            if self.outputs_fault=='missing':(Path(payload['destination'])/'metrics.json').unlink()
            if self.outputs_fault=='corrupt':(Path(payload['destination'])/'metrics.json').write_text('{"secret":"do-not-publish"}')
            if self.outputs_fault=='symlink':(Path(payload['destination'])/'outside.json').symlink_to('/etc/passwd')
            return {'downloaded':payload['names']}
        raise AssertionError(op)

class ExecutorTests(unittest.TestCase):
    def setUp(self):self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.job=example();self.clock=Clock();self.fake=Fake(self.job);self.policy=Policy(enabled=True,allow_run=True,owner='testowner',approved_sha256=fingerprint(self.job));self.service=Executor(self.root,policy=self.policy,transport=self.fake,clock=self.clock,sleep=self.clock.sleep)
    def tearDown(self):self.temp.cleanup()
    def code(self,expected,fn,*args,**kwargs):
        with self.assertRaises(ExecutorError) as cm:fn(*args,**kwargs)
        self.assertEqual(cm.exception.code,expected)
    def submitted(self):return self.service.submit(self.job,run=True)
    def complete(self):
        self.submitted();self.fake.statuses=['COMPLETE'];return self.service.status(self.job)
    def test_01_disabled_before_transport(self):
        e=Executor(self.root,transport=self.fake);self.code('REMOTE_DISABLED',e.submit,self.job,run=True);self.assertEqual(self.fake.calls,[])
    def test_02_approval_and_owner(self):
        for policy,code in [(Policy(enabled=True,owner='testowner',approved_sha256='0'*64),'APPROVAL_MISMATCH'),(Policy(enabled=True,owner='../other',approved_sha256=fingerprint(self.job)),'INVALID_OWNER')]:
            self.code(code,Executor(self.root,policy=policy,transport=self.fake).submit,self.job)
        self.assertEqual(self.fake.calls,[])
    def test_03_save_only_default(self):
        state=self.service.submit(self.job);self.assertEqual(state['status'],'saved_only');self.assertFalse(self.fake.calls[0][1]['run']);self.assertIsNone(state['report'])
    def test_04_run_gate_and_submitted_not_completed(self):
        p=Policy(enabled=True,owner='testowner',approved_sha256=fingerprint(self.job));self.code('RUN_NOT_AUTHORIZED',Executor(self.root,policy=p,transport=self.fake).submit,self.job,run=True)
        state=self.submitted();self.assertEqual(state['status'],'submitted');self.assertEqual(state['remote_version'],1);self.assertIsNone(state['report'])
    def test_05_duplicate_submit(self):
        one=self.submitted();two=self.submitted();self.assertEqual(one,two);self.assertEqual(sum(op=='submit' for op,_ in self.fake.calls),1)
    def test_06_conflict(self):
        self.service.prepare(self.job);different=copy.deepcopy(self.job);different['config']['inputs']=['billing request'];self.code('JOB_ID_CONFLICT',self.service.prepare,different);self.assertEqual(self.fake.calls,[])
    def test_07_uncertain_submission_fenced(self):
        self.fake.fault='TIMEOUT';self.code('TIMEOUT',self.service.submit,self.job,run=True);state=self.service.prepare(self.job);self.assertEqual(state['status'],'submission_unknown');self.fake.fault=None;self.code('RECONCILIATION_REQUIRED',self.service.submit,self.job,run=True);self.assertEqual(len(self.fake.calls),1)
    def test_08_preflight_auth(self):
        self.fake.preflight_error='AUTH_MISSING';self.code('AUTH_MISSING',self.service.submit,self.job);self.assertEqual(self.service.prepare(self.job)['status'],'prepared');self.assertEqual(self.fake.calls,[])
    def test_09_status_version_and_throttle(self):
        self.submitted();state=self.service.status(self.job);self.assertEqual(state['status'],'queued');self.code('POLL_TOO_SOON',self.service.status,self.job);self.clock.sleep(15);self.assertEqual(self.service.status(self.job)['status'],'running');self.clock.sleep(15);self.assertEqual(self.service.status(self.job)['status'],'remote_complete');self.assertIsNone(self.service.prepare(self.job)['report']);self.assertTrue(all(p['version_ref'].endswith('/1') for op,p in self.fake.calls if op=='status'))
    def test_10_network_and_rate_limit(self):
        self.submitted();self.fake.fault='TIMEOUT';self.code('TIMEOUT',self.service.status,self.job);self.assertEqual(self.service.prepare(self.job)['status'],'submitted');self.clock.sleep(15);self.fake.fault='RATE_LIMIT';self.code('RATE_LIMIT',self.service.status,self.job);self.assertEqual(self.service.prepare(self.job)['next_check_after'],self.clock.now+45)
    def test_11_missing_outputs_not_completed(self):
        self.complete();self.fake.outputs_fault='missing';self.code('OUTPUT_MISSING',self.service.collect,self.job);self.assertEqual(self.service.prepare(self.job)['status'],'remote_complete');self.assertIsNone(self.service.prepare(self.job)['report'])
    def test_12_corrupt_and_symlink_outputs(self):
        self.complete()
        for fault in ['corrupt','symlink']:
            self.fake.outputs_fault=fault
            with self.assertRaises(ExecutorError):self.service.collect(self.job)
        self.assertNotEqual(self.service.prepare(self.job)['status'],'completed')
    def test_13_valid_outputs_and_injected_provenance(self):
        self.complete();report=self.service.collect(self.job);self.assertEqual(report['status'],'completed');self.assertEqual(report['provenance']['source'],'injected-transport');self.assertEqual(report['notebook_result']['metrics']['prediction_count'],3);self.assertEqual(len(report['artifacts']),3);calls=len(self.fake.calls);self.assertEqual(self.service.collect(self.job),report);self.assertEqual(len(self.fake.calls),calls)
    def test_14_stop_is_not_cancel(self):
        self.submitted();before=len(self.fake.calls);state=self.service.stop_following(self.job);self.assertEqual(state['status'],'submitted');self.assertTrue(state['monitoring_stopped']);self.assertEqual(len(self.fake.calls),before)
    def test_15_follow_bounded(self):
        self.submitted();state=self.service.follow(self.job,max_checks=3);self.assertEqual(state['status'],'remote_complete');self.assertEqual(self.clock.now,1030);self.assertEqual(sum(op=='status' for op,_ in self.fake.calls),3)
    def test_16_concurrent_double_submission(self):
        entered=threading.Event();release=threading.Event();original=self.fake.call
        def slow(op,payload):entered.set();release.wait(2);return original(op,payload)
        self.fake.call=slow;result=[]
        thread=threading.Thread(target=lambda:result.append(self.submitted()));thread.start();self.assertTrue(entered.wait(1));self.code('JOB_BUSY',self.service.submit,self.job,run=True);release.set();thread.join(2);self.assertEqual(len(result),1);self.assertEqual(len(self.fake.calls),1)
    def test_17_local_paths_and_corrupt_state(self):
        link=self.root/'linked';link.symlink_to('/tmp',target_is_directory=True);self.code('UNSAFE_PATH',Executor,link)
        self.service.prepare(self.job);path=self.root/self.job['id']/'state.json';path.write_text('{bad');self.code('STATE_CORRUPT',self.service.submit,self.job);self.assertEqual(path.read_text(),'{bad');self.assertEqual(self.fake.calls,[])
    def test_18_foreign_account_and_version_tampering(self):
        self.submitted();path=self.root/self.job['id']/'state.json';data=json.loads(path.read_text());data['remote_ref']='foreign/something';path.write_text(json.dumps(data));self.code('REMOTE_OWNER_MISMATCH',self.service.status,self.job);self.assertEqual(len(self.fake.calls),1)
    def test_19_transport_no_credentials_no_network(self):
        with patch.dict(os.environ,{},clear=True):self.code('AUTH_MISSING',SdkTransport(self.policy).preflight)
        command=[sys.executable,'-I',str(ROOT/'executor/sdk_worker.py')]
        for request,code in [({'network_authorized':False},'REMOTE_DISABLED'),({'network_authorized':True},'AUTH_MISSING')]:
            r=subprocess.run(command,input=json.dumps(request),text=True,capture_output=True,env={'PATH':os.defpath},timeout=5);self.assertEqual(json.loads(r.stdout)['error'],code);self.assertEqual(r.stderr,'')
    def test_20_logs_no_secrets(self):
        self.submitted();logs=self.service.logs(self.job);self.assertEqual(logs['omitted_lines'],1);self.assertNotIn('Bearer',json.dumps(logs));self.assertEqual(len(logs['events']),1)
    def test_21_artifact_json_adversarial(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);execute(self.job,root);path=root/'result.json';original=path.read_text()
            for bad in [original.replace('"status": "completed"','"status": "completed", "status": "completed"'),original.replace('"duration_ms":','"duration_ms": NaN, "junk":')]:
                path.write_text(bad)
                with self.assertRaises(ExecutorError):verify(root,self.job)
    def test_22_training_artifacts(self):
        job=example('intent-training')
        with tempfile.TemporaryDirectory() as td:
            result=execute(job,td);self.assertEqual(len(result['artifacts']),6);self.assertEqual(result['provenance']['source'],'local-cpu');self.assertEqual(result['notebook_result']['metrics']['selected_epoch'],20)

    def test_23_cli_offline_flow(self):
        job=ROOT/'experiments/intent-inference-job.json'
        def cli(operation):
            r=subprocess.run([sys.executable,'-m','executor.cli',operation,'--job',str(job),'--workspace',str(self.root)],cwd=ROOT,text=True,capture_output=True,env={'PATH':os.defpath},timeout=10)
            return r,json.loads(r.stdout)
        self.assertTrue(cli('validate')[1]['result']['valid']);self.assertTrue(cli('prepare')[1]['result']['network_used'] is False);self.assertTrue((self.root/self.job['id']/'experiment.ipynb').exists());result,body=cli('submit');self.assertEqual(result.returncode,2);self.assertEqual(body['error'],'REMOTE_DISABLED');self.assertEqual(cli('local')[1]['result']['provenance']['source'],'local-cpu')
    def test_24_missing_and_failed_status(self):
        self.submitted();original=self.fake.call
        self.fake.call=lambda op,payload:None
        self.code('UNEXPECTED_RESPONSE',self.service.status,self.job);self.clock.sleep(15)
        self.fake.call=original;self.fake.statuses=['ERROR'];state=self.service.status(self.job);self.assertEqual(state['status'],'failed');self.assertEqual(state['last_error'],'REMOTE_JOB_FAILED');self.code('JOB_NOT_COMPLETE',self.service.collect,self.job)

class SdkTests(unittest.TestCase):
    def test_sdk_response_mapping_and_version(self):
        class Api:
            def kernels_push(self,folder,timeout=None,acc=None,no_run=False):self.no_run=no_run;return types.SimpleNamespace(ref='testowner/slug',version_number=3,error='')
            def kernels_status(self,ref):self.ref=ref;return types.SimpleNamespace(status=types.SimpleNamespace(name='COMPLETE'))
            def kernels_logs(self,ref):return 'api_key=synthetic-secret\n{"event":"inference_complete","examples":3}'
        a=Api();self.assertEqual(invoke(a,'submit',{'folder':'/tmp','run':False,'remote_ref':'testowner/slug'})['version'],3);self.assertTrue(a.no_run);self.assertEqual(invoke(a,'status',{'version_ref':'testowner/slug/3'})['status'],'COMPLETE');self.assertEqual(a.ref,'testowner/slug/3');self.assertNotIn('secret',json.dumps(invoke(a,'logs',{'version_ref':a.ref})))
    def test_sdk_faults_are_stable_codes(self):
        for status,expected in [(401,'AUTH_INVALID'),(403,'ACCESS_DENIED'),(404,'JOB_UNAVAILABLE'),(429,'RATE_LIMIT'),(503,'REMOTE_UNAVAILABLE')]:
            error=RuntimeError('Bearer secret must not escape');error.response=types.SimpleNamespace(status_code=status);self.assertEqual(error_code(error),expected)
    def test_sdk_output_preflight_paths(self):
        class Api:
            def kernels_list_files(self,*args,**kwargs):return types.SimpleNamespace(files=[types.SimpleNamespace(name='../../private',size=4)],next_page_token='')
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaises(ExecutorError) as cm:invoke(Api(),'outputs',{'version_ref':'testowner/slug/1','destination':td,'names':['result.json','metrics.json','events.json']})
            self.assertEqual(cm.exception.code,'UNSAFE_ARTIFACT');self.assertEqual(list(Path(td).iterdir()),[])

if __name__=='__main__':unittest.main(verbosity=2)
