"""Closed public job contract. No credentials, URLs, paths or arbitrary code."""
import hashlib
import json
import math
import re
from pathlib import Path
from .errors import ExecutorError

ROOT=Path(__file__).resolve().parents[1]
RECIPES={'intent-inference':'inference','intent-training':'training'}
STATES={'prepared','submitting','submitted','saved_only','submission_unknown','queued','running','remote_complete','completed','failed','unknown'}

def canonical(value):
    def normalize(v):
        if type(v) is float and math.isfinite(v) and v.is_integer():return int(v)
        if isinstance(v,dict):return {k:normalize(n) for k,n in v.items()}
        if isinstance(v,list):return [normalize(n) for n in v]
        return v
    return json.dumps(normalize(value),ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)

def fingerprint(value):return hashlib.sha256(canonical(value).encode()).hexdigest()

def manifest():return json.loads((ROOT/'experiments/assets.json').read_text())

def exact(value,keys):return type(value) is dict and set(value)==set(keys)
def integer(v,low,high):return type(v) is int and low<=v<=high

def validate(job, assets=None):
    a=assets or manifest()
    def require(ok):
        if not ok:raise ExecutorError('INVALID_JOB')
    require(exact(job,['schema_version','id','recipe_id','experiment_type','model','dataset','objective','environment','config','resources','provenance']))
    require(job['schema_version']==2 and type(job['schema_version']) is int)
    require(type(job['id']) is str and re.fullmatch(r'[a-z][a-z0-9-]{2,39}',job['id']) and job['id'] not in ['constructor','prototype'])
    require(type(job['recipe_id']) is str and job['recipe_id'] in RECIPES and job['experiment_type']==RECIPES[job['recipe_id']])
    text=job['objective'];require(type(text) is str and 1<=len(text)<=300 and not re.search(r'[\x00-\x1f]|https?://|token|secret|password|api[_-]?key|bearer',text,re.I))
    model=job['model'];require(exact(model,['id','parameters','weights_sha256']) and model['id']=='tiny-intent-softmax-v1' and type(model['parameters']) is int and model['parameters']==a['parameters'])
    require(model['weights_sha256']==(a['files']['model']['sha256'] if job['experiment_type']=='inference' else None))
    require(job['dataset']=={'id':'synthetic-intents-30-v1','sha256':a['files']['data']['sha256'],'train_examples':18,'validation_examples':6,'test_examples':6})
    require(canonical(job['environment'])==canonical({'python_min':'3.10','libraries':{'stdlib':'builtin'},'hardware':{'device':'cpu','memory_mb':512},'internet':False}))
    require(job['resources']=={'timeout_seconds':300,'max_artifact_bytes':1048576})
    require(canonical(job['provenance'])==canonical({'template_version':1,'core_sha256':a['files']['core']['sha256'],'producer':'python-ai-trainer'}))
    config=job['config']
    if job['experiment_type']=='inference':
        require(exact(config,['inputs']) and type(config['inputs']) is list and 1<=len(config['inputs'])<=8)
        require(all(type(s) is str and 1<=len(s.strip())<=512 and not re.search(r'[\x00-\x1f]',s) for s in config['inputs']))
    else:
        require(exact(config,['seed','epochs','batch_size','learning_rate']) and integer(config['seed'],0,2147483647) and integer(config['epochs'],1,100) and integer(config['batch_size'],1,16) and type(config['learning_rate']) in [int,float] and config['learning_rate'] in [.1,.2,.4,.8])
    require(len(canonical(job).encode())<=16384)
    return job

def example(recipe='intent-inference'):
    a=manifest();kind=RECIPES[recipe]
    return {'schema_version':2,'id':recipe+'-study','recipe_id':recipe,'experiment_type':kind,
      'model':{'id':'tiny-intent-softmax-v1','parameters':a['parameters'],'weights_sha256':a['files']['model']['sha256'] if kind=='inference' else None},
      'dataset':{'id':'synthetic-intents-30-v1','sha256':a['files']['data']['sha256'],'train_examples':18,'validation_examples':6,'test_examples':6},
      'objective':'Run real tiny linear-model '+kind+' on synthetic intent data; no LLM or external download.',
      'environment':{'python_min':'3.10','libraries':{'stdlib':'builtin'},'hardware':{'device':'cpu','memory_mb':512},'internet':False},
      'config':{'inputs':['invoice payment request','support login issue','schedule meeting time']} if kind=='inference' else {'seed':7,'epochs':20,'batch_size':4,'learning_rate':.8},
      'resources':{'timeout_seconds':300,'max_artifact_bytes':1048576},
      'provenance':{'template_version':1,'core_sha256':a['files']['core']['sha256'],'producer':'python-ai-trainer'}}
