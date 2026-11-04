(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.LearningPath=api;})(globalThis,function(){
  const integer=n=>Number.isSafeInteger(n)&&n>=0?n:0;
  const key=a=>a.kind+'/'+a.id;
  function validate(graph,{missions,lessons,activities,experiments},{partial=false}={}){
    const refs={mission:new Set(missions.map(m=>m.id)),executable:new Set(lessons.map(l=>l.id)),activity:new Set(activities.map(key)),experiment:new Set(experiments.map(e=>e.id))};
    if(graph?.version!==1||!Array.isArray(graph.links)||!graph.projectRequires||typeof graph.projectRequires!=='object'||Array.isArray(graph.projectRequires)||!graph.lessonPreparation||typeof graph.lessonPreparation!=='object'||Array.isArray(graph.lessonPreparation))throw Error('Invalid learning graph');
    const ids=new Set(),executables=new Set();
    for(const edge of graph.links){
      if(!edge.id||ids.has(edge.id)||!Array.isArray(edge.missions)||!edge.missions.length||new Set(edge.missions).size!==edge.missions.length||edge.missions.some(id=>!refs.mission.has(id))||(!partial||refs.executable.size)&&!refs.executable.has(edge.executable)||executables.has(edge.executable)||edge.activity&&(!partial||refs.activity.size)&&!refs.activity.has(edge.activity)||edge.experiment&&(!partial||refs.experiment.size)&&!refs.experiment.has(edge.experiment))throw Error('Invalid learning connection');
      ids.add(edge.id);executables.add(edge.executable);
    }
    if(!partial&&executables.size!==lessons.length||lessons.some(l=>!executables.has(l.id)))throw Error('Unconnected executable challenge');
    for(const [id,requires]of Object.entries(graph.projectRequires))if((!partial||refs.activity.size)&&!refs.activity.has(id)||!id.startsWith('project/')||!Array.isArray(requires)||!requires.length||requires.some(id=>!refs.mission.has(id)))throw Error('Invalid project preparation');
    for(const [id,requires]of Object.entries(graph.lessonPreparation))if((!partial||refs.executable.size)&&!refs.executable.has(id)||!Array.isArray(requires)||requires.some(id=>(!partial||refs.activity.size)&&!refs.activity.has(id)))throw Error('Invalid executable preparation');
    return graph;
  }
  function missionStatus(m,p){return p.completed.includes(m.id)?'completed':integer(p.attempts[m.id])?'started':'available';}
  function validatePreparations(rows,{missions,lessons},{partial=false}={}){
    if(!Array.isArray(rows))throw Error('Invalid preparation catalog');const ids=new Set();
    for(const p of rows){if(!p||typeof p.id!=='string'||ids.has(p.id)||!['mission','executable'].includes(p.kind)||typeof p.target!=='string'||typeof p.example!=='string'||!p.example.trim()||['title','meaning','ai'].some(k=>['pt','mixed','en'].some(l=>typeof p[k]?.[l]!=='string'||!p[k][l].trim())))throw Error('Invalid preparation');const catalog=p.kind==='mission'?missions:lessons;if((!partial||catalog.length)&&!catalog.some(a=>a.id===p.target))throw Error('Invalid preparation target');ids.add(p.id);}return rows;
  }
  function nextMission(missions,p,resumeId){
    const eligible=m=>!p.completed.includes(m.id)&&m.requires.every(id=>p.completed.includes(id));
    const resumed=missions.find(m=>m.id===resumeId&&eligible(m));if(resumed)return resumed;
    return missions.find(eligible)||missions.find(m=>!p.completed.includes(m.id))||null;
  }
  function summarize({missions,lessons,activities,mission,project={},runtime={},model={},experiments={},reports=[],availability=null}){
    const completed=new Set(mission.completed.filter(id=>missions.some(m=>m.id===id))),presented=new Set(),practiced=new Set(),correct=new Set(),review=new Set();
    for(const m of missions){const c=mission.concepts?.[m.concept];if(integer(mission.attempts[m.id])||completed.has(m.id))presented.add(m.concept);if(integer(mission.attempts[m.id]))practiced.add(m.concept);if(completed.has(m.id))correct.add(m.concept);if(c&&(c.recent?.includes(false)||c.hints>=2))review.add(m.concept);}
    for(const e of Object.values(project.evidence||{})){if(!e?.concept)continue;if(e.presented)presented.add(e.concept);if(e.practiced)practiced.add(e.concept);if(e.passed)correct.add(e.concept);if(e.recent?.slice(-3).includes(false)||e.hints>=2)review.add(e.concept);}
    const activityRows=activities.map(a=>{const r=project.activities?.[key(a)],done=a.steps.filter(s=>r?.steps?.[s.id]?.passed).length;return {kind:a.kind,id:a.id,key:key(a),done,total:a.steps.length,status:r?.completedAt&&done===a.steps.length?'completed':r?.openedAt||done?'started':'available'};});
    const pythonRows=lessons.map(l=>{const r=runtime.lessons?.[l.id],validated=!!(r?.completedAt&&r.codeHash&&r.pythonVersion&&r.validatedTests===l.tests.length),executed=!!(integer(r?.runs)||validated);if(r?.openedAt||executed)presented.add(l.concept);if(executed)practiced.add(l.concept);if(validated)correct.add(l.concept);return {id:l.id,executed,validated,status:validated?'completed':r?.openedAt||executed||integer(r?.attempts)||integer(r?.hints)?'started':'available',tests:validated?r.validatedTests:0,python:validated?r.pythonVersion:r?.runPythonVersion||null,sha256:validated?r.codeHash:null};});
    const prepared=Object.entries(experiments.drafts||{}).map(([id,r])=>({kind:'recipe',id,jobId:r.spec.id,seen:[...r.seen],status:'prepared'}));
    for(const r of Object.values(model.experiments||{}))if(r.job.execution==='remote-kaggle')prepared.push({kind:'planner',id:r.job.id,name:r.job.name,jobId:r.job.id,seen:[],status:'prepared'});
    const simulations=Object.values(model.experiments||{}).filter(r=>r.job.execution==='simulation').map(r=>({id:r.job.id,status:r.lastSimulationStatus||'prepared'}));
    return {available:availability||{projects:activities.length>0,runtime:lessons.length>0,experiments:true,model:true},missions:{completed:completed.size,total:missions.length,started:missions.filter(m=>missionStatus(m,mission)==='started').length},activities:activityRows,python:pythonRows,prepared,simulations,reports:reports.map(r=>({...r})),xp:{missions:Number.isFinite(mission.xp)&&mission.xp>=0?mission.xp:0,lab:Object.values(project.awards||{}).reduce((s,n)=>s+integer(n),0),python:Object.values(runtime.awards||{}).reduce((s,n)=>s+integer(n),0)},concepts:{presented:[...presented].sort(),practiced:[...practiced].sort(),correct:[...correct].sort(),review:[...review].sort()}};
  }
  function related(graph,context){
    const found=graph.links.filter(e=>context.kind==='mission'?e.missions.includes(context.id):context.kind==='executable'?e.executable===context.id:context.kind==='activity'?e.activity===context.id:context.kind==='experiment'&&e.experiment===context.id),items=[];
    for(const edge of found){for(const id of edge.missions)items.push({kind:'mission',id});items.push({kind:'executable',id:edge.executable});if(edge.activity)items.push({kind:'activity',id:edge.activity});if(edge.experiment)items.push({kind:'experiment',id:edge.experiment});}
    return items.filter((item,i,all)=>(item.kind!==context.kind||item.id!==context.id)&&all.findIndex(x=>x.kind===item.kind&&x.id===item.id)===i);
  }
  function recommend({graph,missions,lessons,activities,mission,project={},runtime={},reviewIds=[]}){
    const result=[],next=nextMission(missions,mission);if(reviewIds.length)result.push({kind:'review',id:reviewIds[0],reason:'review'});
    if(next)result.push({kind:'mission',id:next.id,reason:'continue'});
    const started=activities.find(a=>a.kind==='project'&&project.activities?.[key(a)]?.openedAt&&!project.activities[key(a)].completedAt);
    if(started)result.push({kind:'activity',id:key(started),reason:'resume'});
    const ready=l=>graph.links.some(e=>e.executable===l.id)&&l.requires.every(id=>mission.completed.includes(id))&&(graph.lessonPreparation?.[l.id]||[]).every(id=>{const a=activities.find(a=>key(a)===id),r=project.activities?.[id];return r?.completedAt&&a?.steps.every(s=>r.steps[s.id]?.passed);});
    const executable=lessons.find(l=>!runtime.lessons?.[l.id]?.completedAt&&ready(l));if(executable)result.push({kind:'executable',id:executable.id,reason:runtime.lessons?.[executable.id]?.attempts?'repair':'practice'});
    if(!started){const a=activities.find(a=>a.kind==='project'&&!project.activities?.[key(a)]?.completedAt&&Array.isArray(graph.projectRequires[key(a)])&&graph.projectRequires[key(a)].every(id=>mission.completed.includes(id)));if(a)result.push({kind:'activity',id:key(a),reason:'apply'});}
    return result.slice(0,3);
  }
  function markdown(summary,lang='mixed',now=Date.now()){
    const t=(pt,en)=>lang==='en'?en:pt,lines=['# Python AI Trainer — '+t('registro didático local','local educational record'),'',t('Evidências deste navegador; não é certificado ou comprovação de experiência profissional. XP não mede domínio.','Evidence from this browser; not certification or proof of professional experience. XP does not measure mastery.'),'',new Date(now).toISOString(),'',`## ${t('Missões por escolhas/blocos','Choice/block missions')}`,`${summary.missions.completed}/${summary.missions.total}`,'',`## ${t('Projetos e atividades simulados','Simulated projects and activities')}`];
    if(!summary.available.projects)lines.push(t('Dados de projetos indisponíveis nesta sessão; histórico não apagado.','Project data unavailable in this session; history was not deleted.'));for(const a of summary.available.projects?summary.activities:[])lines.push(`- ${a.key}: ${a.status} (${a.done}/${a.total}) · simulation`);
    lines.push('',`## ${t('Python real local','Real local Python')}`);if(!summary.available.runtime)lines.push(t('Dados Python indisponíveis nesta sessão; não inferimos progresso zero.','Python data unavailable in this session; zero progress is not inferred.'));for(const r of (summary.available.runtime?summary.python:[]).filter(r=>r.executed))lines.push(`- ${r.id}: ${r.validated?t('testes aprovados','tests passed'):t('executado; sem conclusão validada','executed; no validated completion')} · ${r.tests} ${t('testes na conclusão','tests at completion')} · CPython ${r.python||'—'} · SHA-256 ${r.sha256||'—'} · local-browser`);
    lines.push('',`## ${t('Simulações de experimentos','Experiment simulations')}`);for(const r of summary.simulations)lines.push(`- ${r.id}: ${r.status} · simulation`);
    lines.push('',`## ${t('Experimentos preparados; nenhum envio','Prepared experiments; no submission')}`);if(!summary.available.experiments||!summary.available.model)lines.push(t('Alguns contratos não puderam ser consultados; não inferimos ausência de histórico.','Some contracts could not be read; absence of history is not inferred.'));for(const r of summary.prepared)lines.push(`- ${r.jobId}: prepared · ${r.kind==='planner'?t('contrato preparatório','preparation contract'):`${r.seen.length}/10 ${t('etapas consultadas','stages viewed')}`} `);
    lines.push('',`## ${t('Relatórios consultados; origem declarada','Viewed reports; declared origin')}`);for(const r of summary.reports)lines.push(`- ${r.id}: ${r.source} · ${r.reference?t('referência de desenvolvimento','development reference'):t('arquivo importado','imported file')} · SHA-256 ${r.sha256}`);
    lines.push('',t('Nenhuma execução Kaggle autenticada foi confirmada por este aplicativo. Simulação, preparação e arquivo importado não comprovam execução remota. Código livre não foi incluído.','No authenticated Kaggle execution was confirmed by this app. Simulation, preparation and an imported file do not prove remote execution. Free code was not included.'));return lines.join('\n');
  }
  return {validate,validatePreparations,missionStatus,nextMission,summarize,related,recommend,markdown};
});
