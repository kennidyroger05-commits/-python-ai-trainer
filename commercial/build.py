from pathlib import Path
import shutil,json
ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/'commercial'
OUT=BASE/'dist'
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(); app=OUT/'app'; app.mkdir()
for name in ('index.html','app.js','style.css','favicon.svg','game.js','language.js','labs.js','labs.json','exercises.json','glossary-v2.json'):
 shutil.copy2(ROOT/name,app/name)
for name in ('core','curriculum','learning','model-lab','projects','runtime','experiments'):
 shutil.copytree(ROOT/name,app/name)
for name in ('index.html','portal.css','portal.js','demo.html','demo.js','account.html','account.js'):
 shutil.copy2(BASE/'public'/name,OUT/name)
admin=OUT/'admin';admin.mkdir()
for name in ('index.html','admin.js'):
 shutil.copy2(BASE/'admin'/name,admin/name)
# Preserve upstream learning files; patch only the deployment copy.
p=app/'index.html'; html=p.read_text()
assert '</head>' in html and '</body>' in html
html=html.replace('</head>','<script src="account-context.js"></script></head>',1)
html=html.replace('</body>','<script src="cloud-panel.js"></script></body>',1)
p.write_text(html)
p=app/'core/storage.js'; src=p.read_text()
assert 'return window.localStorage;' in src
src=src.replace('return window.localStorage;', '''const raw=window.localStorage,id=window.TrainerAccount;if(!id)throw Error('account context unavailable');const prefix='trainer-account:'+id+':';const keys=()=>Object.keys(raw).filter(k=>k.startsWith(prefix));return {getItem:k=>raw.getItem(prefix+k),setItem:(k,v)=>raw.setItem(prefix+k,v),removeItem:k=>raw.removeItem(prefix+k),get length(){return keys().length;},key:i=>keys()[i]?.slice(prefix.length)??null};''')
p.write_text(src)
shutil.copy2(BASE/'cloud-panel.js',app/'cloud-panel.js')
for name in ('writing.html','writing.js','writing.json'):
 shutil.copy2(BASE/name,app/name)
p=app/'index.html'; p.write_text(p.read_text().replace('</main>','<section class="learning-card"><h2>Prática de autonomia (piloto)</h2><a href="writing.html">Seis desafios de código livre com testes reais</a></section></main>',1))
# Build the exact first unit in curriculum order, including block assembly.
plan=json.loads((ROOT/'curriculum/units.json').read_text())
catalog={x['id']:x for name in ('exercises.json','curriculum/exercises.json') for x in json.loads((ROOT/name).read_text())}
keys=('id','type','title','prompt','code','context','options','correct','blocks','answers','explanation','hints')
demo=[{k:catalog[i][k] for k in keys if k in catalog[i]} for i in plan['units'][0]['missions']]
assert len(demo)==13 and all(x.get('options') or x.get('blocks') for x in demo)
(OUT/'demo.json').write_text(json.dumps(demo,ensure_ascii=False))
# Only the runtime engine and ONE executable contract are public; the rest remains under /app.
lessons=json.loads((ROOT/'runtime/lessons.json').read_text())
lesson=next(x for x in lessons if x['id']=='exec-score')
(OUT/'demo-exec.json').write_text(json.dumps(lesson,ensure_ascii=False))
for name in ["client.js","manifest.json","worker.js","frame.js","runner.py","memory.js","vendor/pyodide/pyodide.js","vendor/pyodide/pyodide.asm.mjs","vendor/pyodide/pyodide.asm.wasm","vendor/pyodide/python_stdlib.zip","vendor/pyodide/pyodide-lock.json"]:
 dest=OUT/'runtime'/name; dest.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(ROOT/'runtime'/name,dest)
print(f'Built staging: {len(demo)} demo questions and one Python exercise; protected app separate.')
