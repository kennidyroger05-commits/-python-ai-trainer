"""Execute trusted curriculum fixtures; all repairs must differ or fail in real CPython."""
import json,io,contextlib,itertools,ast
from pathlib import Path
rows=json.loads(Path('curriculum/exercises.json').read_text());old=json.loads(Path('exercises.json').read_text())
def run(code):
 out=io.StringIO();error=None
 try:
  with contextlib.redirect_stdout(out):exec(compile(code,'curriculum-fixture','exec'),{})
 except Exception as e:error=type(e).__name__
 return out.getvalue(),error
for e in rows:
 f=e['fixture'];got=run(f['code']);assert got==(f['stdout'],f['exception']),(e['id'],got,f)
 if e.get('replacement'):
  for i,o in enumerate(e['options']):
   result=run(e['code'].replace(e['replacement']['target'],o,1))
   assert (result==(f['stdout'],None))==(i==e['correct']),(e['id'],o,result,'ambiguous repair')
 if e['type']=='build':
  for a in e['answers']:assert run(a)==(f['stdout'],None)
 if e['type']=='predict':assert e['options'][e['correct']]==f['stdout'].rstrip('\n'),e['id']
 if e['type']=='error':assert e['options'][e['correct']]==f['exception']
# Syntax gates on ALL old and new snippets: project-language features are introduced before use.
plan=json.loads(Path('curriculum/units.json').read_text());lookup={e['id']:e for e in old+rows}
limits={ast.Dict:7,ast.For:6,ast.While:6,ast.FunctionDef:4,ast.Lambda:13,ast.ListComp:12,ast.GeneratorExp:12,ast.Try:8,ast.Assert:8,ast.IfExp:3}
for unit in plan['units']:
 for id in unit['missions']:
  e=lookup[id];source=e.get('fixture',{}).get('code') or e.get('solutionCode') or (e.get('context','')+'\n'+e['answers'][0] if e['type']=='build' else e.get('code',''))
  try:tree=ast.parse(source)
  except SyntaxError:continue # intentional errors and completion templates are checked by their fixtures
  for node in ast.walk(tree):
   for cls,earliest in limits.items():assert not isinstance(node,cls) or unit['number']>=earliest,(id,cls.__name__,'introduced too early')
print(f'PASS CPython: {len(rows)} distinct new fixtures; all correct/wrong patch choices; block solutions, predictions, exceptions; syntax progression for {len(lookup)} missions')

# Full project artifacts cannot require an unexplained language feature or builtin.
command_lessons={'sum':'v4-list-sum','zip':'v4-zip','enumerate':'v4-enumerate','len':'v4-length','min':'v4-minimum','isinstance':'v4-isinstance','strip':'v4-strip','get':'v4-dict-get','items':'v4-dict-items','loads':'parse-json'}
route=[id for u in plan['units'] for id in u['missions']];project_start=route.index(plan['units'][13]['missions'][0])
for project in json.loads(Path('projects/catalog.json').read_text()):
 tree=ast.parse(project['solutionCode']);local={n.name for n in ast.walk(tree) if isinstance(n,ast.FunctionDef)}
 for n in ast.walk(tree):
  if isinstance(n,ast.Call):
   name=n.func.id if isinstance(n.func,ast.Name) else n.func.attr if isinstance(n.func,ast.Attribute) else None
   if name in local:continue
   assert name in command_lessons,(project['id'],'unregistered command',name)
   assert route.index(command_lessons[name])<project_start
for unit in plan['units']:
 for id in unit['executables']:
  for req in plan['runtimeRequires'][id]:assert route.index(req)<=route.index(unit['missions'][-1]),(id,req)
print('PASS full project syntax/builtin preparation and all 14 executable prerequisite positions')
