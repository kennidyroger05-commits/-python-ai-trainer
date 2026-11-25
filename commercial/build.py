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
for name in ('index.html','portal.css','portal.js','demo.html','demo.js'):
 shutil.copy2(BASE/'public'/name,OUT/name)
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
new=json.loads((ROOT/'curriculum/exercises.json').read_text())
demo=[{k:x[k] for k in ('id','title','prompt','code','options','correct','explanation','hints') if k in x} for x in new if x.get('unit')=='unit-01' and isinstance(x.get('correct'),int) and x.get('options')]
assert len(demo)>=8
(OUT/'demo.json').write_text(json.dumps(demo,ensure_ascii=False))
print(f'Built staging: {len(demo)} demo questions; protected app separate.')
