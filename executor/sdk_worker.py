"""Bounded, non-interactive SDK worker. Not a server. Network is opt-in, never default."""
import contextlib
import io
import json
import os
from pathlib import Path
import re
import sys
if __package__ in [None,'']:
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from executor.errors import ExecutorError
from executor.artifacts import BASE, TRAIN

class Discard(io.TextIOBase):
    def write(self,value):return len(value)

def safe_logs(raw):
    if not isinstance(raw,str):raise ExecutorError('UNEXPECTED_RESPONSE')
    events=[];omitted=0
    for line in raw[:32768].splitlines()[:150]:
        try:row=json.loads(line)
        except (ValueError,TypeError):omitted+=1;continue
        if type(row) is dict and set(row)=={'event','error_type'} and row['event']=='failed' and row['error_type'] in ['ValueError','TypeError','KeyError','IndexError','MemoryError','AssertionError','RuntimeError','ImportError','SyntaxError']:
            events.append(row);continue
        if type(row) is dict and row.get('event') in ['dataset_loaded','epoch','inference_complete','artifacts_written'] and set(row)<={'event','train','validation','test','epoch','training_loss','validation_loss','validation_accuracy','examples','count'} and all(type(v) in [int,float] and 0<=v<1e8 for k,v in row.items() if k!='event'):
            events.append(row)
        else:omitted+=1
    return {'events':events,'omitted_lines':omitted,'truncated':len(raw)>32768,'source':'kaggle-sdk'}

def invoke(api,operation,payload):
    """All SDK calls are injectable; tests never import/authenticate Kaggle."""
    if operation=='submit':
        result=api.kernels_push(payload['folder'],timeout='300',acc=None,no_run=not payload['run'])
        version=getattr(result,'version_number',None);ref=getattr(result,'ref',None)
        if result is None or getattr(result,'error',None) or type(version) is not int or version<1 or ref!=payload['remote_ref']:
            raise ExecutorError('UNEXPECTED_RESPONSE')
        return {'remote_ref':ref,'version':version}
    ref=payload.get('version_ref')
    if not isinstance(ref,str) or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{2,29}/[a-z0-9][a-z0-9-]{2,79}/[1-9][0-9]{0,8}',ref):raise ExecutorError('INVALID_REMOTE_REF')
    if operation=='inspect':
        import tempfile
        from executor import files
        with tempfile.TemporaryDirectory(prefix='pat-pull-') as folder:
            root=Path(folder);files.atomic(root,'remote.ipynb',{})
            api.kernels_pull(ref,str(root/'remote.ipynb'),metadata=True,quiet=True)
            # Fixed pre-created file path prevents SDK slug-based file naming/traversal.
            return {'notebook':files.read(root,'remote.ipynb',262144),'metadata':files.read(root,'kernel-metadata.json',16384)}
    if operation=='status':
        response=api.kernels_status(ref);status=getattr(response,'status',None);name=getattr(status,'name',status)
        if name not in ['QUEUED','RUNNING','COMPLETE','ERROR','CANCEL_REQUESTED','CANCEL_ACKNOWLEDGED','NEW_SCRIPT']:raise ExecutorError('UNEXPECTED_RESPONSE')
        return {'status':name}
    if operation=='logs':return safe_logs(api.kernels_logs(ref))
    if operation=='outputs':
        destination=Path(payload['destination']);allowed=set(payload['names'])
        if not allowed<=BASE|TRAIN or len(allowed)<3:raise ExecutorError('INVALID_ARTIFACT_REQUEST')
        seen=set();token=None;total=0
        for page in range(5):
            listing=api.kernels_list_files(ref,page_token=token,page_size=100)
            rows=getattr(listing,'files',None)
            if not isinstance(rows,list):raise ExecutorError('UNEXPECTED_RESPONSE')
            for item in rows:
                name=getattr(item,'name',None);size=getattr(item,'size',None)
                if not isinstance(name,str) or not re.fullmatch(r'[a-zA-Z0-9_][a-zA-Z0-9._-]{0,100}',name):raise ExecutorError('UNSAFE_ARTIFACT')
                if type(size) is not int or size<0:raise ExecutorError('UNEXPECTED_RESPONSE')
                if name in allowed:
                    if name in seen:raise ExecutorError('UNEXPECTED_RESPONSE')
                    seen.add(name);total+=size
            if total>1048576:raise ExecutorError('ARTIFACT_TOO_LARGE')
            token=getattr(listing,'next_page_token',None)
            if not token:break
            if not isinstance(token,str) or len(token)>2048:raise ExecutorError('UNEXPECTED_RESPONSE')
        else:raise ExecutorError('PAGINATION_LIMIT')
        if seen!=allowed:raise ExecutorError('OUTPUT_MISSING')
        pattern=r'^(?:'+'|'.join(re.escape(n) for n in sorted(allowed))+r')$';token=''
        for page in range(5):
            response=api.kernels_output(ref,str(destination),file_pattern=pattern,force=True,quiet=True,page_token=token,page_size=100)
            if not isinstance(response,tuple) or len(response)!=2 or not isinstance(response[0],list):raise ExecutorError('UNEXPECTED_RESPONSE')
            for name in response[0]:
                p=Path(name)
                if p.parent.resolve()!=destination.resolve() or p.name not in allowed or p.is_symlink():raise ExecutorError('UNSAFE_ARTIFACT')
            token=response[1]
            if not token:break
            if not isinstance(token,str) or len(token)>2048:raise ExecutorError('UNEXPECTED_RESPONSE')
        else:raise ExecutorError('PAGINATION_LIMIT')
        return {'downloaded':sorted(allowed)}
    raise ExecutorError('INVALID_OPERATION')

def error_code(error):
    if isinstance(error,ExecutorError):return error.code
    status=getattr(getattr(error,'response',None),'status_code',None) or getattr(error,'status',None)
    if status==401:return 'AUTH_INVALID'
    if status==403:return 'ACCESS_DENIED'
    if status==404:return 'JOB_UNAVAILABLE'
    if status==429:return 'RATE_LIMIT'
    if type(status) is int and status>=500:return 'REMOTE_UNAVAILABLE'
    if 'timeout' in type(error).__name__.lower():return 'TIMEOUT'
    if isinstance(error,ValueError) and "Permission 'kernels.get' was denied" in str(error):return 'AUTH_OR_ACCESS_DENIED'
    return 'SDK_FAILURE'

def main():
    try:
        raw=sys.stdin.buffer.read(65537)
        if len(raw)>65536:raise ExecutorError('INVALID_REQUEST')
        request=json.loads(raw)
        if request.get('network_authorized') is not True:raise ExecutorError('REMOTE_DISABLED')
        if not os.environ.get('KAGGLE_API_TOKEN'):raise ExecutorError('AUTH_MISSING')
        # Avoid imports with authentication side effects until all explicit gates pass.
        from importlib.metadata import version,PackageNotFoundError
        try:
            if version('kaggle')!='2.2.5' or version('kagglesdk')!='0.1.38':raise ExecutorError('SDK_VERSION_UNTESTED')
        except PackageNotFoundError:raise ExecutorError('SDK_UNAVAILABLE') from None
        with contextlib.redirect_stdout(Discard()),contextlib.redirect_stderr(Discard()):
            from kaggle.api.kaggle_api_extended import KaggleApi
            api=KaggleApi();api.authenticate()
            result=invoke(api,request['operation'],request['payload'])
        print(json.dumps({'ok':True,'value':result},allow_nan=False))
    except BaseException as error:
        # Never include arbitrary SDK exception text, headers, tokens or raw response bodies.
        code=error_code(error);retry=None
        if code=='RATE_LIMIT':
            raw=getattr(getattr(error,'response',None),'headers',{}).get('Retry-After','')
            if isinstance(raw,str) and raw.isdigit():retry=max(15,min(300,int(raw)))
        print(json.dumps({'ok':False,'error':code,'retry_after':retry}))

if __name__=='__main__':main()
