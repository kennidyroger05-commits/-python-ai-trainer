# This source is embedded after the trusted model implementation and fixed fixtures.
import os
import platform
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

def run_notebook(job,data,reference_model):
    destination=Path(os.environ.get('TRAINER_OUTPUT_DIR','/kaggle/working'))
    destination.mkdir(parents=True,exist_ok=True)
    events=[];started=time.perf_counter();stamp=datetime.now(timezone.utc).isoformat()
    def save(name,value):
        path=destination/name
        if path.is_symlink():raise ValueError('Output symlinks are not allowed')
        path.write_text(json.dumps(value,ensure_ascii=False,indent=2,allow_nan=False))
    def event(row):
        events.append(row);print(json.dumps(row,allow_nan=False))
    def peak_memory():
        try:
            import resource
            value=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            return int(value/1024 if sys.platform=='darwin' else value)
        except (ImportError,AttributeError):return None
    try:
        if sys.version_info<(3,10):raise RuntimeError('Python 3.10 or newer required')
        validate_dataset(data);event({'event':'dataset_loaded','train':18,'validation':6,'test':6})
        if job['experiment_type']=='inference':
            model=validate_model(reference_model);predictions=[];total_tokens=0;latency=0.0
            for text in job['config']['inputs']:
                begin=time.perf_counter();p=predict(model,text);elapsed=(time.perf_counter()-begin)*1000
                predictions.append({'input':text,'tokens':tokenize(text),**p,'latency_ms':elapsed});total_tokens+=p['word_tokens'];latency+=elapsed
            metrics={'prediction_count':len(predictions),'input_word_tokens':total_tokens,'latency_ms_total':latency,'peak_process_memory_kib':peak_memory()}
            details={'predictions':predictions,'scores_are_calibrated':False,'tokenizer':TOKENIZER}
            event({'event':'inference_complete','examples':len(predictions)})
        elif job['experiment_type']=='training':
            result=train(data,job['config'],event)
            metrics={'before_validation_accuracy':result['before_validation']['accuracy'],'after_validation_accuracy':result['after_validation']['accuracy'],'heldout_test_accuracy':result['heldout_test']['accuracy'],
              'training_loss_last':result['history'][-1]['training_loss'],'validation_loss_best':result['after_validation']['loss'],'epochs_completed':len(result['history']),'selected_epoch':result['selected_epoch'],'peak_process_memory_kib':peak_memory()}
            details={'before_validation':result['before_validation'],'after_validation':result['after_validation'],'heldout_test':result['heldout_test'],'selected_epoch':result['selected_epoch']}
            save('checkpoint-best.json',result['model']);save('history.json',result['history']);save('splits.json',result['splits'])
        else:raise ValueError('Unsupported fixed experiment recipe')
        report={'schema_version':1,'status':'completed','spec_sha256':digest(job),'recipe_id':job['recipe_id'],'experiment_type':job['experiment_type'],
          'provenance':{'source':'notebook-process','python':platform.python_version(),'libraries':{'stdlib':platform.python_version()},'platform':platform.system(),'started_at':stamp,'duration_ms':(time.perf_counter()-started)*1000,'model_kind':'linear-softmax','parameters':87,'dataset':'synthetic-intents-30-v1','remote_verified':False},
          'metrics':metrics,'details':details,'errors':[]}
        save('metrics.json',metrics);save('result.json',report);save('events.json',events)
        event({'event':'artifacts_written','count':6 if job['experiment_type']=='training' else 3})
        return report
    except Exception as error:
        # Do not log inputs, environment variables or arbitrary exception values.
        failed={'schema_version':1,'status':'failed','spec_sha256':digest(job),'recipe_id':job['recipe_id'],'errors':[{'code':'NOTEBOOK_FAILURE','type':type(error).__name__}],'metrics':{}}
        save('result.json',failed);event({'event':'failed','error_type':type(error).__name__});raise

REPORT = run_notebook(JOB, DATA, REFERENCE_MODEL)
