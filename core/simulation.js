(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.TrainerSimulation=api;})(globalThis,function(){
  function move(trace,index,delta){return Math.max(-1,Math.min(trace.steps.length-1,index+delta));}
  function snapshot(trace,index){return index<0?{variables:{},output:[],error:null}:structuredClone(trace.steps[index]);}
  function render(trace,index,lang,initial,els){
    const step=snapshot(trace,index);els.code.replaceChildren();
    trace.code.split('\n').forEach((line,i)=>{const span=document.createElement('span');span.textContent=line+'\n';if(step.line===i){span.className='current-line';span.setAttribute('aria-current','step');}els.code.append(span);});
    els.variables.textContent=JSON.stringify(step.variables,null,2);els.output.textContent=[...step.output,step.error?`${step.error.type}: ${step.error.message}`:''].filter(Boolean).join('\n');
    els.explanation.textContent=index<0?initial:step.explanation[lang];els.prev.disabled=index<0;els.next.disabled=index>=trace.steps.length-1;
  }
  return {move,snapshot,render};
});
