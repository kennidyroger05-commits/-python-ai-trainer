(function(root){
  const E=root.PythonLabEngine,M=root.PythonLabModels,Portfolio=root.PythonLabPortfolio;
  const skillNames={fundamentals:['Fundamentos Python','Python fundamentals'],data:['Estruturas de dados','Data structures'],functions:['Funções','Functions'],debugging:['Debugging','Debugging'],api:['APIs','APIs'],logic:['Raciocínio lógico','Logical reasoning'],ai:['Fluxos de IA','AI workflows'],evaluation:['Avaliação de modelos','Model evaluation'],training:['Fundamentos de treinamento','Training foundations'],english:['Inglês técnico','Technical English']};
  function create({catalog,datasets,glossary,language,storage,missions,missionProgress,onHome,onReview,onWarning}){
    const $=id=>document.getElementById(id);let state=E.load(storage,catalog),view='hub',selected=null,group='project';
    E.importMissions(state,missionProgress(),missions);
    const t=(pt,en)=>language()==='en'?en:pt;
    function save(){if(!E.save(storage,state))onWarning(t('Não foi possível salvar o Lab. Mantenha esta aba aberta.','Could not save the Lab. Keep this tab open.'));}
    const activity=()=>catalog.find(a=>E.key(a)===selected);
    function button(parent,label,action,attrs={}){const b=document.createElement('button');b.textContent=label;b.onclick=action;for(const [k,v]of Object.entries(attrs))b.setAttribute(k,String(v));parent.append(b);return b;}
    function openActivity(key){$('projectsArea').hidden=false;$('pMenu').open=false;const a=catalog.find(a=>E.key(a)===key);if(!a)return;selected=key;view='activity';const r=E.get(state,a);r.openedAt ||= Date.now();render();save();focusHeading(E.get(state,a).conclusion?'pConclusionTitle':'pTitle');}
    function focusHeading(id){$(id).focus({preventScroll:true});$(id).scrollIntoView({block:'start'});}
    function header(){
      $('pMenuLabel').textContent=t('Menu do Lab','Lab menu');$('pObjectiveLabel').textContent=t('Problema e objetivo','Problem and goal');
      $('pHome').textContent=t('← Treino de missões','← Mission training');$('pHub').textContent=t('Projetos guiados','Guided projects');$('pDebug').textContent=t('Desafios de debugging','Debugging challenges');$('pTesting').textContent=t('Aprender a testar','Learn testing');$('pSkills').textContent=t('Minhas competências','My learning evidence');$('pPortfolio').textContent=t('Meus projetos','My projects');
      $('pXP').textContent=`${t('XP do Lab já conquistado','Lab XP already earned')}: ${E.xp(state)}`;
    }
    function renderList(){
      $('pList').replaceChildren();const lang=language();$('pListTitle').textContent=group==='debug'?t('Depuração profissional — casos didáticos','Professional debugging — educational cases'):t('Python AI Lab — Projetos','Python AI Lab — Projects');
      $('pListIntro').textContent=t('Construa uma solução por etapas. São dados fictícios; nada é enviado para serviços externos. O progresso é independente das missões.','Build a solution stage by stage. All data is fictional; nothing is sent to external services. Progress is independent from missions.');
      for(const a of catalog.filter(a=>a.kind===group)){
        const r=E.get(state,a),done=a.steps.filter(s=>r.steps[s.id]?.passed).length,card=document.createElement('article');card.className='project-card';const title=document.createElement('h3');title.textContent=a.title[lang];card.append(title);const goal=document.createElement('p');goal.textContent=a.goal[lang];card.append(goal);const progress=document.createElement('p');progress.textContent=`${done}/${a.steps.length} ${t('etapas validadas','validated steps')}`;card.append(progress);
        button(card,r.completedAt?t('Revisitar','Revisit'):r.openedAt?t('Retomar','Resume'):t('Abrir projeto','Open activity'),()=>openActivity(E.key(a)),{'data-activity':E.key(a)});$('pList').append(card);
      }
    }
    function renderStep(a){
      const r=E.get(state,a),s=a.steps.find(s=>s.id===r.currentStepId),draft=E.stepState(state,a,s),lang=language();
      E.present(state,E.unitKey(a,s),s.concept,s.skills);$('pTitle').textContent=a.title[lang];$('pGoal').textContent=a.goal[lang];$('pNavigationSummary').textContent=t('Etapas do projeto','Project stages');$('pContext').textContent=a.context[lang];$('pLimit').textContent=a.limitations[lang];
      $('pStep').textContent=`${a.steps.indexOf(s)+1}/${a.steps.length} · ${s.title[lang]}`;$('pPrompt').textContent=s.prompt[lang];$('pCode').textContent=s.code||'';$('pEvidence').hidden=!s.evidence;$('pEvidence').textContent=s.evidence?JSON.stringify(s.evidence,null,2):'';
      $('pProgress').textContent=`${a.steps.filter(st=>r.steps[st.id]?.passed).length}/${a.steps.length} ${t('etapas validadas','validated steps')}`;
      $('pStepList').replaceChildren();for(const st of a.steps){const b=button($('pStepList'),st.title[lang],()=>{r.currentStepId=st.id;r.conclusion=false;r.layer=null;r.term=null;render();save();focusHeading('pStep');},{'data-step':st.id});b.disabled=!st.requires.every(id=>r.steps[id]?.passed);if(st.id===s.id)b.setAttribute('aria-current','step');}
      $('pAnswers').replaceChildren();for(const c of s.choices){const b=button($('pAnswers'),c.label[lang],()=>{E.choose(state,a,s,c.id);render();save();},{'data-choice':c.id,'aria-pressed':draft.answerId===c.id});b.classList.toggle('selected',draft.answerId===c.id);b.disabled=draft.passed;}
      $('pSubmit').textContent=t('Verificar etapa','Check stage');$('pSubmit').disabled=draft.passed;$('pHint').textContent=draft.hints>=2?t('Dicas consultadas','Hints viewed'):`${t('Dica','Hint')} ${draft.hints+1}`;$('pHint').disabled=draft.passed||draft.hints>=2;
      $('pPrev').textContent=t('Etapa anterior','Previous stage');$('pPrev').disabled=s.id===a.steps[0].id;$('pNext').textContent=s.id===a.steps.at(-1).id?t('Ver conclusão','View conclusion'):t('Próxima etapa','Next stage');$('pNext').disabled=!draft.passed;$('pRestart').textContent=t('Reiniciar esta atividade','Restart this activity');
      const feedback=draft.feedback;let message='';
      if(feedback==='hint')message=s.hints[draft.hints-1][lang];
      if(feedback==='wrong')message=t('Ainda não. Compare sua resposta com o contrato e a evidência.','Not yet. Compare your answer with the contract and evidence.');
      if(feedback==='empty')message=t('Selecione uma resposta.','Select an answer.');
      if(feedback==='right')message=`${t('Etapa validada.','Stage validated.')} ${s.explanation[lang]} ${draft.lastGain?t(`Conquista registrada: +${draft.lastGain} XP.`,`Recorded award: +${draft.lastGain} XP.`):t('XP desta etapa já havia sido conquistado.','This stage XP was already earned.')}`;
      $('pFeedback').textContent=message;
      renderSupport(a,s,draft,r);renderLayers(s,r);renderTerms(s,r);
      const artifact=E.artifact(state,a);$('pArtifact').textContent=JSON.stringify(artifact,null,2);$('pPreview').textContent=JSON.stringify(M.workspace(a,artifact,datasets).preview??{},null,2);$('pSolution').textContent=a.solutionCode;
      $('pWorkspaceLabel').textContent=t('Workspace — artefato e código de referência','Workspace — artifact and reference code');$('pArtifactSummary').textContent=t('Cada etapa validada atualiza este artefato; as respostas incorretas não são aplicadas.','Each validated stage updates this artifact; incorrect answers are not applied.');
      $('pRunTests').textContent=t('Executar testes didáticos','Run educational tests');$('pTestsNotice').textContent=t('Simulação determinística de funções cadastradas; sem executar código do aluno.','Deterministic simulation of registered functions; no learner code is executed.');$('pTestsResult').textContent=r.testRun?r.testRun.results.map(test=>`${E.equal(test.expected,test.observed)?'✓':'✗'} ${test.id} — ${t('esperado','expected')}: ${JSON.stringify(test.expected)}; ${t('obtido','observed')}: ${JSON.stringify(test.observed)}`).join('\n'):t('Nenhum teste executado nesta tentativa.','No tests run in this attempt.');
      $('pFlowNotice').textContent=t('Fluxo simulado de referência da solução. O workspace acima mostra sua construção atual.','Simulated reference flow of the solution. The workspace above shows your current construction.');$('pFlowSummary').textContent=t('Explorar o fluxo','Explore the flow');$('pInputLabel').textContent=t('Entrada','Input');$('pOutputLabel').textContent=t('Saída','Output');
      root.PythonLabFlow.render(a,r,lang,{choices:$('pFlowChoices'),path:$('pFlowPath'),title:$('pFlowTitle'),input:$('pFlowInput'),output:$('pFlowOutput'),explanation:$('pFlowExplanation'),prev:$('pFlowPrev'),next:$('pFlowNext'),reset:$('pFlowReset')},(trace,delta)=>{E.flow(state,a,trace,delta);render();save();});
    }
    function renderSupport(a,s,draft,r){
      const legacy=missionProgress().concepts[s.concept],weak=E.weakConcept(state,s.concept)||legacy?.recent?.includes(false)||draft.feedback==='wrong';
      $('pSupport').hidden=!weak||r.dismissed===s.id;$('pSupportText').textContent=t('Há dificuldade registrada neste conceito. A revisão é opcional; você pode continuar a atividade.','Difficulty is recorded for this concept. Review is optional; you can continue the activity.');
      $('pReview').textContent=t('Revisar conceito','Review concept');$('pExample').textContent=t('Ver exemplo','See example');$('pProceed').textContent=t('Continuar mesmo assim','Continue anyway');
      $('pReview').onclick=()=>{save();onReview(s.reviewMissionId,()=>openActivity(E.key(a)));};$('pExample').onclick=()=>{r.layer='example';render();save();};$('pProceed').onclick=()=>{r.dismissed=s.id;render();save();};
    }
    function renderLayers(s,r){
      $('pLayers').replaceChildren();for(const [id,pt,en]of [['definition','Definição curta','Short definition'],['example','Exemplo aplicado','Applied example'],['professional','Aplicação profissional','Professional use']])button($('pLayers'),t(pt,en),()=>{r.layer=r.layer===id?null:id;render();save();},{'data-layer':id,'aria-expanded':r.layer===id});$('pLayerText').hidden=!r.layer;$('pLayerText').textContent=r.layer?s.layers[r.layer][language()]:'';
    }
    function renderTerms(s,r){
      $('pTerms').replaceChildren();for(const id of s.terms){const g=glossary[id];button($('pTerms'),language()==='en'?g[0]:`${g[0]} (${g[1]})`,()=>{r.term=r.term===id?null:id;E.present(state,`vocabulary/${id}`,id,['english']);render();save();},{'data-term':id,'aria-expanded':r.term===id});}
      const term=r.term&&glossary[r.term];$('pTermText').hidden=!term;$('pTermText').textContent=term?`${term[0]} — ${term[1]}: ${term[language()==='en'?3:2]}\n${term[4]}\n${term[language()==='en'?6:5]}`:'';
    }
    function renderConclusion(a){
      const r=E.get(state,a);$('pConclusionTitle').textContent=`${a.title[language()]} — ${t('concluído','completed')}`;$('pConclusionResult').textContent=a.result[language()];$('pConclusionLimit').textContent=a.limitations[language()];$('pRevisit').textContent=t('Revisitar etapas','Revisit stages');$('pExport').hidden=a.kind!=='project';$('pExport').textContent=t('Salvar relatório Markdown','Save Markdown report');$('pRevisit').onclick=()=>{r.conclusion=false;r.currentStepId=a.steps[0].id;render();save();};$('pExport').onclick=()=>download(a);
    }
    function download(a){try{Portfolio.download(`python-ai-lab-${a.id}.md`,Portfolio.markdown(a,state,E,M,datasets,language()));}catch{onWarning(t('Conclua o projeto antes de exportar.','Complete the project before exporting.'));}}
    function renderPortfolio(){
      $('pPortfolioTitle').textContent=t('Meus projetos','My projects');$('pPortfolioIntro').textContent=t('Registros locais de aprendizagem simulada. Não comprovam experiência profissional.','Local records of simulated learning. They do not prove professional experience.');$('pPortfolioList').replaceChildren();
      for(const a of catalog.filter(a=>a.kind==='project')){const r=E.get(state,a),card=document.createElement('article');card.className='project-card';const heading=document.createElement('h3');heading.textContent=a.title[language()];card.append(heading);const status=document.createElement('p');status.textContent=r.completedAt?t('Concluído — projeto didático','Completed — educational project'):r.openedAt?t('Em andamento','In progress'):t('Não iniciado','Not started');card.append(status);button(card,t('Abrir','Open'),()=>openActivity(E.key(a)));if(r.completedAt)button(card,t('Salvar Markdown','Save Markdown'),()=>download(a),{'data-export':a.id});$('pPortfolioList').append(card);}
    }
    function renderSkills(){
      E.importMissions(state,missionProgress(),missions);$('pSkillsTitle').textContent=t('Evidências de aprendizagem','Learning evidence');$('pSkillsIntro').textContent=t('Contamos conceitos distintos com evidência local. “Acertado” significa ao menos um acerto, não domínio. Revisão: erro nas três tentativas recentes ou duas dicas consultadas. Histórico concluído anterior conta como acerto observado; não inventamos tentativas ou erros ausentes. Consultar tradução não comprova proficiência.','We count distinct concepts with local evidence. “Correct” means at least one correct answer, not mastery. Review: an error in the last three attempts or two hints viewed. Previous completed history counts as an observed success; missing attempts or errors are not invented. Viewing a translation does not prove proficiency.');$('pSkillsCards').replaceChildren();
      for(const row of E.competencies(state)){const card=document.createElement('article');card.className='project-card';const h=document.createElement('h3');h.textContent=skillNames[row.skill][language()==='en'?1:0];card.append(h);for(const [field,pt,en]of [['presented','Apresentado','Presented'],['practiced','Praticado','Practiced'],['correct','Acertado ao menos uma vez','Correct at least once'],['review','Para revisar','Review suggested']]){const line=document.createElement('p');line.textContent=`${t(pt,en)}: ${row[field]}`;card.append(line);}$('pSkillsCards').append(card);}
    }
    function render(){
      header();for(const id of ['pListPanel','pActivity','pConclusion','pPortfolioPanel','pSkillsPanel'])$(id).hidden=true;
      if(view==='hub'){ $('pListPanel').hidden=false;renderList(); }
      else if(view==='activity'){const a=activity();if(!a)return;const r=E.get(state,a);if(r.conclusion&&r.completedAt){$('pConclusion').hidden=false;renderConclusion(a);}else{$('pActivity').hidden=false;renderStep(a);}}
      else if(view==='portfolio'){$('pPortfolioPanel').hidden=false;renderPortfolio();}
      else if(view==='skills'){$('pSkillsPanel').hidden=false;renderSkills();}
    }
    function open(){ $('projectsArea').hidden=false;view='hub';group='project';render();save(); }
    function hide(){ $('projectsArea').hidden=true;save(); }
    function missionPresented(e){E.present(state,`mission/${e.id}`,e.concept,EvidenceSkills(e.track));save();}
    function EvidenceSkills(track){return ({A:['fundamentals'],B:['logic'],C:['data'],D:['functions'],E:['api'],F:['debugging'],G:['ai'],H:['training','evaluation']})[track]||['fundamentals'];}
    $('pHome').onclick=()=>{hide();onHome();};$('pHub').onclick=()=>{view='hub';group='project';$('pMenu').open=false;render();save();};$('pDebug').onclick=()=>{view='hub';group='debug';$('pMenu').open=false;render();save();};$('pTesting').onclick=()=>openActivity('testing/testing-basics');$('pSkills').onclick=()=>{view='skills';$('pMenu').open=false;render();save();};$('pPortfolio').onclick=()=>{view='portfolio';$('pMenu').open=false;render();save();};
    $('pSubmit').onclick=()=>{const a=activity(),s=a.steps.find(s=>s.id===E.get(state,a).currentStepId),result=E.submit(state,a,s,Date.now(),M.signature(a,E.artifact(state,a)));if(result.reason==='wrong')E.get(state,a).dismissed=null;render();save();if(result.reason==='tests')$('pFeedback').textContent=t('Execute os testes desta configuração e confira todos os resultados antes de validar a etapa.','Run tests for this configuration and check all results before validating the stage.');};
    $('pHint').onclick=()=>{const a=activity();E.hint(state,a,a.steps.find(s=>s.id===E.get(state,a).currentStepId));render();save();};
    for(const [id,delta] of [['pPrev',-1],['pNext',1]])$(id).onclick=()=>{const a=activity();E.move(state,a,delta);render();save();focusHeading(E.get(state,a).conclusion?'pConclusionTitle':'pStep');};
    $('pRestart').onclick=()=>{if(!confirm(t('Reiniciar etapas desta atividade? O XP já conquistado e o histórico de dificuldade serão mantidos.','Restart this activity stages? Already earned XP and difficulty history will be kept.')))return;E.restart(state,activity());render();save();};
    $('pRunTests').onclick=()=>{const a=activity(),artifact=E.artifact(state,a);E.testRun(state,a,M.tests(a,artifact,datasets),M.signature(a,artifact));render();save();};
    save();
    return {open,hide,languageChanged(){if(!$('projectsArea').hidden)render();},missionPresented,
      missionAttempt(e,correct){E.observe(state,`mission/${e.id}`,e.concept,EvidenceSkills(e.track),correct);save();},
      reset(){state=E.empty();if(!root.TrainerStorage.remove(storage,[E.KEY]))onWarning(t('Não foi possível apagar os registros do Lab.','Could not delete Lab records.')); view='hub';selected=null;},
      missionHint(e){E.evidence(state,`mission/${e.id}`,e.concept,EvidenceSkills(e.track)).hints++;save();}};
  }
  root.PythonLabProjects={create};
})(globalThis);
