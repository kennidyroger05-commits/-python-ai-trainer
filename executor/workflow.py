"""Operator workflow on top of the existing artifact/SDK executor. No public listener."""
from dataclasses import replace
import json
from . import files
from .contracts import canonical, fingerprint, validate
from .errors import ExecutorError
from .service import Executor
from .package import execution, source_identity
from .notebooks import build, metadata
from .sdk_worker import safe_logs

class Workflow(Executor):
    def __init__(self,root,*,policy,**kwargs):
        self.operator_policy=policy
        super().__init__(root,policy=policy,**kwargs)
    def descriptor(self,job):return execution(validate(job),self.operator_policy.owner,self.operator_policy.allow_run)
    def approve(self,job):
        """Offline receipt. The operator must supply the independently reviewed execution hash."""
        job=json.loads(canonical(validate(job)));descriptor=self.descriptor(job)
        if self.operator_policy.approved_sha256!=fingerprint(descriptor):raise ExecutorError('APPROVAL_MISMATCH')
        root=self.directory(job['id']);self.prepare(job)
        with files.lock(root):
            state=self._read(root)
            if state['status'] not in ['prepared','saved_only']:raise ExecutorError('APPROVAL_LOCKED')
            files.atomic(root,'experiment.ipynb',build(job))
            slug='pat-'+job['id']+'-'+fingerprint(job)[:8]
            files.atomic(root,'kernel-metadata.json',metadata(job,self.operator_policy.owner,slug))
            receipt={'execution':descriptor,'execution_sha256':fingerprint(descriptor)}
            files.atomic(root,'authorization.json',receipt)
        return {'status':'authorized',**receipt,'network_used':False}
    def authorize(self,job,run=False):
        if self.operator_policy.enabled is not True:raise ExecutorError('REMOTE_DISABLED')
        descriptor=self.descriptor(job);sha=fingerprint(descriptor)
        if sha!=self.operator_policy.approved_sha256:raise ExecutorError('APPROVAL_MISMATCH')
        root=self.directory(job['id'])
        try:receipt=files.read(root,'authorization.json',4096)
        except ExecutorError:raise ExecutorError('AUTHORIZATION_REQUIRED') from None
        if canonical(receipt)!=canonical({'execution':descriptor,'execution_sha256':sha}):raise ExecutorError('APPROVAL_MISMATCH')
        # Rebuild from integrity-checked assets on every operation. A code change invalidates approval.
        if run and self.operator_policy.allow_run is not True:raise ExecutorError('RUN_NOT_AUTHORIZED')
        self.policy=replace(self.operator_policy,approved_sha256=fingerprint(job))
        super().authorize(job,run)
    def _check_prepared(self,job):
        root=self.directory(job['id']);slug='pat-'+job['id']+'-'+fingerprint(job)[:8]
        try:
            if canonical(files.read(root,'experiment.ipynb',262144))!=canonical(build(job)) or canonical(files.read(root,'kernel-metadata.json',16384))!=canonical(metadata(job,self.operator_policy.owner,slug)):raise ExecutorError('APPROVAL_MISMATCH')
        except ExecutorError:raise ExecutorError('APPROVAL_MISMATCH') from None
    def submit(self,job,*,run=False):
        if run!=self.operator_policy.allow_run:raise ExecutorError('APPROVAL_MISMATCH')
        job=json.loads(canonical(validate(job)))
        self.authorize(job,run);self._check_prepared(job)
        return super().submit(job,run=run)
    def reconcile(self,job,version):
        """Read an explicit version and its source before removing an uncertain-submit fence."""
        self.authorize(job)
        if type(version) is not int or not 1<=version<=999999999:raise ExecutorError('INVALID_REMOTE_REF')
        root=self.directory(job['id'])
        with files.lock(root):
            state=self._read(root)
            if state['status'] not in ['submitting','submission_unknown']:raise ExecutorError('RECONCILIATION_NOT_NEEDED')
            ref=self.operator_policy.owner+'/pat-'+job['id']+'-'+fingerprint(job)[:8]
            if state['remote_ref']!=ref:raise ExecutorError('REMOTE_OWNER_MISMATCH')
            remote=self.transport.call('inspect',{'version_ref':ref+'/'+str(version)})
            try:
                if type(remote) is not dict or set(remote)!={'notebook','metadata'}:raise ValueError()
                if canonical(source_identity(remote['notebook']))!=canonical(source_identity(build(job))):raise ValueError()
                wanted=metadata(job,self.operator_policy.owner,ref.split('/')[1]);actual=remote['metadata']
                for k in ['id','is_private','enable_gpu','enable_tpu','enable_internet','language','kernel_type','dataset_sources','competition_sources','kernel_sources','model_sources']:
                    observed=actual[k].lower() if k in ['language','kernel_type'] and isinstance(actual[k],str) else actual[k]
                    if canonical(observed)!=canonical(wanted[k]):raise ValueError()
            except (KeyError,ValueError,TypeError):raise ExecutorError('REMOTE_IDENTITY_MISMATCH') from None
            result=self.transport.call('status',{'version_ref':ref+'/'+str(version)})
            from .service import STATUS
            if type(result) is not dict or set(result)!={'status'} or not isinstance(result['status'],str) or result['status'] not in STATUS:raise ExecutorError('UNEXPECTED_RESPONSE')
            if state['run_requested'] and result['status']=='NEW_SCRIPT':raise ExecutorError('REMOTE_STATE_UNKNOWN')
            state.update(remote_version=version,status=STATUS[result['status']],remote_status=result['status'],last_error=None,next_check_after=self.clock()+max(15,self.policy.poll_seconds))
            state['events'].append({'event':'reconciled','version':version});files.atomic(root,'state.json',state)
            return state
    def logs(self,job):
        value=super().logs(job)
        if type(value) is not dict or set(value)!={'events','omitted_lines','truncated','source'} or type(value['events']) is not list or len(value['events'])>150:raise ExecutorError('UNEXPECTED_RESPONSE')
        safe=safe_logs('\n'.join(canonical(v) for v in value['events']))
        safe['source']='operator-filtered';root=self.directory(job['id'])
        with files.lock(root):files.atomic(root,'logs.json',safe)
        return safe
    def snapshot(self,job):
        report=super().snapshot(job)
        if report['status'] in ['submitted','queued','running','unknown'] and report.get('errors'):
            report['status']='unknown'  # last observed state is no longer a fresh remote observation
        if report['status']=='prepared':
            root=self.directory(job['id'])
            if (root/'authorization.json').exists():
                # Offline projection still checks receipt against today's exact notebook/config.
                try:
                    descriptor=self.descriptor(job);receipt=files.read(root,'authorization.json',4096);self._check_prepared(job)
                    report['status']='authorized' if canonical(receipt)==canonical({'execution':descriptor,'execution_sha256':fingerprint(descriptor)}) else 'awaiting_authorization'
                except ExecutorError:report['status']='awaiting_authorization'
            else:report['status']='awaiting_authorization'
        return report
