'use strict';(async()=>{
 const $=id=>document.getElementById(id);
 try{
  if(!window.TrainerAccount)throw Error('Conta não identificada');
  const storage=window.TrainerStorage.browser();
  // A missing record is different from denied storage; do not silently claim zero progress.
  const check=window.TrainerStorage.read(storage,'pythonAiTrainerV2');if(check.status==='unavailable'||check.status==='corrupt')throw Error('Progresso local indisponível');
  const fetchJSON=async path=>{const r=await fetch(path);if(!r.ok)throw Error('Catálogo indisponível');return r.json();};
  const [plan,lessons,projects]=await Promise.all(['curriculum/units.json','runtime/lessons.json','projects/catalog.json'].map(fetchJSON));
  const result=window.TrainerCompletion.summarize(plan,lessons,projects,window.TrainerProgress.load(storage),window.ExecutableProgress.load(storage,lessons),window.PythonLabEngine.load(storage,projects));
  const labels=[['Missões registradas',result.missionCount+'/145'],['Unidades concluídas',result.units+'/14'],['Desafios Python registrados',result.runtimeCount+'/14'],['Projetos guiados simulados',result.projectCount+'/4']];
  for(const [key,value] of labels){const a=document.createElement('dt'),b=document.createElement('dd');a.textContent=key;b.textContent=value;$('counts').append(a,b);}
  $('eligibility').textContent=result.ready?'Todos os requisitos locais preliminares registrados. Solicite avaliação independente quando disponível.':'Continue praticando para completar os requisitos locais preliminares.';
  $('date').textContent='Registro gerado em '+new Date().toLocaleString('pt-BR');$('record').hidden=false;$('status').textContent='Registro local carregado.';$('print').disabled=false;$('print').onclick=()=>window.print();
 }catch(e){$('status').textContent=e.message||'Não foi possível carregar o progresso.';}
})();