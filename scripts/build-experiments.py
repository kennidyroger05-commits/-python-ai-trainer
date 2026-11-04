"""Rebuild audited static notebook exports after changing trusted recipe sources."""
import hashlib, json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
files={k:{'path':p,'sha256':hashlib.sha256((ROOT/'experiments'/p).read_bytes()).hexdigest()} for k,p in {'core':'recipes/tiny_intent.py','runner':'recipes/run_experiment.py','data':'data/synthetic-intents.json','model':'data/intent-model.json'}.items()}
(ROOT/'experiments/assets.json').write_text(json.dumps({'version':1,'parameters':87,'files':files},indent=2)+'\n')
from executor.contracts import example
from executor.notebooks import build
for recipe in ['intent-inference','intent-training']:
 (ROOT/'experiments/notebooks'/f'{recipe}.ipynb').write_text(json.dumps(build(example(recipe)),ensure_ascii=False,indent=2)+'\n')
 (ROOT/'experiments'/f'{recipe}-job.json').write_text(json.dumps(example(recipe),indent=2)+'\n')
print('Built two fixed, self-contained real CPU notebooks; no execution or network requested')
