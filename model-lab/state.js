(function(root,factory){const node=typeof module==='object'&&module.exports&&typeof require==='function',api=factory(node?require('../core/storage'):root.TrainerStorage,node?require('./contracts'):root.ModelLabContracts);if(node)module.exports=api;root.ModelLabState=api;})(globalThis,function(S,C){
 const KEY='pythonModelLabV1';
 function empty(){return {version:1,experiments:{}};}
 function shape(v){return v&&v.version===1&&v.experiments&&typeof v.experiments==='object'&&!Array.isArray(v.experiments);}
 function valid(v){return shape(v)&&Object.values(v.experiments).every(r=>r&&C.validate(r.job).ok&&(r.lastSimulationStatus===null||C.STATUSES.includes(r.lastSimulationStatus)));}
 function load(storage){const raw=S.read(storage,KEY).value,state=empty();if(!shape(raw))return state;for(const[id,v]of Object.entries(raw.experiments)){if(id==='__proto__'||!v||!C.validate(v.job).ok||v.job.id!==id)continue;
  // Keep the reviewed contract, not untrusted logs, credentials or invented completion evidence.
  state.experiments[id]={job:C.clone(v.job),lastSimulationStatus:C.STATUSES.includes(v.lastSimulationStatus)?v.lastSimulationStatus:null};
 }return state;}
 function save(storage,state){return S.write(storage,KEY,state,valid);}
 return {KEY,empty,valid,load,save};
});
