"""Closed, bounded artifact validation with deterministic checks for the two tiny recipes."""
import hashlib
import json
import math
import re
from datetime import datetime
from .contracts import fingerprint,validate
from .errors import ExecutorError
from . import files

BASE={'result.json','metrics.json','events.json'}
TRAIN={'checkpoint-best.json','history.json','splits.json'}
def expected(job):return BASE|TRAIN if job['experiment_type']=='training' else BASE
def number(v,low=0,high=1e12):return type(v) in [int,float] and math.isfinite(v) and low<=v<=high
def close(a,b):
    if type(a) is bool or type(b) is bool:return type(a) is type(b) and a==b
    if type(a) in [int,float] and type(b) in [int,float]:return number(a,-1e12) and number(b,-1e12) and math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-9)
    if type(a) is not type(b):return False
    if isinstance(a,dict):return set(a)==set(b) and all(close(a[k],b[k]) for k in a)
    if isinstance(a,list):return len(a)==len(b) and all(close(x,y) for x,y in zip(a,b))
    return a==b

def _verify(root,job):
    validate(job);names=expected(job);entries=list(root.iterdir())
    if any(p.is_symlink() or not p.is_file() or p.name not in names for p in entries):raise ExecutorError('UNSAFE_ARTIFACT')
    if {p.name for p in entries}!=names:raise ExecutorError('OUTPUT_MISSING')
    if sum(p.stat().st_size for p in entries)>job['resources']['max_artifact_bytes']:raise ExecutorError('ARTIFACT_TOO_LARGE')
    # Hash the same no-follow bytes that were parsed and validated; never reopen paths afterwards.
    documents={name:files.read_document(root,name) for name in names};values={name:item[0] for name,item in documents.items()}
    if sum(len(item[1]) for item in documents.values())>job['resources']['max_artifact_bytes']:raise ExecutorError('ARTIFACT_TOO_LARGE')
    _validate_values(values,job)
    return {'notebook_result':values['result.json'],'artifacts':[{'name':name,'bytes':len(documents[name][1]),'sha256':hashlib.sha256(documents[name][1]).hexdigest()} for name in sorted(names)]}

def _validate_values(values,job,*,check_files=True):
    result=values['result.json'];metrics=values['metrics.json']
    def require(ok):
        if not ok:raise ExecutorError('INVALID_ARTIFACT')
    require(type(result) is dict and set(result)=={'schema_version','status','spec_sha256','recipe_id','experiment_type','provenance','metrics','details','errors'})
    require(type(result['schema_version']) is int and result['schema_version']==1 and result['status']=='completed' and result['spec_sha256']==fingerprint(job) and result['recipe_id']==job['recipe_id'] and result['experiment_type']==job['experiment_type'] and result['errors']==[] and close(result['metrics'],metrics))
    p=result['provenance'];require(type(p) is dict and set(p)=={'source','python','libraries','platform','started_at','duration_ms','model_kind','parameters','dataset','remote_verified'})
    require(p['source']=='notebook-process' and p['remote_verified'] is False and type(p['parameters']) is int and p['parameters']==87 and p['model_kind']=='linear-softmax' and p['dataset']=='synthetic-intents-30-v1')
    require(type(p['python']) is str and re.fullmatch(r'3\.\d{1,2}\.\d{1,3}',p['python']) and p['libraries']=={'stdlib':p['python']} and p['platform'] in ['Linux','Darwin','Windows'] and number(p['duration_ms'],0,300000))
    require(type(p['started_at']) is str and datetime.fromisoformat(p['started_at']).utcoffset() is not None)
    # Sources are fixed repository assets, never a caller-selected module/path.
    from .notebooks import assets
    raw=assets();core={};exec(compile(raw['core'],'<verified-recipe>','exec'),core)
    data=json.loads(raw['data']);reference=json.loads(raw['model'])
    if job['experiment_type']=='inference':
        require(type(metrics) is dict and set(metrics)=={'prediction_count','input_word_tokens','latency_ms_total','peak_process_memory_kib'})
        details=result['details'];require(type(details) is dict and set(details)=={'predictions','scores_are_calibrated','tokenizer'} and details['scores_are_calibrated'] is False and details['tokenizer']=='lower-ascii-words-v1')
        require(type(details['predictions']) is list and len(details['predictions'])==len(job['config']['inputs']))
        total=0;latency=0.0
        for text,row in zip(job['config']['inputs'],details['predictions']):
            require(type(row) is dict and set(row)=={'input','tokens','label','scores','word_tokens','latency_ms'} and row['input']==text and row['tokens']==core['tokenize'](text))
            prediction=core['predict'](reference,text)
            require(close({k:row[k] for k in ['label','scores','word_tokens']},prediction) and type(row['word_tokens']) is int and number(row['latency_ms'],0,300000))
            total+=row['word_tokens'];latency+=row['latency_ms']
        require(type(metrics['prediction_count']) is int and metrics['prediction_count']==len(details['predictions']) and type(metrics['input_word_tokens']) is int and metrics['input_word_tokens']==total and number(metrics['latency_ms_total'],0,300000) and math.isclose(metrics['latency_ms_total'],latency,abs_tol=1e-6))
        events=[{'event':'dataset_loaded','train':18,'validation':6,'test':6},{'event':'inference_complete','examples':len(details['predictions'])}]
    else:
        require(type(metrics) is dict and set(metrics)=={'before_validation_accuracy','after_validation_accuracy','heldout_test_accuracy','training_loss_last','validation_loss_best','epochs_completed','selected_epoch','peak_process_memory_kib'})
        # This recipe is intentionally tiny: replay its seeded numerical work locally to detect
        # fabricated before/after numbers, split changes, extra parameters and false history.
        # This validates values; it does NOT replace or fabricate remote timing measurements.
        replay=core['train'](data,job['config'])
        if check_files:require(close(values['history.json'],replay['history']) and close(values['checkpoint-best.json'],replay['model']) and values['splits.json']==replay['splits'])
        require(type(metrics['epochs_completed']) is int and metrics['epochs_completed']==len(replay['history']) and type(metrics['selected_epoch']) is int and metrics['selected_epoch']==replay['selected_epoch'])
        for k,expected_value in {'before_validation_accuracy':replay['before_validation']['accuracy'],'after_validation_accuracy':replay['after_validation']['accuracy'],'heldout_test_accuracy':replay['heldout_test']['accuracy'],'training_loss_last':replay['history'][-1]['training_loss'],'validation_loss_best':replay['after_validation']['loss']}.items():require(number(metrics[k],0,100) and close(metrics[k],expected_value))
        require(close(result['details'],{k:replay[k] for k in ['before_validation','after_validation','heldout_test','selected_epoch']}))
        events=[{'event':'dataset_loaded','train':18,'validation':6,'test':6},*replay['history']]
    if check_files:require(close(values['events.json'],events))
    require(metrics['peak_process_memory_kib'] is None or number(metrics['peak_process_memory_kib'],0,1048576))

def validate_cached_report(report,job,remote_ref,remote_version):
    """Revalidate the closed ledger snapshot; this is not a cryptographic remote attestation."""
    try:
        def require(ok):
            if not ok:raise ExecutorError('INVALID_ARTIFACT')
        require(type(report) is dict and set(report)=={'schema_version','status','spec','spec_sha256','provenance','notebook_result','artifacts'})
        require(type(report['schema_version']) is int and report['schema_version']==1 and report['status']=='completed' and validate(report['spec'])==job and report['spec_sha256']==fingerprint(job))
        p=report['provenance'];require(type(p) is dict and set(p)=={'source','verification','remote_ref','remote_version'} and p['source'] in ['kaggle-sdk','injected-transport'] and p['verification']=='version-and-artifact-contract' and p['remote_ref']==remote_ref and type(p['remote_version']) is int and p['remote_version']==remote_version)
        result=report['notebook_result'];_validate_values({'result.json':result,'metrics.json':result['metrics']},job,check_files=False)
        rows=report['artifacts'];require(type(rows) is list and all(type(a) is dict and set(a)=={'name','bytes','sha256'} and type(a['name']) is str and a['name'] in expected(job) and type(a['bytes']) is int and number(a['bytes'],0,1048576) and type(a['sha256']) is str and re.fullmatch(r'[a-f0-9]{64}',a['sha256']) for a in rows))
        require(sorted(a['name'] for a in rows)==sorted(expected(job)) and sum(a['bytes'] for a in rows)<=job['resources']['max_artifact_bytes'])
    except ExecutorError:raise
    except (ValueError,TypeError,KeyError,AttributeError,RecursionError):raise ExecutorError('INVALID_ARTIFACT') from None

def verify(root,job):
    try:return _verify(root,job)
    except ExecutorError:raise
    except (ValueError,TypeError,KeyError,AttributeError,RecursionError):raise ExecutorError('INVALID_ARTIFACT') from None
