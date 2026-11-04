(function(root,factory){const node=typeof module==='object'&&module.exports&&typeof require==='function',api=factory(node?require('../core/storage'):root.TrainerStorage);if(node)module.exports=api;root.ExperimentLearning=api;})(globalThis,function(S){
 const KEY='pythonExperimentLearningV1',STAGES=['goal','notebook','parameters','inputs','execution','logs','metrics','failures','report','review'];
 function empty(){return {version:1,drafts:{}};}
 function valid(value,C){return value&&value.version===1&&value.drafts&&typeof value.drafts==='object'&&!Array.isArray(value.drafts)&&Object.entries(value.drafts).every(([id,r])=>['intent-inference','intent-training'].includes(id)&&r&&r.spec?.recipe_id===id&&C.validate(r.spec).ok&&STAGES.includes(r.stage)&&Array.isArray(r.seen)&&r.seen.every(s=>STAGES.includes(s))&&Number.isInteger(r.revision)&&r.revision>=1&&r.revision<=99);}
 function load(storage,C){const raw=S.read(storage,KEY).value,state=empty();if(!raw||raw.version!==1||!raw.drafts||typeof raw.drafts!=='object')return state;for(const id of ['intent-inference','intent-training']){const r=raw.drafts[id];if(!r)continue;state.drafts[id]={spec:C.validate(r.spec).ok&&r.spec.recipe_id===id?r.spec:C.example(id),stage:STAGES.includes(r.stage)?r.stage:'goal',seen:Array.isArray(r.seen)?[...new Set(r.seen.filter(s=>STAGES.includes(s)))]:[],revision:Number.isInteger(r.revision)&&r.revision>=1&&r.revision<=99?r.revision:1};}return state;}
 function get(state,id,C){return state.drafts[id] ||= {spec:C.example(id),stage:'goal',seen:[],revision:1};}
 function save(storage,state,C){return S.write(storage,KEY,state,v=>valid(v,C));}
 return {KEY,empty,valid,load,get,save};
});
