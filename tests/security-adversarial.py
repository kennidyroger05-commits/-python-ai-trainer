"""Second-pass abuse cases. SDK is fake; notebook artifacts come from bounded real CPU runs."""
import copy,json,os,re,shutil,subprocess,sys,tempfile,types,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from executor.contracts import example,fingerprint,ROOT
from executor.transport import Policy
from executor.service import Executor
from executor.local import execute
from executor.artifacts import verify
from executor.errors import ExecutorError
from executor.sdk_worker import invoke,safe_logs

class Fake:
    def __init__(self):self.calls=[];self.status='NEW_SCRIPT';self.mutate=lambda:None
    def preflight(self):pass
    def call(self,operation,payload):
        self.calls.append((operation,copy.deepcopy(payload)))
        if operation=='submit':self.mutate();return {'remote_ref':payload['remote_ref'],'version':len([c for c in self.calls if c[0]=='submit'])}
        if operation=='status':return {'status':self.status}
        raise AssertionError(operation)

class SecurityTests(unittest.TestCase):
    def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.job=example();self.fake=Fake();self.policy=Policy(enabled=True,allow_run=True,owner='testowner',approved_sha256=fingerprint(self.job));self.e=Executor(self.root,policy=self.policy,transport=self.fake,clock=lambda:1000)
    def tearDown(self):self.tmp.cleanup()
    def expect_reject(self,fn,*args):
        with self.assertRaises(ExecutorError):fn(*args)
    def training_output(self):
        job=example('intent-training');folder=self.root/'output';folder.mkdir();execute(job,folder);return job,folder
    def rewrite(self,path,fn):
        value=json.loads(path.read_text());fn(value);path.write_text(json.dumps(value))
    def test_01_new_script_cannot_reauthorize_a_second_run(self):
        self.e.submit(self.job,run=True);self.e.status(self.job);self.e.submit(self.job,run=True)
        self.assertEqual(sum(op=='submit' for op,_ in self.fake.calls),1,'Observed NEW_SCRIPT must not erase the durable intent to run')
    def test_02_caller_mutation_cannot_corrupt_submission_receipt(self):
        from executor.notebooks import build as real_build
        import base64
        original=copy.deepcopy(self.job)
        def mutate_before_build(passed):
            self.job['config']['inputs'].append('modified by caller');return real_build(passed)
        with patch('executor.service.build',side_effect=mutate_before_build):state=self.e.submit(self.job,run=True)
        notebook=json.loads((self.root/original['id']/'experiment.ipynb').read_text());cell=''.join(next(c for c in notebook['cells'] if c['id']=='job-config')['source']);encoded=re.search(r'b64decode\("([^"]+)"\)',cell).group(1)
        self.assertEqual(json.loads(base64.b64decode(encoded)),original,'The uploaded notebook must match the approved immutable spec');self.assertEqual(state['spec'],original)
    def test_03_training_details_are_closed(self):
        job,folder=self.training_output();self.rewrite(folder/'result.json',lambda r:r['details'].update({'api_key':'SYNTHETIC_CANARY_ONLY'}));self.expect_reject(verify,folder,job)
    def test_04_split_membership_not_only_counts(self):
        job,folder=self.training_output()
        def swap(v):v['train'][0],v['validation'][0]=v['validation'][0],v['train'][0]
        self.rewrite(folder/'splits.json',swap);self.expect_reject(verify,folder,job)
    def test_05_checkpoint_parameter_count_matches_contract(self):
        job,folder=self.training_output()
        def extend(v):v['vocab'].append('zzunseen');[row.append(0.0) for row in v['weights']]
        self.rewrite(folder/'checkpoint-best.json',extend);self.expect_reject(verify,folder,job)
    def test_06_before_metrics_match_seeded_initialization(self):
        job,folder=self.training_output()
        self.rewrite(folder/'metrics.json',lambda v:v.update(before_validation_accuracy=1.0))
        def fake_before(v):v['metrics']['before_validation_accuracy']=1.0;v['details']['before_validation']={'accuracy':1.0,'loss':.01,'correct':6,'examples':6}
        self.rewrite(folder/'result.json',fake_before);self.expect_reject(verify,folder,job)
    def test_07_sdk_auxiliary_files_do_not_break_filtered_download(self):
        source=self.root/'source';source.mkdir();execute(self.job,source);destination=self.root/'download';destination.mkdir();names={'events.json','metrics.json','result.json'};seen=[]
        class Api:
            def kernels_list_files(self,ref,page_token=None,page_size=100):return types.SimpleNamespace(files=[types.SimpleNamespace(name=n,size=(source/n).stat().st_size) for n in names]+[types.SimpleNamespace(name='__notebook__.ipynb',size=100)],next_page_token='')
            def kernels_output(self,ref,path,file_pattern=None,force=False,quiet=False,page_token=None,page_size=100):
                seen.append((ref,page_token,quiet));out=[]
                for name in [*names,'__notebook__.ipynb']:
                    if re.search(file_pattern,name):shutil.copyfile(source/name,Path(path)/name);out.append(str(Path(path)/name))
                return out,''
        result=invoke(Api(),'outputs',{'version_ref':'testowner/slug/3','destination':str(destination),'names':sorted(names)});self.assertEqual(set(result['downloaded']),names);self.assertEqual(seen,[('testowner/slug/3','',True)]);verify(destination,self.job)
    def test_08_corrupt_state_cannot_export_unknown_secret_fields(self):
        self.e.submit(self.job,run=True);path=self.root/self.job['id']/'state.json';self.rewrite(path,lambda v:v.update(api_key='SYNTHETIC_CANARY_ONLY'));self.expect_reject(self.e.status,self.job);self.assertEqual(len(self.fake.calls),1)
    def test_09_unknown_error_code_not_exported(self):
        self.e.prepare(self.job);path=self.root/self.job['id']/'state.json';self.rewrite(path,lambda v:v.update(last_error='SYNTHETIC_CANARY_ONLY'));self.expect_reject(self.e.snapshot,self.job)
    def test_10_nested_json_and_nonfinite_are_rejected(self):
        folder=self.root/'output';folder.mkdir();execute(self.job,folder);(folder/'result.json').write_text('['*2000+'0'+']'*2000);self.expect_reject(verify,folder,self.job)
    def test_11_logs_drop_raw_tokens_and_unknown_strings(self):
        result=safe_logs('Bearer SYNTHETIC_CANARY_ONLY\n{"event":"epoch","epoch":1,"token":"SYNTHETIC_CANARY_ONLY"}\n{"event":"failed","error_type":"ValueError"}')
        self.assertNotIn('SYNTHETIC_CANARY_ONLY',json.dumps(result));self.assertEqual(result['events'],[{'event':'failed','error_type':'ValueError'}])
    def test_12_process_memory_failure_is_contained(self):
        source='import resource\nresource.setrlimit(resource.RLIMIT_AS,(64*1024*1024,64*1024*1024))\ntry:\n    value=bytearray(512*1024*1024)\nexcept MemoryError:\n    print("bounded-memory-error")\n'
        r=subprocess.run([sys.executable,'-I','-c',source],capture_output=True,text=True,timeout=5,env={'PATH':os.defpath});self.assertEqual(r.returncode,0);self.assertEqual(r.stdout,'bounded-memory-error\n')

    def test_13_boolean_versions_and_counts_are_not_numbers(self):
        folder=self.root/'output';folder.mkdir();job=example();job['config']['inputs']=['invoice'];execute(job,folder)
        self.rewrite(folder/'metrics.json',lambda v:v.update(prediction_count=True))
        self.rewrite(folder/'result.json',lambda v:v['metrics'].update(prediction_count=True))
        self.expect_reject(verify,folder,job)
    def test_14_malformed_checkpoint_is_domain_error(self):
        job,folder=self.training_output();(folder/'checkpoint-best.json').write_text('[]');self.expect_reject(verify,folder,job)
    def test_15_hashes_describe_the_validated_snapshot(self):
        import hashlib
        folder=self.root/'output';folder.mkdir();execute(self.job,folder);original=(folder/'metrics.json').read_bytes();native=Path.read_bytes
        def changed(path):return b'not-the-validated-file' if path.name=='metrics.json' else native(path)
        with patch.object(Path,'read_bytes',changed):result=verify(folder,self.job)
        observed=next(a['sha256'] for a in result['artifacts'] if a['name']=='metrics.json');self.assertEqual(observed,hashlib.sha256(original).hexdigest())

    def test_16_shared_workspace_is_rejected_without_chmod(self):
        shared=self.root/'shared';shared.mkdir(mode=0o755);shared.chmod(0o755);before=shared.stat().st_mode
        self.expect_reject(Executor,shared);self.assertEqual(shared.stat().st_mode,before)

    def test_17_executor_state_cannot_live_in_frontend_webroot(self):
        with tempfile.TemporaryDirectory(prefix='.unsafe-workspace-test-',dir=ROOT) as folder:
            self.expect_reject(Executor,folder)
        result=subprocess.run([sys.executable,'-m','executor.cli','prepare','--job','experiments/intent-inference-job.json'],cwd=ROOT,capture_output=True,text=True,timeout=5,env={'PATH':os.defpath})
        self.assertEqual(result.returncode,2);self.assertEqual(json.loads(result.stdout),{'ok':False,'error':'WORKSPACE_REQUIRED'})

if __name__=='__main__':unittest.main(verbosity=2)
