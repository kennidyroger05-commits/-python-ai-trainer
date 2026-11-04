"""Verify only our fixed preparation notebook with CPython, in a temporary directory."""
import json, subprocess, tempfile
from pathlib import Path
bundle=json.loads(subprocess.check_output(['node','-e',"const C=require('./model-lab/contracts');console.log(JSON.stringify(C.notebookBundle(C.example('remote-kaggle'))))"],text=True))
cell=''.join(bundle['notebook']['cells'][1]['source'])
assert 'import json' in cell and 'training' in cell
with tempfile.TemporaryDirectory() as folder:
    # Only adapt the official notebook working directory for this local test.
    source=cell.replace('/kaggle/working/preparation.json',str(Path(folder)/'preparation.json'))
    out=subprocess.check_output(['python3','-c',source],text=True)
    result=json.loads((Path(folder)/'preparation.json').read_text())
    assert result['status']=='prepared_only' and result['model_executed'] is False
    assert result['contract']['execution']=='remote-kaggle'
    assert 'no model, inference or training' in out
print('PASS CPython: exported notebook produces only its declared preparation artifact, without inference/training')
