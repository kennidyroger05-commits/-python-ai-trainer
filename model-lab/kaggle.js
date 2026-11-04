(function(root,factory){const C=typeof module==='object'&&module.exports&&typeof require==='function'?require('./contracts'):root.ModelLabContracts;const api=factory(C);if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.KagglePreparation=api;})(globalThis,function(C){
 function failure(code,message){return Object.assign(Error(message),{code,simulated:true});}
 /** Deterministic contract adapter. NEVER contacts Kaggle. advance() is an explicit teaching action. */
 function mock(){
  const jobs=new Map();let fault=null;
  const fixture=[['billing','billing'],['support','support'],['billing','other'],['other','other']];
  const check=()=>{if(fault==='auth')throw failure('AUTH_REQUIRED','Simulated authentication failure; do not enter a token here.');if(fault==='network')throw failure('NETWORK_FAILURE','Simulated network failure; no request was sent.');};
  const get=id=>{const j=jobs.get(id);if(!j)throw failure('NOT_FOUND','Simulated job not found');return j;};
  function prepare(job){C.assert(job);if(job.execution!=='simulation')throw failure('SIMULATION_ONLY','The mock accepts only explicitly simulated jobs');if(job.dataset.id!=='didactic-labels-four'||job.dataset.examples!==fixture.length)throw failure('UNSUPPORTED_FIXTURE','This mock only supports the declared four-example fixture');return C.clone(job);}
  function submit(job){check();prepare(job);if(jobs.has(job.id))throw failure('CONFLICT','Simulated job already exists');jobs.set(job.id,{job:C.clone(job),status:'queued',logs:['SIMULATION: prepared contract queued locally.'],metrics:[],artifacts:[]});return status(job.id);}
  function status(id){check();const j=get(id);return {id,status:j.status,source:'simulation',durationMs:null};}
  function advance(id){check();const j=get(id);if(j.status==='queued'){j.status='running';j.logs.push('SIMULATION: inspect fixture predictions; no model is loaded.');}else if(j.status==='running'){j.status='completed';j.metrics=[{name:'accuracy',value:fixture.filter(([expected,observed])=>expected===observed).length/fixture.length,unit:'fraction',source:'simulation',samples:fixture.length}];j.artifacts=[{path:'metrics.json',content:JSON.stringify(j.metrics,null,2),source:'simulation'}];j.logs.push('SIMULATION: fixture agreement is 3/4. Not a model measurement.');}else throw failure('INVALID_TRANSITION','This simulated state cannot advance');return status(id);}
  function cancel(id){check();const j=get(id);if(!['queued','running'].includes(j.status))throw failure('INVALID_TRANSITION','Only pending simulated jobs can be cancelled');j.status='cancelled';j.logs.push('SIMULATION: cancelled locally; no remote session was affected.');return status(id);}
  function fail(id){const j=get(id);if(!['queued','running'].includes(j.status))throw failure('INVALID_TRANSITION','Cannot fail this state');j.status='failed';j.logs.push('SIMULATION: execution failed; no metrics or artifacts produced.');return status(id);}
  function logs(id){check();return C.clone(get(id).logs);}
  function results(id){check();const j=get(id);return {status:j.status,source:'simulation',metrics:C.clone(j.metrics),artifacts:C.clone(j.artifacts)};}
  return {prepare,submit,status,advance,cancel,fail,logs,results,setFault(value){if(![null,'auth','network'].includes(value))throw Error('Invalid fault');fault=value;}};
 }
 // Public frontend has no authenticated transport. Never accept credentials here.
 function remote(){const blocked=()=>{throw Object.assign(Error('A separately deployed, authorized backend and Kaggle authentication are required. Nothing was sent.'),{code:'BACKEND_REQUIRED',simulated:false});};return {prepare(job){C.assert(job);if(job.execution!=='remote-kaggle')throw Error('Remote contract required');return C.notebookBundle(job);},submit:blocked,status:blocked,results:blocked,logs:blocked};}
 return {mock,remote};
});
