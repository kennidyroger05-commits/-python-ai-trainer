"""Portable JSON package: no archives, executable paths, credentials or arbitrary recipes."""
from .contracts import canonical, fingerprint, validate
from .notebooks import build, metadata
from .errors import ExecutorError

SDK={'kaggle':'2.2.5','kagglesdk':'0.1.38'}
def create(job):
    validate(job)
    return {'format':'python-ai-trainer-package','version':1,'job':job,'notebook':build(job),'metadata':metadata(job)}

def inspect(value):
    try:
        if type(value) is not dict or set(value)!={'format','version','job','notebook','metadata'} or type(value['version']) is not int or value['version']!=1 or value['format']!='python-ai-trainer-package':raise ValueError()
        if len(canonical(value).encode())>262144 or canonical(value)!=canonical(create(value['job'])):raise ValueError()
        return value['job']
    except (KeyError,TypeError,ValueError,RecursionError):raise ExecutorError('INVALID_PACKAGE') from None

def execution(job,owner,run):
    import re
    if not isinstance(owner,str) or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{2,29}',owner) or type(run) is not bool:raise ExecutorError('INVALID_OWNER')
    bundle=create(job);slug='pat-'+job['id']+'-'+fingerprint(job)[:8]
    return {'version':1,'spec_sha256':fingerprint(job),'notebook_sha256':fingerprint(bundle['notebook']),
      'metadata_sha256':fingerprint(metadata(job,owner,slug)),'owner':owner,'run':run,'sdk':SDK}

def source_identity(notebook):
    """Ignore only execution decorations added by the notebook platform, never source."""
    try:
        if notebook['nbformat']!=4:raise ValueError()
        return [{'cell_type':c['cell_type'],'source':''.join(c['source']) if isinstance(c['source'],list) else c['source']} for c in notebook['cells']]
    except (KeyError,TypeError):raise ExecutorError('INVALID_NOTEBOOK') from None
