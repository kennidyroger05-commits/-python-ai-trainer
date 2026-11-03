const assert=require('node:assert/strict');
const fs=require('node:fs');const data=require('../exercises.json'),P=require('../core/progress'),S=require('../core/session'),C=require('../core/content'),Trace=require('../core/simulation'),game=require('../game');
require('../language');Object.assign(global.TrainerLanguage.glossary,require('../glossary-v2.json'));const glossary=global.TrainerLanguage.glossary;
C.validate(data,glossary);
const mutations=[x=>x[1].id=x[0].id,x=>x[2].title=x[1].title,x=>x[4].type='guess',x=>x[6].requires=['missing'],x=>x[17].translations.en.hints=[],x=>x[26].solutionCode='',x=>x[19].correct=90,x=>x[9].options=['a','a','a'],x=>x[3].terms=['missing'],x=>x[20].introduces=['x','y'],x=>x[7].simulation.steps[0].line=99];
for(const mutate of mutations){const changed=structuredClone(data);mutate(changed);assert.throws(()=>C.validate(changed,glossary));}
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
for(const n of [5,15]){store.clear();const v1={current:n,completed:data.slice(0,n).map(e=>e.id),xp:n*10,unlocked:['Fundamentos'],attempts:Object.fromEntries(data.slice(0,n).map(e=>[e.id,1])),awards:{}};storage.setItem('pythonAiTrainerV1',JSON.stringify(v1));const p=P.load(storage);assert.equal(p.version,2);assert.deepEqual(p.completed,v1.completed);assert.equal(p.xp,v1.xp);P.save(storage,p);assert.deepEqual(JSON.parse(storage.getItem('pythonAiTrainerV1')),v1);assert.deepEqual(P.load(storage),p);}
let p=P.empty();assert.deepEqual(P.reviews(p,data),[]);
p.completed=data.slice(0,15).map(e=>e.id);const e=data[15];p.attempts[e.id]=2;P.record(p,e,false);P.hint(p,e);P.record(p,e,true);assert.equal(p.concepts[e.concept].errors,1);assert.equal(p.concepts[e.concept].correct,1);assert.equal(p.concepts[e.concept].hints,1);assert.deepEqual(P.reviews(p,data,100000),[e.id]);
P.record(p,e,true,0,true,100000);assert.deepEqual(P.reviews(p,data,100001),[]);assert.deepEqual(P.reviews(p,data,161000),[e.id]);
p.completed=[];assert.deepEqual(P.reviews(p,data,161000),[],'Unstudied prerequisites must block review');
p=P.empty();game.awardXP(p,'a',1,false);game.awardXP(p,'b',2,false);game.awardXP(p,'c',1,true);assert.equal(p.xp,17);assert.equal(game.awardXP(p,'a',1,false),0);
const sessions=S.create();const a=sessions.get('a');a.answer='abc';sessions.save('a',a);a.answer='corrupted';assert.equal(sessions.get('a').answer,'abc');assert.equal(sessions.get('b').answer,'');sessions.clear();assert.equal(sessions.get('a').answer,'');
for(const e of data.filter(e=>e.simulation)){const t=e.simulation;assert.equal(Trace.move(t,-1,-100),-1);assert.equal(Trace.move(t,0,1000),t.steps.length-1);const snapshot=Trace.snapshot(t,0);snapshot.variables.hacked=true;assert.ok(!t.steps[0].variables.hacked);}
const labs=require('../labs.json');assert.equal(labs.length,5);for(const lab of labs){assert.equal(lab.stages.length,8);assert.equal(lab.choices[lab.correct],lab.tool);assert.equal(lab.stages[6].data.tool,lab.tool);assert.ok(lab.stages.every(s=>s.pt&&s.en&&s.data&&s.dataEn));}
assert.equal(labs[0].stages[3].data.score>.7,true);assert.equal(labs[1].stages[7].data.order_id,labs[1].stages[3].data.order_id);const args=labs[2].stages[3].data.arguments;assert.equal(args.first+args.second,labs[2].stages[7].data.value);assert.ok(labs[3].stages[3].data.score<.7);assert.equal(labs[4].stages[3].data.status,503);assert.equal(labs[4].tool,'retry_later');
P.clear(storage);assert.equal(storage.getItem(P.KEY),null);assert.equal(storage.getItem('pythonAiTrainerV1'),null);
console.log('PASS core: mutation rejection, V1/V1.5 migration without deleting history, review prerequisites/ranking/cooldown, XP, independent sessions, immutable traces, five AI lab contracts');
const crypto=require('node:crypto');for(const row of require('./v1-5-manifest.json')){const e=data.find(e=>e.id===row.id);assert.ok(e);const hash=crypto.createHash('sha256').update(JSON.stringify(Object.fromEntries(row.keys.map(k=>[k,e[k]])))).digest('hex');assert.equal(hash,row.sha256,`Published V1.5 field changed: ${row.id}`);}
console.log('PASS all 15 V1.5 lesson fields preserved; V2 metadata/traces additive.');
