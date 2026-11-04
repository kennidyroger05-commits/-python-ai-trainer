(function(root,factory){
 const S=typeof module==='object'&&module.exports&&typeof require==='function'?require('../core/storage'):root.TrainerStorage;
 const api=factory(S);if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.ExecutableProgress=api;
})(globalThis,function(S){
 const KEY='pythonExecutableV1',count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
 function empty(){return {version:1,lessons:{},awards:{}};}
 function valid(v){return v&&v.version===1&&v.lessons&&typeof v.lessons==='object'&&!Array.isArray(v.lessons)&&v.awards&&typeof v.awards==='object'&&!Array.isArray(v.awards);}
 function load(storage,catalog){
  const raw=S.read(storage,KEY).value,state=empty();if(!valid(raw))return state;
  for(const l of catalog){const r=raw.lessons[l.id];if(!r||typeof r!=='object')continue;
   state.lessons[l.id]={attempts:count(r.attempts),hints:Math.min(2,count(r.hints)),passedTests:count(r.passedTests),failedTests:count(r.failedTests),unrunTests:count(r.unrunTests),completedAt:Number.isFinite(r.completedAt)&&r.completedAt>0?r.completedAt:null,validatedTests:count(r.validatedTests),pythonVersion:typeof r.pythonVersion==='string'?r.pythonVersion:null,codeHash:typeof r.codeHash==='string'&&/^[a-f0-9]{64}$/.test(r.codeHash)?r.codeHash:null,lastStatus:typeof r.lastStatus==='string'?r.lastStatus:null};
   if([2,5,10].includes(raw.awards[l.id]))state.awards[l.id]=raw.awards[l.id];
  }return state;
 }
 function get(state,l){return state.lessons[l.id] ||= {attempts:0,hints:0,passedTests:0,failedTests:0,unrunTests:l.tests.length,completedAt:null,validatedTests:0,pythonVersion:null,codeHash:null,lastStatus:null};}
 function hint(state,l){get(state,l).hints=Math.min(2,get(state,l).hints+1);}
 function record(state,l,result,hash,now=Date.now()){
  if(['cancelled','initialization_error','policy_error'].includes(result.status))return 0;
  const r=get(state,l);r.attempts++;r.lastStatus=result.status;
  const cases=result.cases||[];r.passedTests=cases.filter(c=>c.passed).length;r.failedTests=cases.filter(c=>!c.passed).length;r.unrunTests=Math.max(0,l.tests.length-r.passedTests-r.failedTests);
  const passed=result.status==='success'&&cases.length===l.tests.length&&l.tests.every(t=>cases.filter(c=>c.id===t.id&&c.passed).length===1);
  if(!passed)return 0;
  // Completion evidence survives a later unsuccessful revisit. Never store the source.
  r.completedAt ||= now;r.pythonVersion=result.pythonVersion;r.codeHash=hash;r.validatedTests=l.tests.length;
  if(Object.hasOwn(state.awards,l.id))return 0;
  const earned=r.hints?2:r.attempts===1?10:5;state.awards[l.id]=earned;return earned;
 }
 function xp(state){return Object.values(state.awards).reduce((a,b)=>a+b,0);}
 function save(storage,state){return S.write(storage,KEY,state,valid);}
 function report(state,l,lang){
  const r=get(state,l),en=lang==='en';if(!r.completedAt)throw Error('Complete validation first');
  return [`# ${l.title[lang]}`,'',en?'Real local Python execution — Pyodide/CPython WebAssembly. Not a remote experiment.':'Execução Python real local — Pyodide/CPython WebAssembly. Não é experimento remoto.','',l.goal[lang],`Python: ${r.pythonVersion}`,`${en?'Passed validation tests at completion':'Testes aprovados na conclusão'}: ${r.validatedTests}/${l.tests.length}`,`SHA-256: ${r.codeHash}`,`${en?'First completion in UTC':'Primeira conclusão em UTC'}: ${new Date(r.completedAt).toISOString()}`,'',en?'This records a local educational exercise, not professional certification or real model training. Source code is not stored in progress.':'Este registro é de um exercício didático local, não certificado profissional ou treinamento real. O código-fonte não é salvo no progresso.'].join('\n');
 }
 return {KEY,empty,valid,load,get,hint,record,xp,save,report};
});
