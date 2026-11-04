const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const E=require('../projects/engine'),M=require('../projects/models');
require('../language');const glossary={...global.TrainerLanguage.glossary,...require('../glossary-v2.json'),...require('../projects/terms.json')};
const catalog=[...require('../projects/catalog.json'),...require('../projects/debugging.json'),...require('../projects/testing.json')],datasets=require('../projects/datasets.json');
E.validate(catalog,glossary);assert.equal(catalog.filter(a=>a.kind==='project').length,4);assert.equal(catalog.filter(a=>a.kind==='debug').length,8);assert.equal(catalog.filter(a=>a.kind==='testing').length,1);assert.ok(catalog.filter(a=>a.kind==='project').every(a=>a.steps.length===10));
for(const [file,hash] of Object.entries(require('./v2-data-manifest.json')))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,`${file} changed`);
function store(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i]??null,get length(){return data.size;}};}
let state=E.empty(),storage=store();
for(const a of catalog){
 for(const s of a.steps){
  E.present(state,E.unitKey(a,s),s.concept,s.skills);const step=E.stepState(state,a,s);
  for(const c of s.choices){assert.equal(E.check(s,c.id),c.id===s.correctId);if(c.id!==s.correctId){E.choose(state,a,s,c.id);if(s.requiresTests){const art=E.artifact(state,a);E.testRun(state,a,M.tests(a,art,datasets),M.signature(a,art));}const result=E.submit(state,a,s,100,M.signature(a,E.artifact(state,a)));assert.equal(result.correct,false);}}
  E.hint(state,a,s);E.hint(state,a,s);E.hint(state,a,s);assert.equal(step.hints,2);
  E.choose(state,a,s,s.correctId);if(s.requiresTests){const art=E.artifact(state,a);E.testRun(state,a,M.tests(a,art,datasets),M.signature(a,art));}
  assert.equal(E.submit(state,a,s,123,M.signature(a,E.artifact(state,a))).correct,true,`${a.id}/${s.id}`);
  const xp=E.xp(state);assert.equal(E.submit(state,a,s).gained,0);assert.equal(E.xp(state),xp);
  E.save(storage,state);state=E.load(storage,catalog);assert.ok(E.stepState(state,a,s).passed);
  assert.equal(E.move(state,a,1),true);
 }
 const completed=E.get(state,a);assert.equal(completed.completedAt,123);assert.equal(completed.conclusion,true);
 E.move(state,a,-1);assert.ok(a.steps.every(s=>E.stepState(state,a,s).passed));
 const before=E.xp(state);E.restart(state,a);assert.equal(E.xp(state),before);assert.equal(E.get(state,a).completedAt,null);
 for(const s of a.steps){E.choose(state,a,s,s.correctId);if(s.requiresTests){const art=E.artifact(state,a);E.testRun(state,a,M.tests(a,art,datasets),M.signature(a,art));}assert.equal(E.submit(state,a,s,200,M.signature(a,E.artifact(state,a))).gained,0);E.move(state,a,1);}
 assert.equal(E.xp(state),before);
}
assert.equal(E.competencies(state).length,10);assert.ok(E.competencies(state).find(c=>c.skill==='english').correct>0);
assert.ok(E.xp(state)>0);assert.equal(E.get(E.empty(),catalog[1]).steps[catalog[1].steps[0].id],undefined);
for(const a of catalog.filter(a=>a.kind==='project'))assert.ok(M.tests(a,E.artifact(state,a),datasets).every(t=>JSON.stringify(t.observed)===JSON.stringify(t.expected)));
const bad=store();bad.setItem(E.KEY,'{broken');assert.deepEqual(E.load(bad,catalog),E.empty());E.save(bad,E.empty());assert.equal(bad.getItem(E.KEY+'.recovery'),'{broken');
assert.equal(E.save({getItem:()=>null,setItem:()=>{throw Error('quota');}},state),false);
const invalid=structuredClone(state);invalid.activities[E.key(catalog[0])].steps={};invalid.activities[E.key(catalog[0])].currentStepId=catalog[0].steps.at(-1).id;storage.setItem(E.KEY,JSON.stringify(invalid));const restored=E.load(storage,catalog);assert.equal(E.get(restored,catalog[0]).currentStepId,catalog[0].steps[0].id);assert.equal(E.get(restored,catalog[0]).completedAt,null);
console.log('PASS projects core: four coherent projects, 8 debugging cases, tutorial, 70 steps and all choices; persistence/restart/idempotent XP, corruption/quota, evidence and V2 hashes');
