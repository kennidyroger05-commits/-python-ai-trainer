(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.PythonLabModels=api;})(globalThis,function(){
  function route(request,available,rule='correct',fallback='local_model') {
    const wantsQuality=request.priority==='quality';
    const primary=(rule==='inverted'?!wantsQuality:wantsQuality)?'quality_model':'fast_model';
    return available.includes(primary)?primary:fallback;
  }
  function client(response,config={safe:true,fallback:'local_model'}) {
    if(response.status!==200)return {model:config.fallback,reason:'service_error'};
    if(typeof response.body!=='string')return {model:config.fallback,reason:'invalid_json'};
    let body;try{body=JSON.parse(response.body);}catch{return {model:config.fallback,reason:'invalid_json'};}
    if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.model!=='string'||!body.model.trim())return {model:config.fallback,reason:'missing_model'};
    return {model:body.model,reason:'accepted'};
  }
  function accuracy(predictions,expected) {
    if(!expected.length)return null;
    return expected.reduce((sum,want,i)=>sum+(predictions[i]===want?1:0),0)/expected.length;
  }
  function evaluate(data){
    const expected=data.tasks.map(t=>t.expected);
    return Object.fromEntries(Object.entries(data.models).map(([id,m])=>[id,{correct:expected.filter((want,i)=>m.predictions[i]===want).length,total:expected.length,accuracy:accuracy(m.predictions,expected),latency_ms:m.latency_ms,cost_usd:m.cost_usd,failed_ids:data.tasks.filter((t,i)=>m.predictions[i]!==t.expected).map(t=>t.id)}]));
  }
  function checkpoint(logs){return logs.reduce((best,row)=>!best||row.validation_loss<best.validation_loss?row:best,null);}
  function debugResult(id,input){
    if(id==='nested-missing-key')return input.body?.text??'fallback';
    if(id==='token-type'){if(typeof input==='string'&&!/^[+-]?\d+$/.test(input))return {error:'ValueError'};return Number(input)+1;}
    if(id==='missing-return')return input*2;
    if(id==='inverted-budget')return input[1]<=input[0]?'run':'skip';
    if(id==='unreachable-fallback')return input.text||'local';
    if(id==='malformed-json'){try{return JSON.parse(input);}catch{return {error:'invalid_json'};}}
    if(id==='empty-scores')return input.length?Math.max(...input):null;
    if(id==='wrong-metric')return accuracy(input[0],input[1]);
    throw Error('Unknown debug model');
  }
  function signature(activity,artifact){return JSON.stringify(artifact);}
  function tests(activity,artifact,datasets){
    if(activity.id==='model-router')return activity.cases.map(c=>({id:c.id,input:c.input,expected:c.expected,observed:route(c.input.request,c.input.available,artifact.rule||'inverted',artifact.fallback||null)}));
    if(activity.id==='api-client')return activity.cases.map(c=>({id:c.id,input:c.input,expected:c.expected,observed:client(c.input,{fallback:artifact.fallback||null})}));
    if(activity.id==='model-evaluation')return [{id:'model-a-accuracy',expected:.75,observed:evaluate(datasets.evaluation).model_a.accuracy},{id:'model-b-accuracy',expected:.5,observed:evaluate(datasets.evaluation).model_b.accuracy},{id:'empty-evaluation',expected:null,observed:accuracy([],[])},{id:'missing-predictions',expected:.5,observed:accuracy(['4','billing'],datasets.evaluation.tasks.map(t=>t.expected))}];
    if(activity.id==='training-pipeline')return [{id:'checkpoint',expected:2,observed:checkpoint(datasets.training.logs).epoch},{id:'separate-splits',expected:true,observed:datasets.training.train_ids.every(id=>!datasets.training.validation_ids.includes(id))},{id:'batch-count',expected:2,observed:Math.ceil(datasets.training.train_ids.length/(artifact.batchSize||2))}];
    if(activity.kind==='debug')return activity.tests.map(t=>({id:t.id,input:t.input,expected:t.expected,observed:artifact.repaired?debugResult(activity.id,t.input):{status:'unrepaired'}}));
    if(activity.kind==='testing')return activity.tests.map(t=>({id:t.id,input:t.input,expected:t.expected,observed:t.input*2}));
    return [];
  }
  function workspace(activity,artifact,datasets){
    if(activity.id==='model-router')return {artifact,preview:artifact.rule?{primary_case:route(datasets.router.request,datasets.router.available,artifact.rule,artifact.fallback)}:null};
    if(activity.id==='api-client')return {artifact,preview:artifact.safeLookup?client(datasets.api.responses.success,{fallback:artifact.fallback||null}):null};
    if(activity.id==='model-evaluation')return {artifact,preview:artifact.metric?evaluate(datasets.evaluation):null};
    if(activity.id==='training-pipeline')return {artifact,preview:artifact.checkpoint?checkpoint(datasets.training.logs):null};
    return {artifact};
  }
  return {route,client,accuracy,evaluate,checkpoint,debugResult,signature,tests,workspace};
});
