"""Build only bundled, hash-verified recipes. Never accept a caller's Python/notebook source."""
import base64
import copy
import hashlib
import json
from .contracts import ROOT, manifest, validate
from .errors import ExecutorError

def assets():
    m=manifest();loaded={}
    for key,entry in m['files'].items():
        if entry['path'] not in ['recipes/tiny_intent.py','recipes/run_experiment.py','data/synthetic-intents.json','data/intent-model.json']:
            raise ExecutorError('ASSET_PATH_REJECTED')
        p=ROOT/'experiments'/entry['path']
        if p.is_symlink():raise ExecutorError('ASSET_PATH_REJECTED')
        raw=p.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=entry['sha256']:raise ExecutorError('ASSET_INTEGRITY')
        loaded[key]=raw.decode()
    return loaded

def config_source(job):
    encoded=base64.b64encode(json.dumps(job,ensure_ascii=False,allow_nan=False).encode()).decode()
    return 'import base64, json\nJOB = json.loads(base64.b64decode("'+encoded+'"))\n'

def build(job):
    validate(job);a=assets()
    def code(id,source):return {'id':id,'cell_type':'code','metadata':{},'execution_count':None,'outputs':[],'source':source.splitlines(keepends=True)}
    def encoded(name,value):
        encoded_value=base64.b64encode(value.encode()).decode()
        checksum=hashlib.sha256(value.encode()).hexdigest()
        return name+'_BYTES = base64.b64decode("'+encoded_value+'")\nassert hashlib.sha256('+name+'_BYTES).hexdigest() == "'+checksum+'"\n'+name+' = json.loads('+name+'_BYTES)\n'
    notebook={'nbformat':4,'nbformat_minor':5,'metadata':{'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},'language_info':{'name':'python'}},'cells':[
      {'id':'goal','cell_type':'markdown','metadata':{},'source':['# Tiny intent model — real CPU '+job['experiment_type']+'\n','A small linear softmax classifier (87 parameters), not an LLM. Synthetic data only. No network/download/GPU. Scores are not calibrated; six validation/test examples do not prove general quality.\n','Review and authorize any Kaggle execution separately. Never place credentials in this notebook.\n']},
      code('job-config',config_source(job)),code('model-implementation',a['core']),code('fixed-data',encoded('DATA',a['data'])+encoded('REFERENCE_MODEL',a['model'])),code('run-and-export',a['runner'])]}
    check(notebook);return notebook

def check(notebook):
    if not isinstance(notebook,dict) or notebook.get('nbformat')!=4 or not isinstance(notebook.get('cells'),list):raise ExecutorError('INVALID_NOTEBOOK')
    ids=set()
    for cell in notebook['cells']:
        if not isinstance(cell,dict) or cell.get('id') in ids or not cell.get('id') or cell.get('cell_type') not in ['markdown','code']:raise ExecutorError('INVALID_NOTEBOOK')
        ids.add(cell['id']);source=cell.get('source')
        if not isinstance(source,list) or not all(isinstance(s,str) for s in source):raise ExecutorError('INVALID_NOTEBOOK')
        if cell['cell_type']=='code':
            if cell.get('execution_count') is not None or cell.get('outputs')!=[]:raise ExecutorError('INVALID_NOTEBOOK')
            try:compile(''.join(source),'<bundled-notebook>','exec')
            except SyntaxError:raise ExecutorError('INVALID_NOTEBOOK') from None
    if ids!={'goal','job-config','model-implementation','fixed-data','run-and-export'}:raise ExecutorError('INVALID_NOTEBOOK')
    return notebook

def metadata(job,owner='YOUR_USERNAME',slug=None):
    validate(job)
    return {'id':owner+'/'+(slug or job['id']),'title':'Python AI Trainer '+job['experiment_type'],'code_file':'experiment.ipynb','language':'python','kernel_type':'notebook','is_private':True,'enable_gpu':False,'enable_tpu':False,'enable_internet':False,'dataset_sources':[],'competition_sources':[],'kernel_sources':[],'model_sources':[]}
