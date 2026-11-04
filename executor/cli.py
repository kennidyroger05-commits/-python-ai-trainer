"""Operator-only reference CLI; no deployed server and no credential flags."""
import argparse
import json
import sys
import tempfile
from pathlib import Path
from .contracts import validate,fingerprint
from .errors import ExecutorError
from .transport import Policy
from .service import Executor
from .notebooks import build,metadata
from .local import execute
from . import files

def main(argv=None):
    parser=argparse.ArgumentParser(description='Offline-first Python AI Trainer executor. Remote actions require separate authorization.')
    parser.add_argument('operation',choices=['validate','prepare','local','submit','status','follow','logs','collect','stop-following'])
    parser.add_argument('--job',required=True);parser.add_argument('--workspace',default='.executor-state')
    parser.add_argument('--allow-network',action='store_true',help='Explicit operator authorization for this remote operation')
    parser.add_argument('--run',action='store_true',help='Also authorize execution on submit; without it only save a version')
    parser.add_argument('--owner');parser.add_argument('--approve',help='SHA-256 printed by validate; binds permission to this exact spec')
    parser.add_argument('--max-checks',type=int,default=10)
    args=parser.parse_args(argv)
    try:
        path=Path(args.job).absolute();job=files.read(path.parent,path.name,16384);validate(job)
        if args.operation=='validate':value={'valid':True,'spec_sha256':fingerprint(job),'network_used':False}
        else:
            policy=Policy(enabled=args.allow_network,allow_run=args.run,owner=args.owner,approved_sha256=args.approve)
            e=Executor(args.workspace,policy=policy)
            if args.operation=='prepare':
                state=e.prepare(job);root=e.directory(job['id'])
                with files.lock(root):
                    files.atomic(root,'experiment.ipynb',build(job));files.atomic(root,'kernel-metadata.json',metadata(job))
                value={'status':state['status'],'spec_sha256':fingerprint(job),'directory':str(root),'network_used':False}
            elif args.operation=='local':
                e.prepare(job);root=e.directory(job['id'])
                with files.lock(root),tempfile.TemporaryDirectory(prefix='local-',dir=root) as output:
                    value=execute(job,output);files.atomic(root,'local-report.json',value)
            elif args.operation=='submit':value=e.submit(job,run=args.run)
            elif args.operation=='status':value=e.status(job)
            elif args.operation=='logs':value=e.logs(job)
            elif args.operation=='collect':value=e.collect(job)
            elif args.operation=='stop-following':value=e.stop_following(job)
            else:
                try:value=e.follow(job,max_checks=args.max_checks)
                except KeyboardInterrupt:value=e.stop_following(job)
        print(json.dumps({'ok':True,'result':value},ensure_ascii=False,allow_nan=False));return 0
    except ExecutorError as error:
        print(json.dumps({'ok':False,'error':error.code}));return 2
    except (OSError,ValueError,TypeError,KeyError):
        print(json.dumps({'ok':False,'error':'INVALID_INPUT'}));return 2

if __name__=='__main__':sys.exit(main())
