"""Full offline notebook execution under CPU/wall/address-space/file limits."""
import copy, json, os, resource, subprocess, sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from executor.contracts import example, validate, fingerprint, ROOT
from executor.notebooks import build, check, assets
from executor.errors import ExecutorError
import runpy
CORE=runpy.run_path(str(ROOT/'experiments/recipes/tiny_intent.py'))
DATA=json.loads((ROOT/'experiments/data/synthetic-intents.json').read_text())

# Bound every local notebook process before any code executes. No exhaustion test on the host.
def contain():
    resource.setrlimit(resource.RLIMIT_AS,(256*1024*1024,256*1024*1024))
    resource.setrlimit(resource.RLIMIT_CPU,(10,10))
    resource.setrlimit(resource.RLIMIT_FSIZE,(2*1024*1024,2*1024*1024))
    resource.setrlimit(resource.RLIMIT_NOFILE,(64,64))

def execute(notebook,directory):
    source='\n'.join(''.join(c['source']) for c in notebook['cells'] if c['cell_type']=='code')
    env={**os.environ,'TRAINER_OUTPUT_DIR':str(directory),'PYTHONHASHSEED':'0'}
    return subprocess.run([sys.executable,'-I','-c',source],env=env,capture_output=True,text=True,timeout=15,preexec_fn=contain)

class NotebookTests(unittest.TestCase):
    def test_01_inference_full(self):
        with tempfile.TemporaryDirectory() as td:
            job=example();result=execute(build(job),td);self.assertEqual(result.returncode,0,result.stderr)
            report=json.loads((Path(td)/'result.json').read_text());self.assertEqual(report['status'],'completed');self.assertEqual(report['spec_sha256'],fingerprint(job));self.assertEqual(report['provenance']['source'],'notebook-process');self.assertFalse(report['provenance']['remote_verified'])
            self.assertEqual([p['label'] for p in report['details']['predictions']],['billing','support','schedule']);self.assertEqual(report['metrics']['prediction_count'],3);self.assertEqual(report['metrics']['input_word_tokens'],9);self.assertGreaterEqual(report['metrics']['latency_ms_total'],0)
            self.assertGreater(report['metrics']['peak_process_memory_kib'],0);self.assertFalse(report['details']['scores_are_calibrated'])
    def test_02_training_full_reproducible(self):
        checkpoints=[]
        for repeat in range(2):
            with tempfile.TemporaryDirectory() as td:
                job=example('intent-training');result=execute(build(job),td);self.assertEqual(result.returncode,0,result.stderr)
                report=json.loads((Path(td)/'result.json').read_text());history=json.loads((Path(td)/'history.json').read_text());splits=json.loads((Path(td)/'splits.json').read_text());checkpoint=json.loads((Path(td)/'checkpoint-best.json').read_text());checkpoints.append(checkpoint)
                self.assertEqual(len(history),20);self.assertGreater(report['metrics']['after_validation_accuracy'],report['metrics']['before_validation_accuracy']);self.assertAlmostEqual(report['metrics']['after_validation_accuracy'],1.0)
                self.assertEqual(report['details']['selected_epoch'],min(history,key=lambda r:r['validation_loss'])['epoch']);self.assertTrue(set(splits['train']).isdisjoint(splits['validation']));self.assertTrue(set(splits['test']).isdisjoint(splits['train']+splits['validation']))
                self.assertEqual(checkpoint,json.loads((ROOT/'experiments/data/intent-model.json').read_text()))
        self.assertEqual(*checkpoints)
    def test_03_data_no_leakage(self):
        broken=copy.deepcopy(DATA);broken['examples'][-1]['text']=broken['examples'][0]['text'];self.assertRaises(ValueError,CORE['validate_dataset'],broken)
        rows=[r for r in DATA['examples'] if r['split']=='train'];model=CORE['initialize'](rows,7);self.assertNotIn('unseenword',model['vocab']);self.assertEqual(CORE['tokenize']('Invoice PAYMENT 42'),['invoice','payment'])
    def test_04_invalid_model(self):
        m=json.loads((ROOT/'experiments/data/intent-model.json').read_text());m['weights'][0].pop();self.assertRaises(ValueError,CORE['validate_model'],m)
        m=json.loads((ROOT/'experiments/data/intent-model.json').read_text());m['weights'][0][0]=float('nan');self.assertRaises(ValueError,CORE['validate_model'],m)
    def test_05_invalid_training(self):
        self.assertRaises(ValueError,CORE['evaluate'],{},[])
        self.assertRaises(ValueError,CORE['train'],DATA,{'seed':True,'epochs':20,'batch_size':4,'learning_rate':.8})
        self.assertRaises(ValueError,CORE['tokenize'],'x'*513)
    def test_06_notebook_structure_and_failure(self):
        notebook=build(example());bad=copy.deepcopy(notebook);bad['cells'][-1]['source']=['if :'];self.assertRaises(ExecutorError,check,bad)
        notebook['cells'][-1]['source'].insert(0,'REFERENCE_MODEL["weights"] = []\n')
        with tempfile.TemporaryDirectory() as td:
            result=execute(notebook,td);self.assertNotEqual(result.returncode,0);report=json.loads((Path(td)/'result.json').read_text());self.assertEqual(report['status'],'failed');self.assertEqual(report['metrics'],{})
    def test_07_contract_mutations(self):
        for field,value in [('id','../../secret'),('recipe_id','arbitrary-python'),('schema_version',True),('objective','Bearer some-secret')]:
            job=example();job[field]=value;self.assertRaises((ExecutorError,TypeError),validate,job)
        job=example();job['token']='do-not-store';self.assertRaises(ExecutorError,validate,job)
        job=example();job['environment']['internet']=True;self.assertRaises(ExecutorError,validate,job)
    def test_08_static_exports_match_builder(self):
        for recipe in ['intent-inference','intent-training']:
            self.assertEqual(json.loads((ROOT/'experiments/notebooks'/f'{recipe}.ipynb').read_text()),build(example(recipe)))
            self.assertEqual(json.loads((ROOT/'experiments'/f'{recipe}-job.json').read_text()),example(recipe))
        self.assertEqual(set(assets()),{'core','runner','data','model'})

if __name__=='__main__':unittest.main(verbosity=2)
