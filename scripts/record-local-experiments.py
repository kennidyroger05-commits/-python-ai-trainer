"""Run the two trusted notebooks locally and record measured reference reports, never Kaggle results."""
import json,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from executor.contracts import example
from executor.local import execute
for recipe in ['intent-inference','intent-training']:
    with tempfile.TemporaryDirectory() as output:
        report=execute(example(recipe),output)
        report['reference_notice']='Measured local development reference; not your job, not Kaggle, not a general model benchmark.'
        (ROOT/'experiments/evidence'/f'{recipe}-local.json').write_text(json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
        (ROOT/'experiments/evidence'/f'{recipe}-trace.json').write_text(json.dumps({'source':'local-cpu','spec_sha256':report['spec_sha256'],'events_json':(Path(output)/'events.json').read_text()},indent=2)+'\n')
        print(recipe,report['provenance']['source'],report['notebook_result']['metrics'])
