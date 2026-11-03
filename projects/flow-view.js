(function(root){
  function render(activity,record,lang,elements,onMove){
    const trace=activity.traces.find(t=>t.id===record.flow.traceId)||activity.traces[0];
    const at=Math.max(0,trace.nodes.findIndex(n=>n.id===record.flow.nodeId)),node=trace.nodes[at],en=lang==='en';
    elements.choices.replaceChildren();for(const t of activity.traces){const b=document.createElement('button');b.textContent=t.title[lang];b.setAttribute('aria-pressed',String(t.id===trace.id));b.onclick=()=>onMove(t.id,0);elements.choices.append(b);}
    elements.path.replaceChildren();trace.nodes.forEach((n,i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${n.title[lang]}`;if(i===at)b.setAttribute('aria-current','step');b.onclick=()=>onMove(trace.id,i-at);elements.path.append(b);});
    elements.title.textContent=node.title[lang];elements.input.textContent=JSON.stringify(node.input,null,2);elements.output.textContent=JSON.stringify(node.output,null,2);elements.explanation.textContent=node.explanation[lang];elements.explanation.classList.toggle('flow-warning',node.failure===true);
    elements.prev.textContent=en?'Previous flow stage':'Etapa anterior do fluxo';elements.next.textContent=en?'Next flow stage':'Próxima etapa do fluxo';elements.reset.textContent=en?'Restart flow':'Reiniciar fluxo';elements.prev.disabled=at===0;elements.next.disabled=at===trace.nodes.length-1;elements.prev.onclick=()=>onMove(trace.id,-1);elements.next.onclick=()=>onMove(trace.id,1);elements.reset.onclick=()=>onMove(trace.id,-at);
  }
  root.PythonLabFlow={render};
})(globalThis);
