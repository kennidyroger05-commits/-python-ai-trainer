(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.PythonLabPortfolio=api;})(globalThis,function(){
  const text=(lang,pt,en)=>lang==='en'?en:pt;
  function markdown(activity,state,engine,models,datasets,lang='pt'){
    const record=engine.get(state,activity);
    if(activity.kind!=='project'||!record.completedAt||!activity.steps.every(s=>record.steps[s.id]?.passed))throw Error('Only completed guided projects can be exported');
    const t=(pt,en)=>text(lang,pt,en),tests=record.testRun?.results||[];
    const rows=[`# ${activity.title[lang]}`,'',t('Projeto didático e simulado — Python AI Lab','Educational simulated project — Python AI Lab'),'',`## ${t('Objetivo','Goal')}`,activity.goal[lang],'',`## ${t('Conceitos abordados','Concepts covered')}`,[...new Set(activity.steps.map(s=>s.concept))].join(', '),'',`## ${t('Etapas realizadas','Completed steps')}`];
    for(const step of activity.steps){const s=record.steps[step.id];rows.push(`- ${step.title[lang]} (${step.id}) — ${s.attempts} ${t('tentativa(s)','attempt(s)')}, ${s.hints} ${t('dica(s)','hint(s)')}`);}
    rows.push('',`## ${t('Resultado e solução','Result and solution')}`,activity.result[lang],'', '```python',activity.solutionCode,'```','',`## ${t('Artefato construído','Built artifact')}`,'```json',JSON.stringify(engine.artifact(state,activity),null,2),'```','',`## ${t('Testes didáticos executados','Executed educational tests')}`,t('Execução determinística simulada; nenhum código do aluno foi executado.','Deterministic simulated execution; no learner code was executed.'),'','```json',JSON.stringify(tests,null,2),'```','',t(`Execuções de teste registradas nesta tentativa do projeto: ${record.testRuns}.`,`Test runs recorded in this project attempt: ${record.testRuns}.`),'',`## ${t('Explicação','Explanation')}`,activity.steps.at(-1).explanation[lang],'',`## ${t('Limitações','Limitations')}`,activity.limitations[lang],t('Este relatório documenta uma atividade local de aprendizagem. Não comprova experiência profissional, empregabilidade ou execução de um serviço/modelo real.','This report documents a local learning activity. It does not prove professional experience, employability or execution of a real service/model.'),'',`${t('Conclusão registrada em UTC','Completion recorded in UTC')}: ${new Date(record.completedAt).toISOString()}`);
    return rows.join('\n');
  }
  function download(filename,content){const url=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return {markdown,download};
});
