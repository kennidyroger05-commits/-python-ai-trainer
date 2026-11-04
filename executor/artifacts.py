"""Validate bounded JSON artifacts before treating an observed remote job as completed."""
import hashlib
import math
import re
from datetime import datetime
from .contracts import fingerprint, validate, ROOT
from .errors import ExecutorError
from . import files

BASE={'result.json','metrics.json','events.json'}
TRAIN={'checkpoint-best.json','history.json','splits.json'}

def expected(job):return BASE|TRAIN if job['experiment_type']=='training' else BASE

def number(value,low=0,high=1e12):return type(value) in [int,float] and math.isfinite(value) and low<=value<=high

def verify(root,job):
    validate(job)
    names=expected(job)
    entries=list(root.iterdir())
    if any(p.is_symlink() or not p.is_file() or p.name not in names for p in entries):raise ExecutorError('UNSAFE_ARTIFACT')
    if {p.name for p in entries}!=names:raise ExecutorError('OUTPUT_MISSING')
    if sum(p.stat().st_size for p in entries)>job['resources']['max_artifact_bytes']:raise ExecutorError('ARTIFACT_TOO_LARGE')
    values={name:files.read(root,name) for name in names};result=values['result.json'];metrics=values['metrics.json']
    def require(ok):
        if not ok:raise ExecutorError('INVALID_ARTIFACT')
    require(type(result) is dict and set(result)=={'schema_version','status','spec_sha256','recipe_id','experiment_type','provenance','metrics','details','errors'})
    require(result['schema_version']==1 and result['status']=='completed' and result['spec_sha256']==fingerprint(job) and result['recipe_id']==job['recipe_id'] and result['experiment_type']==job['experiment_type'] and result['errors']==[] and result['metrics']==metrics)
    p=result['provenance']
    require(type(p) is dict and set(p)=={'source','python','libraries','platform','started_at','duration_ms','model_kind','parameters','dataset','remote_verified'})
    require(p['source']=='notebook-process' and p['remote_verified'] is False and p['parameters']==87 and p['model_kind']=='linear-softmax' and p['dataset']=='synthetic-intents-30-v1')
    require(type(p['python']) is str and re.fullmatch(r'3\.\d{1,2}\.\d{1,3}',p['python']) and p['libraries']=={'stdlib':p['python']} and p['platform'] in ['Linux','Darwin','Windows'] and number(p['duration_ms'],0,300000))
    try:require(datetime.fromisoformat(p['started_at']).utcoffset() is not None)
    except (TypeError,ValueError):raise ExecutorError('INVALID_ARTIFACT') from None
    events=values['events.json'];require(type(events) is list and len(events)<=105)
    for event in events:
        require(type(event) is dict and event.get('event') in ['dataset_loaded','epoch','inference_complete'])
        allowed={'dataset_loaded':{'event','train','validation','test'},'epoch':{'event','epoch','training_loss','validation_loss','validation_accuracy'},'inference_complete':{'event','examples'}}[event['event']]
        require(set(event)==allowed and all(number(v) for k,v in event.items() if k!='event'))
    if job['experiment_type']=='inference':
        require(type(metrics) is dict and set(metrics)=={'prediction_count','input_word_tokens','latency_ms_total','peak_process_memory_kib'})
        d=result['details'];require(type(d) is dict and set(d)=={'predictions','scores_are_calibrated','tokenizer'} and d['scores_are_calibrated'] is False and d['tokenizer']=='lower-ascii-words-v1')
        require(type(d['predictions']) is list and len(d['predictions'])==len(job['config']['inputs']))
        total=0;latency=0
        for text,row in zip(job['config']['inputs'],d['predictions']):
            require(type(row) is dict and set(row)=={'input','tokens','label','scores','word_tokens','latency_ms'} and row['input']==text and row['tokens']==re.findall('[a-z]+',text.lower()))
            scores=row['scores'];require(type(scores) is dict and set(scores)=={'billing','support','schedule'} and all(number(v,0,1) for v in scores.values()) and math.isclose(sum(scores.values()),1,abs_tol=1e-9))
            require(row['label']==max(['billing','support','schedule'],key=lambda k:scores[k]) and row['word_tokens']==len(row['tokens']) and number(row['latency_ms'],0,300000))
            total+=row['word_tokens'];latency+=row['latency_ms']
        require(metrics['prediction_count']==len(d['predictions']) and metrics['input_word_tokens']==total and number(metrics['latency_ms_total'],0,300000) and math.isclose(metrics['latency_ms_total'],latency,abs_tol=1e-6))
    else:
        require(type(metrics) is dict and set(metrics)=={'before_validation_accuracy','after_validation_accuracy','heldout_test_accuracy','training_loss_last','validation_loss_best','epochs_completed','selected_epoch','peak_process_memory_kib'})
        for key in ['before_validation_accuracy','after_validation_accuracy','heldout_test_accuracy']:require(number(metrics[key],0,1))
        for key in ['training_loss_last','validation_loss_best']:require(number(metrics[key],0,100))
        history=values['history.json'];require(type(history) is list and len(history)==job['config']['epochs'] and metrics['epochs_completed']==len(history))
        for i,row in enumerate(history):require(type(row) is dict and set(row)=={'event','epoch','training_loss','validation_loss','validation_accuracy'} and row['event']=='epoch' and row['epoch']==i+1 and number(row['training_loss'],0,100) and number(row['validation_loss'],0,100) and number(row['validation_accuracy'],0,1))
        best=min(history,key=lambda row:row['validation_loss']);require(metrics['selected_epoch']==best['epoch'] and metrics['validation_loss_best']==best['validation_loss'] and metrics['training_loss_last']==history[-1]['training_loss'])
        splits=values['splits.json'];require(type(splits) is dict and set(splits)=={'train','validation','test'} and [len(splits[k]) for k in ['train','validation','test']]==[18,6,6])
        require(all(type(row) is str and re.fullmatch(r'(billing|support|schedule)-(train|validation|test)-[1-6]',row) for group in splits.values() for row in group) and len(set(sum(splits.values(),[])))==30)
        # Verify the claimed checkpoint actually gives the reported metrics on the fixed data.
        import runpy,json
        core=runpy.run_path(str(ROOT/'experiments/recipes/tiny_intent.py'));model=core['validate_model'](values['checkpoint-best.json']);data=json.loads((ROOT/'experiments/data/synthetic-intents.json').read_text())
        for split,key in [('validation','after_validation_accuracy'),('test','heldout_test_accuracy')]:require(math.isclose(core['evaluate'](model,[r for r in data['examples'] if r['split']==split])['accuracy'],metrics[key],abs_tol=1e-9))
        require(math.isclose(core['evaluate'](model,[r for r in data['examples'] if r['split']=='validation'])['loss'],metrics['validation_loss_best'],abs_tol=1e-9))
    require(metrics['peak_process_memory_kib'] is None or number(metrics['peak_process_memory_kib'],0,1048576))
    return {'notebook_result':result,'artifacts':[{'name':name,'bytes':(root/name).stat().st_size,'sha256':hashlib.sha256((root/name).read_bytes()).hexdigest()} for name in sorted(names)]}
