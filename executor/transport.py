"""Optional SDK transport behind an explicit policy and a bounded subprocess."""
from dataclasses import dataclass
import json
import os
import subprocess
import sys
from .contracts import ROOT
from .errors import ExecutorError

@dataclass(frozen=True)
class Policy:
    enabled:bool=False
    allow_run:bool=False
    owner:str|None=None
    approved_sha256:str|None=None
    operation_timeout:int=60
    poll_seconds:int=15

class SdkTransport:
    def __init__(self,policy=Policy()):self.policy=policy
    def preflight(self):
        if not self.policy.enabled:raise ExecutorError('REMOTE_DISABLED')
        if not os.environ.get('KAGGLE_API_TOKEN'):raise ExecutorError('AUTH_MISSING')
    def call(self,operation,payload):
        self.preflight()
        if operation=='submit' and payload.get('run') and not self.policy.allow_run:raise ExecutorError('RUN_NOT_AUTHORIZED')
        timeout=max(1,min(self.policy.operation_timeout,60))
        def contain():
            import resource
            resource.setrlimit(resource.RLIMIT_AS,(512*1024*1024,512*1024*1024))
            resource.setrlimit(resource.RLIMIT_CPU,(45,45))
            resource.setrlimit(resource.RLIMIT_FSIZE,(1048576,1048576))
            resource.setrlimit(resource.RLIMIT_NOFILE,(128,128))
        if os.name!='posix':raise ExecutorError('PLATFORM_UNSUPPORTED')
        try:
            r=subprocess.run([sys.executable,'-I',str(ROOT/'executor/sdk_worker.py')],cwd=ROOT,input=json.dumps({'network_authorized':True,'operation':operation,'payload':payload}).encode(),capture_output=True,timeout=timeout,preexec_fn=contain)
        except subprocess.TimeoutExpired:raise ExecutorError('TIMEOUT') from None
        if r.returncode or len(r.stdout)>65536:raise ExecutorError('SDK_PROCESS_FAILED')
        try:
            response=json.loads(r.stdout)
            if response.get('ok') is not True:
                allowed={'REMOTE_DISABLED','AUTH_MISSING','AUTH_INVALID','ACCESS_DENIED','AUTH_OR_ACCESS_DENIED','JOB_UNAVAILABLE','RATE_LIMIT','REMOTE_UNAVAILABLE','TIMEOUT','SDK_FAILURE','SDK_UNAVAILABLE','SDK_VERSION_UNTESTED','UNEXPECTED_RESPONSE','UNSAFE_ARTIFACT','ARTIFACT_TOO_LARGE','OUTPUT_MISSING','PAGINATION_LIMIT'}
                code=response.get('error');raise ExecutorError(code if code in allowed else 'SDK_FAILURE',retry_after=response.get('retry_after'))
            return response['value']
        except (ValueError,KeyError,TypeError):raise ExecutorError('UNEXPECTED_RESPONSE') from None
