"""Private operator workspace; atomic JSON and no-follow paths. POSIX reference."""
import contextlib
import json
import os
import re
import stat
import tempfile
import time
from pathlib import Path
from .errors import ExecutorError

def private_directory(path):
    path=Path(os.path.abspath(path))
    # Reject symlinks in any existing path component before creating children.
    for p in [path,*path.parents]:
        if p.is_symlink():raise ExecutorError('UNSAFE_PATH')
    path.mkdir(parents=True,exist_ok=True,mode=0o700)
    if not path.is_dir():raise ExecutorError('UNSAFE_PATH')
    return path

def child(root,name):
    if not isinstance(name,str) or not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}',name) or name in ['.','..']:
        raise ExecutorError('UNSAFE_PATH')
    p=root/name
    if p.is_symlink():raise ExecutorError('UNSAFE_PATH')
    return p

def atomic(root,name,value):
    path=child(root,name)
    fd,temp=tempfile.mkstemp(prefix='.atomic-',dir=root)
    try:
        os.fchmod(fd,0o600)
        with os.fdopen(fd,'w') as out:
            json.dump(value,out,ensure_ascii=False,sort_keys=True,allow_nan=False);out.flush();os.fsync(out.fileno())
        if path.is_symlink():raise ExecutorError('UNSAFE_PATH')
        os.replace(temp,path)
    finally:
        if os.path.exists(temp):os.unlink(temp)

def read(root,name,maximum=1048576):
    p=child(root,name)
    try:
        fd=os.open(p,os.O_RDONLY|getattr(os,'O_NOFOLLOW',0))
        with os.fdopen(fd,'rb') as f:
            info=os.fstat(f.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_size>maximum:raise ExecutorError('UNSAFE_ARTIFACT')
            raw=f.read(maximum+1)
            if len(raw)>maximum:raise ExecutorError('UNSAFE_ARTIFACT')
        def unique(pairs):
            result={}
            for k,v in pairs:
                if k in result:raise ValueError('duplicate JSON key')
                result[k]=v
            return result
        return json.loads(raw,object_pairs_hook=unique,parse_constant=lambda value:(_ for _ in ()).throw(ValueError('nonfinite JSON')))
    except FileNotFoundError:raise ExecutorError('OUTPUT_MISSING') from None
    except (ValueError,UnicodeError,TypeError,RecursionError):raise ExecutorError('INVALID_ARTIFACT') from None
    except OSError:raise ExecutorError('UNSAFE_PATH') from None

@contextlib.contextmanager
def lock(root):
    try:import fcntl
    except ImportError:raise ExecutorError('PLATFORM_UNSUPPORTED') from None
    fd=os.open(child(root,'job.lock'),os.O_CREAT|os.O_RDWR|getattr(os,'O_NOFOLLOW',0),0o600)
    try:
        try:fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:raise ExecutorError('JOB_BUSY') from None
        yield
    finally:os.close(fd)
