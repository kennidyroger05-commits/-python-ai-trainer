"""Execute only fixed bundled notebooks locally in a bounded, secret-free subprocess."""
import os
import resource
import subprocess
import sys
from pathlib import Path
from .contracts import validate, fingerprint
from .notebooks import build
from .errors import ExecutorError
from .artifacts import verify
from . import files

def containment():
    resource.setrlimit(resource.RLIMIT_AS,(256*1024*1024,256*1024*1024))
    resource.setrlimit(resource.RLIMIT_CPU,(10,10))
    resource.setrlimit(resource.RLIMIT_FSIZE,(2*1024*1024,2*1024*1024))
    resource.setrlimit(resource.RLIMIT_NOFILE,(64,64))

def execute(job,root):
    validate(job);root=files.private_directory(root)
    if list(root.iterdir()):raise ExecutorError('OUTPUT_DIRECTORY_NOT_EMPTY')
    notebook=build(job);source='\n'.join(''.join(c['source']) for c in notebook['cells'] if c['cell_type']=='code')
    try:
        result=subprocess.run([sys.executable,'-I','-c',source],env={'PATH':os.defpath,'LANG':'C.UTF-8','TRAINER_OUTPUT_DIR':str(root)},capture_output=True,timeout=15,preexec_fn=containment)
    except subprocess.TimeoutExpired:raise ExecutorError('LOCAL_TIMEOUT') from None
    if result.returncode:raise ExecutorError('LOCAL_EXECUTION_FAILED')
    artifact=verify(root,job)
    return {'schema_version':1,'status':'completed','spec':job,'spec_sha256':fingerprint(job),
      'provenance':{'source':'local-cpu','verification':'bounded-local-process','remote_ref':None,'remote_version':None},**artifact}
