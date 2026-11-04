(function(root,factory){
 const S=typeof module==='object'&&module.exports&&typeof require==='function'?require('../core/storage'):root.TrainerStorage;
 const api=factory(S);if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.ExecutableProgress=api;
})(globalThis,function(S){
 const KEY='pythonExecutableV1',count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
 const date=n=>Number.isSafeInteger(n)&&n>0&&n<8640000000000000?n:null;
 const runValid=r=>r.runs===undefined||Number.isSafeInteger(r.runs)&&r.runs>=0&&(r.lastRunAt===null||date(r.lastRunAt)!==null)&&(r.runPythonVersion===null||/^3\.\d+\.\d+$/.test(r.runPythonVersion))&&(r.lastRunStatus===null||['success','tests_failed','syntax_error','runtime_error','assertion_error'].includes(r.lastRunStatus));
 function empty(){return {version:1,lessons:{},awards:{}};}
 function shape(v){return v&&v.version===1&&v.lessons&&typeof v.lessons==='object'&&!Array.isArray(v.lessons)&&v.awards&&typeof v.awards==='object'&&!Array.isArray(v.awards);}
 function valid(v){
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x),counter=n=>Number.isSafeInteger(n)&&n>=0;
  return object(v)&&v.version===1&&object(v.lessons)&&object(v.awards)&&Object.values(v.awards).every(n=>[2,5,10].includes(n))&&Object.values(v.lessons).every(r=>object(r)&&(r.openedAt===undefined||r.openedAt===null||date(r.openedAt)!==null)&&runValid(r)&&counter(r.attempts)&&[0,1,2].includes(r.hints)&&['passedTests','failedTests','unrunTests','validatedTests'].every(k=>counter(r[k])&&r[k]<=8)&&(r.completedAt===null||date(r.completedAt)!==null)&&(r.validatedAt==null||date(r.validatedAt)!==null)&&(r.pythonVersion===null||/^\d+\.\d+\.\d+$/.test(r.pythonVersion))&&(r.codeHash===null||/^[a-f0-9]{64}$/.test(r.codeHash))&&(r.lastStatus===null||['success','tests_failed','syntax_error','runtime_error','assertion_error','timeout'].includes(r.lastStatus)));
 }
 function load(storage,catalog){
  const raw=S.read(storage,KEY).value,state=empty();if(!shape(raw))return state;
  for(const l of catalog){if([2,5,10].includes(raw.awards[l.id]))state.awards[l.id]=raw.awards[l.id];const r=raw.lessons[l.id];if(!r||typeof r!=='object')continue;
   state.lessons[l.id]={attempts:count(r.attempts),hints:Math.min(2,count(r.hints)),passedTests:Math.min(l.tests.length,count(r.passedTests)),failedTests:Math.min(l.tests.length,count(r.failedTests)),unrunTests:Math.min(l.tests.length,count(r.unrunTests)),completedAt:date(r.completedAt),validatedAt:date(r.validatedAt),validatedTests:r.validatedTests===l.tests.length?l.tests.length:0,pythonVersion:typeof r.pythonVersion==='string'&&/^\d+\.\d+\.\d+$/.test(r.pythonVersion)?r.pythonVersion:null,codeHash:typeof r.codeHash==='string'&&/^[a-f0-9]{64}$/.test(r.codeHash)?r.codeHash:null,lastStatus:['success','tests_failed','syntax_error','runtime_error','assertion_error','timeout'].includes(r.lastStatus)?r.lastStatus:null};
   const normalized=state.lessons[l.id];if(normalized.validatedTests!==l.tests.length||!normalized.codeHash||!/^\d+\.\d+\.\d+$/.test(normalized.pythonVersion||''))normalized.completedAt=null;
   Object.assign(normalized,{openedAt:date(r.openedAt),runs:count(r.runs),lastRunAt:date(r.lastRunAt),runPythonVersion:typeof r.runPythonVersion==='string'&&/^3\.\d+\.\d+$/.test(r.runPythonVersion)?r.runPythonVersion:null,lastRunStatus:['success','tests_failed','syntax_error','runtime_error','assertion_error'].includes(r.lastRunStatus)?r.lastRunStatus:null});
  }return state;
 }
 function get(state,l){return state.lessons[l.id] ||= {attempts:0,hints:0,passedTests:0,failedTests:0,unrunTests:l.tests.length,completedAt:null,validatedAt:null,validatedTests:0,pythonVersion:null,codeHash:null,lastStatus:null,openedAt:null,runs:0,lastRunAt:null,runPythonVersion:null,lastRunStatus:null};}
 function hint(state,l){get(state,l).hints=Math.min(2,get(state,l).hints+1);}
 function recordRun(state,l,result,now=Date.now()){
  if(!/^3\.\d+\.\d+$/.test(result.pythonVersion||'')||!['success','tests_failed','syntax_error','runtime_error','assertion_error'].includes(result.status))return false;
  Object.assign(get(state,l),{runs:count(get(state,l).runs)+1,lastRunAt:now,runPythonVersion:result.pythonVersion,lastRunStatus:result.status});return true;
 }
 function record(state,l,result,hash,now=Date.now()){
  if(['cancelled','initialization_error','policy_error'].includes(result.status))return 0;
  const r=get(state,l);r.attempts++;r.lastStatus=result.status;
  const cases=result.cases||[];r.passedTests=cases.filter(c=>c.passed).length;r.failedTests=cases.filter(c=>!c.passed).length;r.unrunTests=Math.max(0,l.tests.length-r.passedTests-r.failedTests);
  const passed=result.status==='success'&&cases.length===l.tests.length&&l.tests.every(t=>cases.filter(c=>c.id===t.id&&c.passed).length===1);
  if(!passed)return 0;
  // Completion evidence survives a later unsuccessful revisit. Never store the source.
  r.completedAt ||= now;r.validatedAt=now;r.pythonVersion=result.pythonVersion;r.codeHash=hash;r.validatedTests=l.tests.length;
  if(Object.hasOwn(state.awards,l.id))return 0;
  const earned=r.hints?2:r.attempts===1?10:5;state.awards[l.id]=earned;return earned;
 }
 function xp(state){return Object.values(state.awards).reduce((a,b)=>a+b,0);}
 function save(storage,state){return S.write(storage,KEY,state,valid);}
 function report(state,l,lang){
  const r=get(state,l),en=lang==='en';if(!r.completedAt)throw Error('Complete validation first');
  return [`# ${l.title[lang]}`,'',en?'Real local Python execution — Pyodide/CPython WebAssembly. Not a remote experiment.':'Execução Python real local — Pyodide/CPython WebAssembly. Não é experimento remoto.','',l.goal[lang],`Python: ${r.pythonVersion}`,`${en?'Passed validation tests at completion':'Testes aprovados na conclusão'}: ${r.validatedTests}/${l.tests.length}`,`SHA-256: ${r.codeHash}`,`${en?'First completion in UTC':'Primeira conclusão em UTC'}: ${new Date(r.completedAt).toISOString()}`,`${en?'Last validated snapshot in UTC':'Último snapshot validado em UTC'}: ${new Date(r.validatedAt||r.completedAt).toISOString()}`,'',en?'This records a local educational exercise, not professional certification or real model training. Source code is not stored in progress.':'Este registro é de um exercício didático local, não certificado profissional ou treinamento real. O código-fonte não é salvo no progresso.'].join('\n');
 }
 return {KEY,empty,valid,load,get,hint,recordRun,record,xp,save,report};
});
