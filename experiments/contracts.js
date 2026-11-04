(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.ExperimentContracts=api;})(globalThis,function(){
 const RECIPES=['intent-inference','intent-training'],STAGES=['goal','notebook','parameters','inputs','execution','logs','metrics','failures','report','review'];
 function canonical(value,depth=0){
  if(depth>20)throw Error('JSON nesting limit');
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Nonfinite number');return JSON.stringify(value);}
  if(Array.isArray(value))return '['+value.map(v=>canonical(v,depth+1)).join(',')+']';
  if(value&&typeof value==='object'){const keys=Object.keys(value).sort();if(keys.some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('Reserved field');return '{'+keys.map(k=>JSON.stringify(k)+':'+canonical(value[k],depth+1)).join(',')+'}';}
  throw Error('Only JSON values are accepted');
 }
 function create(assets){
  const equal=(a,b)=>canonical(a)===canonical(b),keys=(v,names)=>v&&typeof v==='object'&&!Array.isArray(v)&&equal(Object.keys(v).sort(),names.slice().sort());
  function example(recipe='intent-inference'){
   if(!RECIPES.includes(recipe))throw Error('Unknown recipe');const kind=recipe==='intent-inference'?'inference':'training';
   return {schema_version:2,id:recipe+'-study',recipe_id:recipe,experiment_type:kind,model:{id:'tiny-intent-softmax-v1',parameters:assets.parameters,weights_sha256:kind==='inference'?assets.files.model.sha256:null},dataset:{id:'synthetic-intents-30-v1',sha256:assets.files.data.sha256,train_examples:18,validation_examples:6,test_examples:6},objective:'Run real tiny linear-model '+kind+' on synthetic intent data; no LLM or external download.',environment:{python_min:'3.10',libraries:{stdlib:'builtin'},hardware:{device:'cpu',memory_mb:512},internet:false},config:kind==='inference'?{inputs:['invoice payment request','support login issue','schedule meeting time']}:{seed:7,epochs:20,batch_size:4,learning_rate:.8},resources:{timeout_seconds:300,max_artifact_bytes:1048576},provenance:{template_version:1,core_sha256:assets.files.core.sha256,producer:'python-ai-trainer'}};
  }
  function validate(job){try{
   if(!keys(job,['schema_version','id','recipe_id','experiment_type','model','dataset','objective','environment','config','resources','provenance'])||job.schema_version!==2||typeof job.id!=='string'||!/^[a-z][a-z0-9-]{2,39}$/.test(job.id)||['constructor','prototype'].includes(job.id)||!RECIPES.includes(job.recipe_id))throw Error('Invalid job header');
   const base=example(job.recipe_id);if(job.experiment_type!==base.experiment_type||typeof job.objective!=='string'||job.objective.length<1||job.objective.length>300||/[\x00-\x1f]|https?:\/\/|token|secret|password|api[_-]?key|bearer/i.test(job.objective))throw Error('Invalid experiment objective');
   for(const k of ['model','dataset','environment','resources','provenance'])if(!equal(job[k],base[k]))throw Error('Invalid '+k);
   const c=job.config;
   if(job.experiment_type==='inference'){if(!keys(c,['inputs'])||!Array.isArray(c.inputs)||c.inputs.length<1||c.inputs.length>8||c.inputs.some(s=>typeof s!=='string'||s.trim().length<1||s.length>512||/[\x00-\x1f]/.test(s)))throw Error('Invalid inference inputs');}
   else if(!keys(c,['seed','epochs','batch_size','learning_rate'])||!Number.isInteger(c.seed)||c.seed<0||c.seed>2147483647||!Number.isInteger(c.epochs)||c.epochs<1||c.epochs>100||!Number.isInteger(c.batch_size)||c.batch_size<1||c.batch_size>16||![.1,.2,.4,.8].includes(c.learning_rate))throw Error('Invalid training parameters');
   if(new TextEncoder().encode(canonical(job)).length>16384)throw Error('Job size limit');return {ok:true,errors:[]};
  }catch(e){return {ok:false,errors:[e.message]};}}
  function assert(job){const r=validate(job);if(!r.ok)throw Error('INVALID_JOB');return job;}
  function base64(text){return btoa(String.fromCharCode(...new TextEncoder().encode(text)));}
  function lines(text){return text.match(/[^\n]*\n|[^\n]+$/g)||[];}
  function notebook(job,raw){assert(job);const code=(id,source)=>({id,cell_type:'code',metadata:{},execution_count:null,outputs:[],source:lines(source)});
   const encoded=(name,value,hash)=>name+'_BYTES = base64.b64decode("'+base64(value)+'")\nassert hashlib.sha256('+name+'_BYTES).hexdigest() == "'+hash+'"\n'+name+' = json.loads('+name+'_BYTES)\n';
   return {nbformat:4,nbformat_minor:5,metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'},language_info:{name:'python'}},cells:[{id:'goal',cell_type:'markdown',metadata:{},source:['# Tiny intent model — real CPU '+job.experiment_type+'\n','A small linear softmax classifier (87 parameters), not an LLM. Synthetic data only. No network/download/GPU. Scores are not calibrated; six validation/test examples do not prove general quality.\n','Review and authorize any Kaggle execution separately. Never place credentials in this notebook.\n']},code('job-config','import base64, json\nJOB = json.loads(base64.b64decode("'+base64(canonical(job))+'"))\n'),code('model-implementation',raw.core),code('fixed-data',encoded('DATA',raw.data,assets.files.data.sha256)+encoded('REFERENCE_MODEL',raw.model,assets.files.model.sha256)),code('run-and-export',raw.runner)]};
  }
  function metadata(job){assert(job);return {id:'YOUR_USERNAME/'+job.id,title:'Python AI Trainer '+job.experiment_type,code_file:'experiment.ipynb',language:'python',kernel_type:'notebook',is_private:true,enable_gpu:false,enable_tpu:false,enable_internet:false,dataset_sources:[],competition_sources:[],kernel_sources:[],model_sources:[]};}
  function report(value){try{
   const require=(ok)=>{if(!ok)throw Error('Invalid report contract');},n=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
   require(canonical(value).length<=65536);
   const top=['schema_version','status','spec','spec_sha256','provenance','notebook_result','artifacts'];
   if(value?.provenance?.source==='operator-state')top.push('errors');
   if(Object.hasOwn(value,'reference_notice')){top.push('reference_notice');require(typeof value.reference_notice==='string'&&value.reference_notice.length<=200);}
   require(keys(value,top)&&value.schema_version===1&&validate(value.spec).ok&&/^[a-f0-9]{64}$/.test(value.spec_sha256));
   const p=value.provenance;require(keys(p,['source','verification','remote_ref','remote_version']));
   if(p.source==='operator-state'){
    require(['awaiting_authorization','authorized','prepared','submitting','submitted','saved_only','submission_unknown','queued','running','remote_complete','failed','unknown','cancel_requested','cancelled'].includes(value.status)&&p.verification==='local-state-only'&&value.notebook_result===null&&Array.isArray(value.artifacts)&&!value.artifacts.length&&Array.isArray(value.errors)&&value.errors.length<=1&&value.errors.every(e=>keys(e,['code'])&&/^[A-Z_]{2,40}$/.test(e.code)));
   }else{
    require(value.status==='completed'&&['local-cpu','kaggle-sdk','injected-transport'].includes(p.source));
    require(p.verification===(p.source==='local-cpu'?'bounded-local-process':'version-and-artifact-contract'));
   }
   if(p.source==='local-cpu')require(p.remote_ref===null&&p.remote_version===null);
   else if(p.remote_ref!==null){require(typeof p.remote_ref==='string'&&/^[a-z0-9][a-z0-9_-]{2,29}\/pat-[a-z][a-z0-9-]{2,39}-[a-f0-9]{8}$/.test(p.remote_ref)&&p.remote_ref.endsWith('/pat-'+value.spec.id+'-'+value.spec_sha256.slice(0,8)));require((p.source==='operator-state'&&p.remote_version===null)||Number.isInteger(p.remote_version)&&p.remote_version>=1&&p.remote_version<=999999999);}
   else require(p.remote_version===null&&p.source==='operator-state');
   if(p.source==='operator-state')return {ok:true,errors:[]};
   const r=value.notebook_result;require(keys(r,['schema_version','status','spec_sha256','recipe_id','experiment_type','provenance','metrics','details','errors'])&&r.schema_version===1&&r.status==='completed'&&r.spec_sha256===value.spec_sha256&&r.recipe_id===value.spec.recipe_id&&r.experiment_type===value.spec.experiment_type&&Array.isArray(r.errors)&&!r.errors.length);
   const q=r.provenance;require(keys(q,['source','python','libraries','platform','started_at','duration_ms','model_kind','parameters','dataset','remote_verified'])&&q.source==='notebook-process'&&q.remote_verified===false&&q.parameters===87&&q.model_kind==='linear-softmax'&&q.dataset==='synthetic-intents-30-v1'&&/^3\.\d{1,2}\.\d{1,3}$/.test(q.python)&&equal(q.libraries,{stdlib:q.python})&&['Linux','Darwin','Windows'].includes(q.platform)&&Number.isFinite(Date.parse(q.started_at))&&n(q.duration_ms,0,300000));
   const m=r.metrics,d=r.details;
   if(value.spec.experiment_type==='inference'){
    require(keys(m,['prediction_count','input_word_tokens','latency_ms_total','peak_process_memory_kib'])&&keys(d,['predictions','scores_are_calibrated','tokenizer'])&&d.scores_are_calibrated===false&&d.tokenizer==='lower-ascii-words-v1'&&Array.isArray(d.predictions)&&d.predictions.length===value.spec.config.inputs.length);
    let tokens=0,latency=0;
    for(let i=0;i<d.predictions.length;i++){const row=d.predictions[i],input=value.spec.config.inputs[i],words=input.toLowerCase().match(/[a-z]+/g)||[];
     require(keys(row,['input','tokens','label','scores','word_tokens','latency_ms'])&&row.input===input&&equal(row.tokens,words)&&row.word_tokens===words.length&&n(row.latency_ms,0,300000)&&keys(row.scores,['billing','support','schedule'])&&Object.values(row.scores).every(v=>n(v,0,1))&&Math.abs(Object.values(row.scores).reduce((a,b)=>a+b,0)-1)<1e-9);
     const labels=['billing','support','schedule'];require(row.label===labels.reduce((a,b)=>row.scores[b]>row.scores[a]?b:a));tokens+=row.word_tokens;latency+=row.latency_ms;
    }require(m.prediction_count===d.predictions.length&&m.input_word_tokens===tokens&&n(m.latency_ms_total,0,300000)&&Math.abs(m.latency_ms_total-latency)<1e-6);
   }else{
    require(keys(m,['before_validation_accuracy','after_validation_accuracy','heldout_test_accuracy','training_loss_last','validation_loss_best','epochs_completed','selected_epoch','peak_process_memory_kib'])&&keys(d,['before_validation','after_validation','heldout_test','selected_epoch']));
    for(const [name,key]of [['before_validation','before_validation_accuracy'],['after_validation','after_validation_accuracy'],['heldout_test','heldout_test_accuracy']]){const v=d[name];require(keys(v,['accuracy','loss','correct','examples'])&&v.examples===6&&Number.isInteger(v.correct)&&v.correct>=0&&v.correct<=6&&v.accuracy===v.correct/6&&n(v.loss,0,100)&&m[key]===v.accuracy);}
    require(n(m.training_loss_last,0,100)&&m.validation_loss_best===d.after_validation.loss&&m.epochs_completed===value.spec.config.epochs&&Number.isInteger(m.selected_epoch)&&m.selected_epoch>=1&&m.selected_epoch<=m.epochs_completed&&d.selected_epoch===m.selected_epoch);
   }
   require(m.peak_process_memory_kib===null||n(m.peak_process_memory_kib,0,1048576));
   const names=value.spec.experiment_type==='training'?['checkpoint-best.json','events.json','history.json','metrics.json','result.json','splits.json']:['events.json','metrics.json','result.json'];
   require(Array.isArray(value.artifacts)&&equal(value.artifacts.map(a=>a.name).sort(),names)&&value.artifacts.every(a=>keys(a,['name','bytes','sha256'])&&/^[a-f0-9]{64}$/.test(a.sha256)&&Number.isInteger(a.bytes)&&a.bytes>=0&&a.bytes<=1048576)&&value.artifacts.reduce((sum,a)=>sum+a.bytes,0)<=1048576);
   return {ok:true,errors:[]};
  }catch(e){return {ok:false,errors:[e.message]};}}
  return {example,validate,assert,notebook,metadata,report,canonical};
 }
 async function sha256(value){const bytes=new TextEncoder().encode(typeof value==='string'?value:canonical(value));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');}
 return {RECIPES,STAGES,create,canonical,sha256};
});
