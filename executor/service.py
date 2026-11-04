"""Stateful reference job lifecycle; no service is deployed or exposed over HTTP."""
import json
import re
import tempfile
import time
from pathlib import Path
from .contracts import fingerprint,validate,canonical,ROOT
from .notebooks import build,metadata
from .transport import Policy,SdkTransport
from .errors import ExecutorError,ERROR_CODES
from .artifacts import verify,expected,validate_cached_report
from . import files

STATUS={'QUEUED':'queued','RUNNING':'running','COMPLETE':'remote_complete','ERROR':'failed','CANCEL_REQUESTED':'cancel_requested','CANCEL_ACKNOWLEDGED':'cancelled','NEW_SCRIPT':'saved_only'}
class Executor:
    def __init__(self,root,*,policy=Policy(),transport=None,clock=time.time,sleep=time.sleep):
        candidate=Path(root).resolve()
        if candidate==ROOT or ROOT in candidate.parents:raise ExecutorError('PUBLIC_WORKSPACE')
        self.root=files.private_directory(root,private=True);self.policy=policy;self.transport=transport if transport is not None else SdkTransport(policy);self.clock=clock;self.sleep=sleep
    def directory(self,job_id):return files.private_directory(files.child(self.root,job_id),private=True)
    def _read(self,root):
        try:
            value=files.read(root,'state.json')
            required={'schema_version','id','spec','spec_sha256','status','remote_ref','remote_version','remote_status','last_error','next_check_after','monitoring_stopped','report','events'}
            if type(value) is not dict or set(value)-{'run_requested'}!=required or type(value['schema_version']) is not int or value['schema_version']!=1:raise ValueError()
            validate(value['spec'])
            if value['last_error'] is not None and value['last_error'] not in ERROR_CODES:raise ValueError()
            if type(value['monitoring_stopped']) is not bool or value['remote_status'] is not None and value['remote_status'] not in STATUS:raise ValueError()
            if value['remote_ref'] is not None and (type(value['remote_ref']) is not str or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{2,29}/pat-[a-z][a-z0-9-]{2,39}-[a-f0-9]{8}',value['remote_ref'])):raise ValueError()
            if value['id']!=root.name or value['spec']['id']!=root.name or value['spec_sha256']!=fingerprint(value['spec']) or value['status'] not in set(STATUS.values())|{'prepared','submitting','submission_unknown','submitted','completed','unknown'}:raise ValueError()
            if value['remote_version'] is not None and (type(value['remote_version']) is not int or not 1<=value['remote_version']<=999999999):raise ValueError()
            if not isinstance(value['next_check_after'],(int,float)) or not 0<=value['next_check_after']<1e12:raise ValueError()
            if not isinstance(value['events'],list) or len(value['events'])>200:raise ValueError()
            for event in value['events']:
                if type(event) is not dict or event.get('event') not in ['prepared','submit_requested','submitted','saved_only','submission_uncertain','artifacts_validated','reconciled']:raise ValueError()
                allowed={'prepared':{'event'},'submit_requested':{'event','run'},'submitted':{'event','version'},'saved_only':{'event','version'},'submission_uncertain':{'event'},'artifacts_validated':{'event'},'reconciled':{'event','version'}}[event['event']]
                if set(event)!=allowed or 'run' in event and type(event['run']) is not bool or 'version' in event and (type(event['version']) is not int or event['version']<1):raise ValueError()
            intent=any(e['event']=='submit_requested' and e['run'] is True for e in value['events'])
            if 'run_requested' not in value:value['run_requested']=intent  # additive recovery from durable observed history
            if type(value['run_requested']) is not bool or value['run_requested']!=intent:raise ValueError()
            if value['report'] is not None and (type(value['report']) is not dict or value['status']!='completed' or value['report'].get('spec_sha256')!=value['spec_sha256']):raise ValueError()
            if value['status']=='completed' and value['report'] is None:raise ValueError()
            if value['report'] is not None:validate_cached_report(value['report'],value['spec'],value['remote_ref'],value['remote_version'])
            return value
        except (ExecutorError,KeyError,TypeError,ValueError):raise ExecutorError('STATE_CORRUPT') from None
    def prepare(self,job):
        validate(job);root=self.directory(job['id']);sha=fingerprint(job)
        with files.lock(root):
            if (root/'state.json').exists():
                old=self._read(root)
                if old.get('spec_sha256')!=sha:raise ExecutorError('JOB_ID_CONFLICT')
                return old
            state={'schema_version':1,'id':job['id'],'spec':job,'spec_sha256':sha,'status':'prepared','remote_ref':None,'remote_version':None,'remote_status':None,'last_error':None,'next_check_after':0,'monitoring_stopped':False,'run_requested':False,'report':None,'events':[{'event':'prepared'}]}
            files.atomic(root,'state.json',state);return state
    def authorize(self,job,run=False):
        if self.policy.enabled is not True:raise ExecutorError('REMOTE_DISABLED')
        if self.policy.approved_sha256!=fingerprint(job):raise ExecutorError('APPROVAL_MISMATCH')
        if not isinstance(self.policy.owner,str) or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{2,29}',self.policy.owner):raise ExecutorError('INVALID_OWNER')
        if run and self.policy.allow_run is not True:raise ExecutorError('RUN_NOT_AUTHORIZED')
    def submit(self,job,*,run=False):
        if type(run) is not bool:raise ExecutorError('INVALID_JOB')
        job=json.loads(canonical(validate(job)))  # bind approval, upload and receipt to one immutable JSON snapshot
        self.authorize(validate(job),run);self.prepare(job);root=self.directory(job['id'])
        with files.lock(root):
            state=self._read(root)
            if state['status'] in ['submitting','submission_unknown']:raise ExecutorError('RECONCILIATION_REQUIRED')
            if state['remote_version'] and not (run and state['status']=='saved_only' and not state['run_requested']):return state
            self.transport.preflight()
            slug='pat-'+job['id']+'-'+state['spec_sha256'][:8];ref=self.policy.owner+'/'+slug
            files.atomic(root,'experiment.ipynb',build(job));files.atomic(root,'kernel-metadata.json',metadata(job,self.policy.owner,slug))
            # Durable fence BEFORE contacting Kaggle. A timeout cannot safely be retried as a new write.
            state.update(status='submitting',remote_ref=ref,remote_version=None,last_error=None,run_requested=state['run_requested'] or run);state['events'].append({'event':'submit_requested','run':run});files.atomic(root,'state.json',state)
            try:
                result=self.transport.call('submit',{'folder':str(root),'remote_ref':ref,'run':run})
                if type(result) is not dict or result.get('remote_ref')!=ref or type(result.get('version')) is not int or not 1<=result['version']<=999999999:raise ExecutorError('UNEXPECTED_RESPONSE')
            except ExecutorError as error:
                state.update(status='submission_unknown',last_error=error.code if error.code in ERROR_CODES else 'TRANSPORT_FAILURE');state['events'].append({'event':'submission_uncertain'});files.atomic(root,'state.json',state);raise
            state.update(status='submitted' if run else 'saved_only',remote_version=result['version']);state['events'].append({'event':'submitted' if run else 'saved_only','version':result['version']});files.atomic(root,'state.json',state);return state
    def _remote(self,state):
        if not state.get('remote_ref') or type(state.get('remote_version')) is not int or state['remote_version']<1:raise ExecutorError('RECONCILIATION_REQUIRED')
        expected_ref=self.policy.owner+'/pat-'+state['id']+'-'+state['spec_sha256'][:8]
        if state['remote_ref']!=expected_ref:raise ExecutorError('REMOTE_OWNER_MISMATCH')
        return state['remote_ref']+'/'+str(state['remote_version'])
    def status(self,job):
        self.authorize(validate(job));self.prepare(job);root=self.directory(job['id'])
        with files.lock(root):
            state=self._read(root)
            if state['status']=='completed':return state
            if self.clock()<state.get('next_check_after',0):raise ExecutorError('POLL_TOO_SOON')
            ref=self._remote(state)
            try:
                result=self.transport.call('status',{'version_ref':ref})
                if type(result) is not dict or set(result)!={'status'}:raise ExecutorError('UNEXPECTED_RESPONSE')
                remote=result['status']
                if remote not in STATUS:raise ExecutorError('UNEXPECTED_RESPONSE')
                state['remote_status']=remote;state['status']='unknown' if remote=='NEW_SCRIPT' and state['run_requested'] else STATUS[remote];state['last_error']='REMOTE_JOB_FAILED' if remote=='ERROR' else None
            except ExecutorError as error:
                state['last_error']=error.code if error.code in ERROR_CODES else 'TRANSPORT_FAILURE';state['next_check_after']=self.clock()+max(15,error.retry_after or self.policy.poll_seconds)*(2 if error.code=='RATE_LIMIT' and not error.retry_after else 1);files.atomic(root,'state.json',state);raise
            state['next_check_after']=self.clock()+max(15,self.policy.poll_seconds);files.atomic(root,'state.json',state);return state
    def logs(self,job):
        self.authorize(validate(job));state=self.prepare(job)
        return self.transport.call('logs',{'version_ref':self._remote(state)})
    def collect(self,job):
        self.authorize(validate(job));root=self.directory(job['id'])
        with files.lock(root):
            state=self._read(root)
            if state['status']=='completed':return state['report']
            if state['status']!='remote_complete':raise ExecutorError('JOB_NOT_COMPLETE')
            with tempfile.TemporaryDirectory(prefix='output-',dir=root) as folder:
                try:
                    self.transport.call('outputs',{'version_ref':self._remote(state),'destination':folder,'names':sorted(expected(job))})
                    artifact=verify(Path(folder),job)
                except ExecutorError as error:
                    state['last_error']=error.code if error.code in ERROR_CODES else 'TRANSPORT_FAILURE';files.atomic(root,'state.json',state);raise
            report={'schema_version':1,'status':'completed','spec':job,'spec_sha256':fingerprint(job),'provenance':{'source':'kaggle-sdk' if isinstance(self.transport,SdkTransport) else 'injected-transport','verification':'version-and-artifact-contract','remote_ref':state['remote_ref'],'remote_version':state['remote_version']},**artifact}
            state.update(status='completed',report=report,last_error=None);state['events'].append({'event':'artifacts_validated'});files.atomic(root,'state.json',state);files.atomic(root,'report.json',report);return report
    def snapshot(self,job):
        state=self.prepare(validate(job))
        if state['status']=='completed':return state['report']
        return {'schema_version':1,'status':state['status'],'spec':job,'spec_sha256':fingerprint(job),
          'provenance':{'source':'operator-state','verification':'local-state-only','remote_ref':state['remote_ref'],'remote_version':state['remote_version']},
          'notebook_result':None,'artifacts':[],'errors':[{'code':state['last_error']}] if state['last_error'] else []}
    def stop_following(self,job):
        self.prepare(validate(job));root=self.directory(job['id'])
        with files.lock(root):
            state=self._read(root);state['monitoring_stopped']=True;files.atomic(root,'state.json',state);return state
    def follow(self,job,*,max_checks=10,stop=lambda:False):
        if type(max_checks) is not int or not 1<=max_checks<=100:raise ExecutorError('INVALID_POLL_BUDGET')
        for _ in range(max_checks):
            if stop():return self.stop_following(job)
            previous=self.prepare(job);delay=max(0,min(300,previous.get('next_check_after',0)-self.clock()))
            if delay:self.sleep(delay)
            if stop():return self.stop_following(job)
            try:state=self.status(job)
            except ExecutorError as error:
                if error.code in ['RATE_LIMIT','TIMEOUT','REMOTE_UNAVAILABLE','SDK_FAILURE','POLL_TOO_SOON']:continue
                raise
            if state['status'] in ['completed','remote_complete','failed','cancelled','saved_only']:return state
            self.sleep(max(15,self.policy.poll_seconds))
        return self.prepare(job)
