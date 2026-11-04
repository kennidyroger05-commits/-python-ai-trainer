(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.ModelLabContracts=api;})(globalThis,function(){
 /** @typedef {{version:1,id:string,name:string,objective:string,execution:'simulation'|'local-python'|'remote-kaggle',task:'inference'|'evaluation'|'fine-tuning',model:{id:string,parameters:number,quantization:string|null},dataset:{id:string,source:'fixture',examples:number},config:{seed:number,epochs:number,batchSize:number},environment:{python:string,accelerator:'cpu'|'gpu',internet:boolean},status:string}} Experiment */
 const STATUSES=['prepared','queued','running','completed','failed','cancelled'],MODES=['simulation','local-python','remote-kaggle'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 function validate(job){
  const errors=[],obj=x=>x&&typeof x==='object'&&!Array.isArray(x),text=x=>typeof x==='string'&&x.trim().length>0&&x.length<=500;
  if(!obj(job))return {ok:false,errors:['job must be an object']};
  if(job.version!==1)errors.push('Unsupported contract version');
  if(!/^[a-z][a-z0-9-]{2,63}$/.test(job.id||''))errors.push('Invalid experiment id');
  if(!text(job.name)||!text(job.objective))errors.push('Name and objective required');
  if(!MODES.includes(job.execution))errors.push('Invalid execution type');
  if(!['inference','evaluation','fine-tuning'].includes(job.task))errors.push('Invalid task');
  if(!STATUSES.includes(job.status))errors.push('Invalid status');
  if(!obj(job.model)||!text(job.model.id)||!Number.isSafeInteger(job.model.parameters)||job.model.parameters<50000000||job.model.parameters>500000000||!(job.model.quantization===null||['int8','int4'].includes(job.model.quantization)))errors.push('Model contract: 50M–500M parameters, optional int4/int8');
  if(!obj(job.dataset)||!text(job.dataset.id)||job.dataset.source!=='fixture'||!Number.isSafeInteger(job.dataset.examples)||job.dataset.examples<1)errors.push('Invalid fixture dataset');
  if(!obj(job.config)||!Number.isSafeInteger(job.config.seed)||job.config.seed<0||!Number.isInteger(job.config.epochs)||job.config.epochs<1||job.config.epochs>10||!Number.isInteger(job.config.batchSize)||job.config.batchSize<1||job.config.batchSize>32)errors.push('Invalid seed/epochs/batch size');
  if(!obj(job.environment)||!text(job.environment.python)||!['cpu','gpu'].includes(job.environment.accelerator)||job.environment.internet!==false)errors.push('Invalid environment (preparation keeps internet disabled)');
  // Closed configuration: credentials, arbitrary notebook scripts and remote URLs are not accepted.
  const keys=['version','id','name','objective','execution','task','model','dataset','config','environment','status'];
  if(Object.keys(job).some(k=>!keys.includes(k)))errors.push('Unknown job field (credentials are forbidden)');
  for(const [field,allowed]of [['model',['id','parameters','quantization']],['dataset',['id','source','examples']],['config',['seed','epochs','batchSize']],['environment',['python','accelerator','internet']]])if(obj(job[field])&&Object.keys(job[field]).some(k=>!allowed.includes(k)))errors.push('Unknown '+field+' field');
  // Reject secret-like material and URLs; model/dataset identifiers are public labels only.
  const serialized=JSON.stringify(job);if(/(?:https?:\/\/|kaggle_api_token|api[_-]?key|bearer\s|-----BEGIN)/i.test(serialized))errors.push('URLs and secret-like values are forbidden');
  return {ok:errors.length===0,errors};
 }
 function assert(job){const r=validate(job);if(!r.ok)throw Object.assign(Error(r.errors.join('; ')),{code:'INVALID_JOB'});return job;}
 function example(execution='simulation'){
  return {version:1,id:'compact-model-study',name:'Compact model experiment',objective:'Inspect a four-example educational evaluation contract; no model weights are loaded.',execution,task:'evaluation',model:{id:'placeholder-100m-not-downloaded',parameters:100000000,quantization:null},dataset:{id:'didactic-labels-four',source:'fixture',examples:4},config:{seed:7,epochs:2,batchSize:2},environment:{python:'3.x (remote environment to be pinned)',accelerator:'cpu',internet:false},status:'prepared'};
 }
 function notebookBundle(job){
  assert(job);
  const metadata={id:'YOUR_USERNAME/'+job.id,title:job.name,code_file:job.id+'.ipynb',language:'python',kernel_type:'notebook',is_private:true,enable_gpu:job.environment.accelerator==='gpu',enable_internet:job.environment.internet,dataset_sources:[],competition_sources:[],kernel_sources:[],model_sources:[]};
  // Preparation only. This notebook writes a contract artifact and performs no model inference/training.
  const code='import json\nfrom pathlib import Path\n\ncontract = json.loads('+JSON.stringify(JSON.stringify(job))+')\nassert contract["version"] == 1\nreport = {"status": "prepared_only", "model_executed": False, "contract": contract}\nPath("/kaggle/working/preparation.json").write_text(json.dumps(report, indent=2))\nprint("Preparation only: no model, inference or training was executed.")\n';
  const notebook={nbformat:4,nbformat_minor:5,metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'},language_info:{name:'python'}},cells:[{id:'explanation',cell_type:'markdown',metadata:{},source:['# Educational preparation only\n','No model weights, inference or training are executed. Review the owner, privacy, data and resources before using Kaggle. Credentials belong in an authorized backend or official CLI, never in this notebook/frontend.\n']},{id:'contract',cell_type:'code',metadata:{},execution_count:null,outputs:[],source:code.split(/(?<=\n)/)}]};
  return {metadata,notebook};
 }
 return {STATUSES,MODES,validate,assert,example,notebookBundle,clone};
});
