(() => {
  const $ = id => document.getElementById(id);
  const game = window.TrainerGame;
  const state = { exercises: [], progress: game.createProgress(), index: 0, answer: '', attempts: 0, hintLevel: 0, language: 'mixed', known: [], term: null, simStep: -1, feedback: null };
  const storage = window.TrainerStorage.browser();
  const progressAPI=window.TrainerProgress, sessions=window.TrainerSession.create();
  let labs,projects,runtime,modelLab,experiments,returnProject=null,projectReviewMode=false,reviewQueue=null,activeId=null;
  function saveSession(){if(activeId&&!$('mission').hidden)sessions.save(activeId,{answer:state.answer,attempts:state.attempts,hintLevel:state.hintLevel,simStep:state.simStep,feedback:state.feedback,solved:state.solved||false,investigation:state.investigation??null,simOpen:!$('simulation').hidden});}
  function syncProgress(){if(!game.saveProgress(storage,state.progress)){ $('storageStatus').hidden=false;$('storageStatus').textContent=reviewText('Não foi possível salvar. Mantenha esta aba aberta; o progresso está só nesta sessão.','Could not save. Keep this tab open; progress is only in this session.');}}
  function reviewText(pt,en){return state.language==='en'?en:pt;}
  const languageData = window.TrainerLanguage;
  const ui = () => languageData.ui[state.language];
  const exercise = () => state.exercises[state.index];
  const content = () => ({ ...exercise(), ...exercise().translations[state.language] });
  function storageWarning(message){$('storageStatus').hidden=false;$('storageStatus').textContent=message;}
  function preference() { try{storage.setItem('trainer-language', state.language); storage.setItem('trainer-known', JSON.stringify(state.known));}catch{storageWarning(reviewText('Preferência mantida apenas nesta sessão.','Preference kept only in this session.'));} }
  function renderXP(){const label=reviewText('XP das missões','Mission XP');$('xp').textContent=`${state.progress.xp} XP`;$('xp').title=label;$('xp').setAttribute('aria-label',label+' '+state.progress.xp);}
  function updateText() {
    const t = ui();renderXP(); document.documentElement.lang = state.language === 'en' ? 'en' : 'pt-BR';
    $('reviewButton').textContent=reviewText('Revisar conceitos','Review concepts');$('debugButton').textContent=reviewText('Laboratório de debugging','Debugging lab');$('aiLabButton').textContent=reviewText('Laboratório de IA simulada','Simulated AI lab');
    if(labs)labs.render();
    $('projectsButton').textContent=reviewText('Python AI Lab — Projetos','Python AI Lab — Projects');$('returnToProject').textContent=reviewText('← Voltar ao projeto','← Return to project');
    if(projects)projects.languageChanged();if(runtime)runtime.languageChanged();if(modelLab)modelLab.languageChanged();if(experiments)experiments.languageChanged();
    $('experimentsButton').textContent=state.language==='en'?'AI experiments':state.language==='mixed'?'AI experiments (experimentos de IA)':'Experimentos de IA';
    $('runtimeButton').textContent=state.language==='en'?'Run Python':state.language==='mixed'?'Run Python (executar Python)':'Python executável';
    if(!$('debugList').hidden)renderDebugList();
    $('tagline').textContent=state.language==='en'?'Python for AI':'Python aplicado a IA';$('homeTitle').textContent=state.language==='en'?'Your training':'Seu treino';
    $('language').value = state.language; $('languageLabel').textContent = t.language;
    for (const [id,key] of Object.entries({continue:'continue',reset:'reset',homeButton:'home',submit:'submit',restartModule:'restart',simulate:'sim',prevLine:'prevLine',nextLine:'nextLine',resetSim:'resetSim',simLabel:'simLabel',variablesLabel:'variables',outputLabel:'output',closeGlossary:'close'})) $(id).textContent=t[key];
    $('homeProgress').textContent=`${state.progress.completed.length} ${t.of} ${state.exercises.length} ${t.progress}`;
    if (!$('mission').hidden) {
      const e = exercise(), c = content();
      $('module').textContent=state.language==='en' ? ({Fundamentos:'Basics','Scores e modelos':'Scores and models',Listas:'Lists','Decisões':'Decisions',Respostas:'Responses','Funções':'Functions','Integração':'Integration','APIs simuladas':'Simulated APIs','Debugging':'Debugging','Fluxos de IA':'AI workflows','Treinamento':'Training'})[e.module]||e.module : e.module;
      $('counter').textContent=`${t.mission} ${state.index+1} ${t.of} ${state.exercises.length}`;
      const term=languageData.glossary[e.terms[0]];
      $('title').textContent=state.language==='mixed' ? `${e.title} · ${term[0]}${state.known.includes(e.terms[0])?'':` (${term[1]})`}` : c.title;
      $('prompt').textContent=c.prompt; $('context').textContent=c.context||'';
      if(e.type!=='build') [...$('answer').children].forEach((b,i)=>b.textContent=c.options[i]);
      else $('answer').lastChild.textContent=t.undo;
      renderDebug();
      $('hint').textContent=state.hintLevel===2?t.used:`${t.hint} ${state.hintLevel+1}`;
      $('next').textContent=projectReviewMode?reviewText('Voltar ao projeto','Return to project'):state.index===state.exercises.length-1?t.finish:t.next;
      $('legend').replaceChildren();
      Object.entries(c.legend).forEach(([name,description])=>{const row=document.createElement('p');row.textContent=`${state.language==='en'?({'variável':'variable','lista':'list','índice':'index','parâmetro':'parameter','atribuição':'assignment',': e indentação':': and indentation'})[name]||name:name}: ${description}`;$('legend').append(row);});
      for(const key of e.terms){const b=document.createElement('button'),g=languageData.glossary[key];b.textContent=state.language==='en'?g[0]:`${g[0]}${state.language==='pt'||!state.known.includes(key)?` (${g[1]})`:''}`;b.onclick=()=>{state.term=key;$('glossary').hidden=false;renderTerm();};$('legend').append(b);}
      renderPreview();renderFeedback(); renderSimulation(); if(!$('glossary').hidden)renderTerm();
    }
  }
  function renderFeedback(){
    const f=state.feedback;if(!f){$('feedback').textContent='';return;}
    const t=ui(),c=content();
    $('feedback').textContent=f.kind==='hint'?c.hints[state.hintLevel-1]:f.kind==='correct'?`${t.right} ${f.gained?`+${f.gained} XP.`:t.again} ${c.explanation} ${c.aiApplication}`:t[f.kind];
  }
  function renderTerm(){
    if(!state.term)return;const g=languageData.glossary[state.term],en=state.language==='en';
    $('termDetails').replaceChildren();for(const value of [`${g[0]} — ${g[1]}`,g[en?3:2],g[4],`${ui().ai}: ${g[en?6:5]}`]){const p=document.createElement('p');p.textContent=value;$('termDetails').append(p);}
    $('knowTerm').textContent=state.known.includes(state.term)?ui().known:ui().know;
  }
  function renderPreview(){
    const e=exercise();if(e.replacement){$('assembled').hidden=state.answer==='';$('assembled').textContent=state.answer===''?'':e.code.replace(e.replacement.target,e.options[Number(state.answer)]);}
  }
  function renderDebug(){
    const e=exercise();$('debugPanel').hidden=!e.debug;if(!e.debug)return;
    $('debugNotice').textContent=reviewText('Ensaio de depuração: inspecione, corrija e valide.','Debugging scenario: inspect, repair and validate.');
    if(state.investigation===undefined)state.investigation=null;
    const err=e.debug.exception;$('debugError').textContent=err?`${err.type}: ${err.message}`:e.debug.symptom[state.language];
    $('investigate').replaceChildren();e.debug.investigate[state.language].forEach((label,i)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{state.investigation=i;saveSession();renderDebug();};$('investigate').append(b);});
    $('investigationFeedback').textContent=state.investigation===null?'':state.investigation===e.debug.correctInvestigation?reviewText('Boa investigação: examine a linha e os dados.','Good investigation: inspect the line and data.'):reviewText('Repetir não explica a causa. Inspecione os dados.','Retrying does not explain the cause. Inspect the data.');
  }
  function renderDebugList(){
    $('debugList').replaceChildren();for(const e of state.exercises.filter(e=>e.debug)){const b=document.createElement('button');b.textContent=e.translations[state.language].title;b.disabled=!e.requires.every(id=>state.progress.completed.includes(id));b.title=b.disabled?reviewText('Conclua os pré-requisitos no treino.','Complete the training prerequisites.') : '';b.onclick=()=>{saveSession();reviewQueue=null;state.index=state.exercises.indexOf(e);renderMission();};$('debugList').append(b);}
  }
  function renderSimulation(){
    const trace=exercise()?.simulation;if(!trace)return;
    window.TrainerSimulation.render(trace,state.simStep,state.language,ui().initial,{code:$('simCode'),variables:$('simVariables'),output:$('simOutput'),explanation:$('simExplanation'),prev:$('prevLine'),next:$('nextLine')});
  }
  function renderHome() {
    saveSession();$('aiLab').hidden=true;if(projects)projects.hide();if(runtime)runtime.hide();if(modelLab)modelLab.hide();if(experiments)experiments.hide();
    $('home').hidden = false; $('mission').hidden = true;
    renderXP();
    updateText();
  }
  function renderMission() {
    if(runtime)runtime.hide();if(modelLab)modelLab.hide();if(experiments)experiments.hide();const e = state.exercises[state.index];activeId=e.id;if(projects){projects.hide();projects.missionPresented(e);}
    Object.assign(state,sessions.get(e.id)); $('simulation').hidden=!state.simOpen; $('glossary').hidden=true; $('simulate').hidden=!e.simulation;
    $('aiLab').hidden=true;$('home').hidden = true; $('mission').hidden = false;
    renderXP();
    $('module').textContent = e.module;
    $('counter').textContent = `Missão ${state.index + 1} de ${state.exercises.length}`;
    $('bar').style.width = `${state.progress.completed.length / state.exercises.length * 100}%`;
    $('title').textContent = e.title; $('prompt').textContent = e.prompt;
    $('context').textContent = e.context || ''; $('code').textContent = e.code || '';
    $('assembled').hidden = e.type !== 'build'; $('assembled').textContent = '';
    $('answer').replaceChildren(); $('feedback').textContent = ''; $('next').hidden = !state.solved;
    $('hint').textContent = 'Dica 1'; $('legend').replaceChildren();
    Object.entries(e.legend).forEach(([name, description]) => {
      const row = document.createElement('p'); row.textContent = `${state.language==='en'?({'variável':'variable','lista':'list','índice':'index','parâmetro':'parameter','atribuição':'assignment',': e indentação':': and indentation'})[name]||name:name}: ${description}`; $('legend').append(row);
    });
    if (e.type === 'build') {
      e.blocks.forEach(block => { const button = document.createElement('button'); button.textContent = block; button.onclick = () => { state.answer += block; $('assembled').textContent = state.answer;saveSession(); }; $('answer').append(button); });
      const undo = document.createElement('button'); undo.textContent = 'Desfazer'; undo.onclick = () => { state.answer = ''; $('assembled').textContent = '';saveSession(); }; $('answer').append(undo);
    } else e.options.forEach((option, index) => { const button = document.createElement('button'); button.textContent = option; button.onclick = () => { state.answer = String(index); [...$('answer').children].forEach(b => b.classList.remove('selected')); button.classList.add('selected');renderPreview();saveSession(); }; $('answer').append(button); });
    $('assembled').textContent=e.type==='build'?state.answer:'';
    if(e.type!=='build'&&state.answer!=='')$('answer').children[Number(state.answer)].classList.add('selected');
    updateText();
  }
  function submit() {
    const e = state.exercises[state.index];
    if (state.answer === '') { state.feedback={kind:'empty'};renderFeedback(); return; }
    if(state.solved)return;
    state.attempts++;
    state.progress.attempts[e.id] = (state.progress.attempts[e.id] || 0) + 1;
    if (game.checkAnswer(e, state.answer)) {
      const gained = game.awardXP(state.progress, e.id, state.attempts, state.hintLevel > 0);
      if(!projectReviewMode)state.progress.current = Math.max(state.progress.current, state.index + 1);
      const next = state.exercises[state.index + 1];
      if (next && !state.progress.unlocked.includes(next.module)) state.progress.unlocked.push(next.module);
      if(projects)projects.missionAttempt(e,true);
      state.solved=true;progressAPI.record(state.progress,e,true,0,!!reviewQueue);
      state.feedback={kind:'correct',gained};renderFeedback();
      $('next').hidden = false;
    } else {if(projects)projects.missionAttempt(e,false);progressAPI.record(state.progress,e,false,0,!!reviewQueue);state.feedback={kind:'wrong'};renderFeedback();}
    syncProgress();saveSession();$('bar').style.width=`${state.progress.completed.length/state.exercises.length*100}%`; renderXP();
  }
  function showHint() {
    const e = state.exercises[state.index];
    if(state.solved)return;
    if (state.hintLevel < 2) {state.hintLevel++;if(projects)projects.missionHint(e);progressAPI.hint(state.progress,e);syncProgress();}
    state.feedback={kind:'hint'};saveSession();updateText();
  }
  function restartModule() {
    if (!window.confirm(ui().restartConfirm)) return;
    game.resetModule(state.progress, state.exercises, state.exercises[state.index].module);
    sessions.clear();activeId=null;game.saveProgress(storage, state.progress); state.index=state.progress.current; renderHome();
  }
  async function init() {
    const glossaryResponse=await fetch('glossary-v2.json');if(!glossaryResponse.ok)throw Error('Glossary unavailable');Object.assign(languageData.glossary,await glossaryResponse.json());
    state.exercises=await window.TrainerContent.load(languageData.glossary);state.progress=game.loadProgress(storage);syncProgress();
    try{const labResponse=await fetch('labs.json');if(!labResponse.ok)throw Error('Labs unavailable');labs=window.TrainerLabs.create(await labResponse.json(),()=>state.language,renderHome);}
    catch{$('aiLabButton').disabled=true;storageWarning(reviewText('O laboratório simulado não carregou. As missões continuam disponíveis.','The simulated lab could not load. Missions remain available.'));}
    let preferredLanguage=null;try{preferredLanguage=storage.getItem('trainer-language');}catch{}
    state.language=['pt','mixed','en'].includes(preferredLanguage)?preferredLanguage:'mixed';
    try{state.known=JSON.parse(storage.getItem('trainer-known'))||[];if(!Array.isArray(state.known))state.known=[];}catch{state.known=[];}
    $('language').onchange=()=>{state.language=$('language').value;preference();updateText();saveSession();};
    $('simulate').onclick=()=>{$('simulation').hidden=!$('simulation').hidden;renderSimulation();saveSession();};
    $('nextLine').onclick=()=>{state.simStep=Math.min(state.simStep+1,exercise().simulation.steps.length-1);renderSimulation();saveSession();};
    $('prevLine').onclick=()=>{state.simStep=Math.max(-1,state.simStep-1);renderSimulation();saveSession();};
    $('resetSim').onclick=()=>{state.simStep=-1;renderSimulation();saveSession();};
    $('closeGlossary').onclick=()=>{$('glossary').hidden=true;};
    $('knowTerm').onclick=()=>{state.known=state.known.includes(state.term)?state.known.filter(k=>k!==state.term):[...state.known,state.term];preference();updateText();};
    state.index = Math.min(state.progress.current, state.exercises.length - 1);
    $('continue').onclick = () => {returnProject=null;projectReviewMode=false;$('returnToProject').hidden=true;reviewQueue=null;renderMission();}; $('homeButton').onclick = renderHome;
    $('submit').onclick = submit; $('hint').onclick = showHint;
    $('next').onclick = () => { saveSession();if(projectReviewMode&&returnProject){$('mission').hidden=true;$('returnToProject').hidden=true;returnProject();return;}if(reviewQueue){reviewQueue.shift();if(!reviewQueue.length){reviewQueue=null;renderHome();return;}state.index=state.exercises.findIndex(e=>e.id===reviewQueue[0]);sessions.save(exercise().id,{...sessions.get(exercise().id),solved:false,feedback:null});renderMission();return;} if(state.index===state.exercises.length-1){renderHome();return;} state.index = game.getNextIndex(state.exercises, state.index); renderMission(); };
    $('restartModule').onclick = restartModule;
    $('reset').onclick=()=>{if(window.confirm(ui().resetConfirm+' '+reviewText('Inclui projetos, portfólio e evidências do Lab.','Includes projects, portfolio and Lab evidence.'))){if(!progressAPI.clear(storage))storageWarning(reviewText('Não foi possível remover todos os dados locais.','Could not remove all local data.'));if(projects)projects.reset();if(runtime)runtime.reset();if(modelLab)modelLab.reset();if(experiments)experiments.reset();returnProject=null;projectReviewMode=false;$('returnToProject').hidden=true;sessions.clear();activeId=null;state.progress=game.createProgress();state.index=0;state.language='mixed';state.known=[];reviewQueue=null;renderHome();}};
    $('reviewButton').onclick=()=>{saveSession();reviewQueue=progressAPI.reviews(state.progress,state.exercises);if(!reviewQueue.length){reviewQueue=null;$('reviewNotice').textContent=reviewText('Nenhuma revisão elegível agora. Continue o treino; revisões recentes têm intervalo de um minuto.','No eligible review now. Continue training; recent reviews have a one-minute interval.');return;}state.index=state.exercises.findIndex(e=>e.id===reviewQueue[0]);sessions.save(exercise().id,{...sessions.get(exercise().id),solved:false,feedback:null});renderMission();};
    $('debugButton').onclick=()=>{$('debugList').hidden=!$('debugList').hidden;renderDebugList();};
    $('aiLabButton').onclick=()=>{if(!labs)return;saveSession();if(runtime)runtime.hide();if(modelLab)modelLab.hide();if(experiments)experiments.hide();if(projects)projects.hide();$('home').hidden=true;$('mission').hidden=true;$('aiLab').hidden=false;labs.render();};

    try {
      const [catalog,debugging,testing,datasets,terms]=await Promise.all(['catalog','debugging','testing','datasets','terms'].map(async name=>{const r=await fetch(`projects/${name}.json`);if(!r.ok)throw Error('Project content unavailable');return r.json();}));
      Object.assign(languageData.glossary,terms);const activities=window.PythonLabEngine.validate([...catalog,...debugging,...testing],languageData.glossary);
      projects=window.PythonLabProjects.create({catalog:activities,datasets,glossary:languageData.glossary,language:()=>state.language,storage,missions:state.exercises,missionProgress:()=>state.progress,onHome:renderHome,onWarning:storageWarning,onPython:(projectId,back)=>{if(runtime){projects.hide();runtime.open(projectId,back);}},pythonReport:id=>runtime?.projectReport(id)||'',pythonAvailable:()=>!!runtime,onReview:(id,back)=>{
        const index=state.exercises.findIndex(e=>e.id===id);if(index<0)return;saveSession();const previousIndex=state.index;projectReviewMode=true;returnProject=()=>{state.index=previousIndex;projectReviewMode=false;returnProject=null;back();};reviewQueue=null;state.index=index;sessions.save(id,{answer:'',attempts:0,hintLevel:0,simStep:-1,feedback:null,solved:false,investigation:null,simOpen:false});$('returnToProject').hidden=false;renderMission();
      }});
      $('projectsButton').onclick=()=>{saveSession();if(runtime)runtime.hide();if(modelLab)modelLab.hide();if(experiments)experiments.hide();$('home').hidden=true;$('mission').hidden=true;$('aiLab').hidden=true;projects.open();};
      $('returnToProject').onclick=()=>{saveSession();$('mission').hidden=true;$('home').hidden=true;$('returnToProject').hidden=true;if(returnProject)returnProject();};
    }catch(error){$('projectsButton').disabled=true;storageWarning(reviewText('O Lab não pôde carregar. As missões continuam disponíveis.','The Lab could not load. Missions remain available.'));console.error(error);}

    try {
      const [lessons,terms]=await Promise.all(['lessons','terms'].map(async n=>{const r=await fetch(`runtime/${n}.json`);if(!r.ok)throw Error('Executable content unavailable');return r.json();}));
      Object.assign(languageData.glossary,terms);
      window.ExecutableContent.validate(lessons,state.exercises,await (await fetch('projects/catalog.json')).json(),languageData.glossary);
      runtime=window.ExecutableView.create({catalog:lessons,missions:state.exercises,glossary:languageData.glossary,language:()=>state.language,storage,missionProgress:()=>state.progress,onHome:renderHome,onWarning:storageWarning,onEvidence:(l,correct)=>projects?.runtimeAttempt(l,correct)});
      $('runtimeButton').onclick=()=>{saveSession();projects?.hide();modelLab?.hide();experiments?.hide();$('home').hidden=true;$('mission').hidden=true;$('aiLab').hidden=true;runtime.open();};
    }catch(error){$('runtimeButton').disabled=true;storageWarning(reviewText('Os desafios executáveis não puderam carregar. As atividades anteriores continuam disponíveis.','Executable challenges could not load. Previous activities remain available.'));console.error(error);}
    try {
      modelLab=window.ModelLabView.create({language:()=>state.language,storage,glossary:languageData.glossary,onHome:renderHome,onWarning:storageWarning,pythonAvailable:()=>!!runtime,experimentsAvailable:()=>!!experiments,onExperiments:()=>{if(experiments){modelLab.hide();experiments.open();}},onPython:(id,back)=>runtime?.open(id,back)});
      $('modelLabButton').hidden=false;$('modelLabButton').onclick=()=>{saveSession();projects?.hide();runtime?.hide();experiments?.hide();$('home').hidden=true;$('mission').hidden=true;$('aiLab').hidden=true;modelLab.open();};
    }catch(error){$('modelLabButton').disabled=true;console.error(error);}
    try {
      const [catalog,assets,terms]=await Promise.all(['catalog','assets','terms'].map(async name=>{const r=await fetch(`experiments/${name}.json`);if(!r.ok)throw Error('Experiments unavailable');return r.json();}));
      Object.assign(languageData.glossary,terms);
      experiments=window.ExperimentView.create({catalog,assets,glossary:languageData.glossary,language:()=>state.language,storage,onHome:renderHome,onWarning:storageWarning,pythonAvailable:()=>!!runtime,onPython:(id,back)=>runtime?.open(id,back)});
      $('experimentsButton').onclick=()=>{saveSession();projects?.hide();runtime?.hide();modelLab?.hide();$('home').hidden=true;$('mission').hidden=true;$('aiLab').hidden=true;experiments.open();};
    }catch(error){$('experimentsButton').disabled=true;storageWarning(reviewText('Os experimentos não puderam carregar. As atividades anteriores continuam disponíveis.','Experiments could not load. Previous activities remain available.'));console.error(error);}
    renderHome();
  }
  init().catch(error => { $('homeProgress').textContent = ui().loadError; console.error(error); });
})();
