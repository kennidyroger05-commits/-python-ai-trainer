'use strict';
const $=id=>document.getElementById(id);
let lessons=[],i=0,h=0,selected=[],executor=null,solved=false;
const started=performance.now(),pilot={version:1,attempts:0,wrong:0,hints:0,missionsCompleted:0,pythonAttempts:0,pythonPassed:false};
$('report').onclick=()=>{const data={...pilot,elapsedSeconds:Math.round((performance.now()-started)/1000)};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='trainer-pilot-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function feedback(correct,l){pilot.attempts++;if(!correct)pilot.wrong++;$('feedback').textContent=correct?l.explanation:'Ainda não. Revise o código e tente novamente.';if(correct){if(!solved)pilot.missionsCompleted++;solved=true;$('next').disabled=false;$('hint').disabled=true;for(const el of $('choices').querySelectorAll('button'))el.disabled=true;}}
function button(text,fn){return Object.assign(document.createElement('button'),{textContent:text,onclick:fn,type:'button'});}
function render(){
 const l=lessons[i];if(!l){$('lesson').hidden=true;$('practice').hidden=false;return;}
 $('count').textContent=(i+1)+' / '+lessons.length;$('title').textContent=l.title;$('prompt').textContent=l.prompt;$('code').textContent=[l.context,l.code].filter(Boolean).join('\n');$('feedback').textContent='';$('next').disabled=true;$('hint').disabled=false;h=0;selected=[];solved=false;
 const choices=$('choices');choices.replaceChildren();
 if(l.options){for(const [j,opt] of l.options.entries())choices.append(button(opt,()=>feedback(j===l.correct,l)));}
 else{
  const assembled=document.createElement('pre');assembled.textContent='Monte sua resposta';choices.append(assembled);
  const blocks=l.blocks.map((b,j)=>button(b,()=>{selected.push(j);blocks[j].disabled=true;assembled.textContent=selected.map(k=>l.blocks[k]).join('');}));
  // Stable reversal avoids showing the correct order in all tasks.
  choices.append(...blocks.slice().reverse(),button('Limpar',()=>{selected=[];blocks.forEach(b=>b.disabled=false);assembled.textContent='Monte sua resposta';}),button('Verificar código',()=>feedback(l.answers.includes(selected.map(k=>l.blocks[k]).join('')),l)));
 }
}
$('hint').onclick=()=>{if(!solved){pilot.hints++;const l=lessons[i];$('feedback').textContent=l.hints[Math.min(h++,l.hints.length-1)]||'Leia o código novamente.';}};
$('next').onclick=()=>{if(solved){i++;render();}};
$('execute').disabled=true;
fetch('/demo.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{lessons=data;render();}).catch(()=>{$('feedback').textContent='Não foi possível carregar. Recarregue a página.';});
let contract=null;fetch('/demo-exec.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(l=>{contract=l;$('source').value=l.starter;executor=window.PythonExecutor.create();$('execute').disabled=false;}).catch(()=>{$('execution').textContent='Prática indisponível; tente recarregar.';});
$('execute').onclick=async()=>{if(!contract||!executor)return;pilot.pythonAttempts++;$('execute').disabled=true;$('stop').disabled=false;$('source').readOnly=true;try{const res=await executor.run({code:$('source').value,mode:'validate',tests:contract.tests},{onProgress:e=>{$('execution').textContent=e.phase==='downloading'?'Carregando Python: '+Math.round(100*e.loaded/e.total)+'%':'Executando testes…';}});const passed=(res.cases||[]).filter(c=>c.passed).length;if(res.status==='success'&&passed===contract.tests.length)pilot.pythonPassed=true;$('execution').textContent=res.status==='success'&&passed===contract.tests.length?'Unidade gratuita concluída! Todos os testes passaram.':passed+' de '+contract.tests.length+' testes aprovados ('+res.status+').';$('output').textContent=[res.stdout,res.stderr].filter(Boolean).join('\n');}catch{$('execution').textContent='Falha ao executar. Verifique a conexão e a memória.';}finally{$('execute').disabled=false;$('stop').disabled=true;$('source').readOnly=false;}};
$('stop').onclick=()=>executor?.stop();window.addEventListener('pagehide',()=>executor?.release());
