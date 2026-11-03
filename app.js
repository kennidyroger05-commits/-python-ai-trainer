(() => {
  const $ = id => document.getElementById(id);
  const game = window.TrainerGame;
  const state = { exercises: [], progress: game.createProgress(), index: 0, answer: '', attempts: 0, hintLevel: 0, language: 'mixed', known: [], term: null, simStep: -1, feedback: null };
  const storage = window.localStorage;
  const languageData = window.TrainerLanguage;
  const ui = () => languageData.ui[state.language];
  const exercise = () => state.exercises[state.index];
  const content = () => ({ ...exercise(), ...exercise().translations[state.language] });
  function preference() { storage.setItem('trainer-language', state.language); storage.setItem('trainer-known', JSON.stringify(state.known)); }
  function updateText() {
    const t = ui(); document.documentElement.lang = state.language === 'en' ? 'en' : 'pt-BR';
    $('tagline').textContent=state.language==='en'?'Python for AI':'Python aplicado a IA';$('homeTitle').textContent=state.language==='en'?'Your training':'Seu treino';
    $('language').value = state.language; $('languageLabel').textContent = t.language;
    for (const [id,key] of Object.entries({continue:'continue',reset:'reset',homeButton:'home',submit:'submit',restartModule:'restart',simulate:'sim',prevLine:'prevLine',nextLine:'nextLine',resetSim:'resetSim',simLabel:'simLabel',variablesLabel:'variables',outputLabel:'output',closeGlossary:'close'})) $(id).textContent=t[key];
    $('homeProgress').textContent=`${state.progress.completed.length} ${t.of} ${state.exercises.length} ${t.progress}`;
    if (!$('mission').hidden) {
      const e = exercise(), c = content();
      $('module').textContent=state.language==='en' ? ({Fundamentos:'Basics','Scores e modelos':'Scores and models',Listas:'Lists','Decisões':'Decisions',Respostas:'Responses','Funções':'Functions','Integração':'Integration'})[e.module] : e.module;
      $('counter').textContent=`${t.mission} ${state.index+1} ${t.of} ${state.exercises.length}`;
      const term=languageData.glossary[e.terms[0]];
      $('title').textContent=state.language==='mixed' ? `${e.title} · ${term[0]}${state.known.includes(e.terms[0])?'':` (${term[1]})`}` : c.title;
      $('prompt').textContent=c.prompt; $('context').textContent=c.context||'';
      if(e.type!=='build') [...$('answer').children].forEach((b,i)=>b.textContent=c.options[i]);
      else $('answer').lastChild.textContent=t.undo;
      $('hint').textContent=state.hintLevel===2?t.used:`${t.hint} ${state.hintLevel+1}`;
      $('next').textContent=state.index===state.exercises.length-1?t.finish:t.next;
      $('legend').replaceChildren();
      Object.entries(c.legend).forEach(([name,description])=>{const row=document.createElement('p');row.textContent=`${state.language==='en'?({'variável':'variable','lista':'list','índice':'index','parâmetro':'parameter','atribuição':'assignment',': e indentação':': and indentation'})[name]||name:name}: ${description}`;$('legend').append(row);});
      for(const key of e.terms){const b=document.createElement('button'),g=languageData.glossary[key];b.textContent=state.language==='en'?g[0]:`${g[0]}${state.language==='pt'||!state.known.includes(key)?` (${g[1]})`:''}`;b.onclick=()=>{state.term=key;$('glossary').hidden=false;renderTerm();};$('legend').append(b);}
      renderFeedback(); renderSimulation(); if(!$('glossary').hidden)renderTerm();
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
  function renderSimulation(){
    const sim=exercise()?.simulation;if(!sim)return;
    $('simCode').replaceChildren();const step=sim.steps[state.simStep];
    sim.code.split('\n').forEach((line,i)=>{const span=document.createElement('span');span.textContent=line+'\n';if(step?.line===i){span.className='current-line';span.setAttribute('aria-current','step');}$('simCode').append(span);});
    $('simVariables').textContent=JSON.stringify(step?.variables||{},null,2);$('simOutput').textContent=(step?.output||[]).join('\n');
    $('simExplanation').textContent=step?step.explanation[state.language]:ui().initial;
    $('prevLine').disabled=state.simStep<0;$('nextLine').disabled=state.simStep>=sim.steps.length-1;
  }
  function renderHome() {
    $('home').hidden = false; $('mission').hidden = true;
    $('xp').textContent = `${state.progress.xp} XP`;
    updateText();
  }
  function renderMission() {
    const e = state.exercises[state.index];
    state.answer = ''; state.attempts = 0; state.hintLevel = 0; state.feedback=null; state.simStep=-1; $('simulation').hidden=true; $('glossary').hidden=true; $('simulate').hidden=!e.simulation;
    $('home').hidden = true; $('mission').hidden = false;
    $('xp').textContent = `${state.progress.xp} XP`;
    $('module').textContent = e.module;
    $('counter').textContent = `Missão ${state.index + 1} de ${state.exercises.length}`;
    $('bar').style.width = `${state.progress.completed.length / state.exercises.length * 100}%`;
    $('title').textContent = e.title; $('prompt').textContent = e.prompt;
    $('context').textContent = e.context || ''; $('code').textContent = e.code || '';
    $('assembled').hidden = e.type !== 'build'; $('assembled').textContent = '';
    $('answer').replaceChildren(); $('feedback').textContent = ''; $('next').hidden = true;
    $('hint').textContent = 'Dica 1'; $('legend').replaceChildren();
    Object.entries(e.legend).forEach(([name, description]) => {
      const row = document.createElement('p'); row.textContent = `${state.language==='en'?({'variável':'variable','lista':'list','índice':'index','parâmetro':'parameter','atribuição':'assignment',': e indentação':': and indentation'})[name]||name:name}: ${description}`; $('legend').append(row);
    });
    if (e.type === 'build') {
      e.blocks.forEach(block => { const button = document.createElement('button'); button.textContent = block; button.onclick = () => { state.answer += block; $('assembled').textContent = state.answer; }; $('answer').append(button); });
      const undo = document.createElement('button'); undo.textContent = 'Desfazer'; undo.onclick = () => { state.answer = ''; $('assembled').textContent = ''; }; $('answer').append(undo);
    } else e.options.forEach((option, index) => { const button = document.createElement('button'); button.textContent = option; button.onclick = () => { state.answer = String(index); [...$('answer').children].forEach(b => b.classList.remove('selected')); button.classList.add('selected'); }; $('answer').append(button); });
    updateText();
  }
  function submit() {
    const e = state.exercises[state.index];
    if (state.answer === '') { state.feedback={kind:'empty'};renderFeedback(); return; }
    state.attempts++;
    state.progress.attempts[e.id] = (state.progress.attempts[e.id] || 0) + 1;
    if (game.checkAnswer(e, state.answer)) {
      const gained = game.awardXP(state.progress, e.id, state.attempts, state.hintLevel > 0);
      state.progress.current = Math.max(state.progress.current, state.index + 1);
      const next = state.exercises[state.index + 1];
      if (next && !state.progress.unlocked.includes(next.module)) state.progress.unlocked.push(next.module);
      state.feedback={kind:'correct',gained};renderFeedback();
      $('next').hidden = false;
    } else {state.feedback={kind:'wrong'};renderFeedback();}
    game.saveProgress(storage, state.progress); $('xp').textContent = `${state.progress.xp} XP`;
  }
  function showHint() {
    const e = state.exercises[state.index];
    if (state.hintLevel < 2) state.hintLevel++;
    state.feedback={kind:'hint'};updateText();
  }
  function restartModule() {
    if (!window.confirm(ui().restartConfirm)) return;
    game.resetModule(state.progress, state.exercises, state.exercises[state.index].module);
    game.saveProgress(storage, state.progress); state.index=state.progress.current; renderHome();
  }
  async function init() {
    const response = await fetch('exercises.json'); if (!response.ok) throw new Error('Falha ao carregar exercícios');
    state.exercises = await response.json(); state.progress = game.loadProgress(storage);
    state.language=['pt','mixed','en'].includes(storage.getItem('trainer-language'))?storage.getItem('trainer-language'):'mixed';
    try{state.known=JSON.parse(storage.getItem('trainer-known'))||[];if(!Array.isArray(state.known))state.known=[];}catch{state.known=[];}
    $('language').onchange=()=>{state.language=$('language').value;preference();updateText();};
    $('simulate').onclick=()=>{$('simulation').hidden=!$('simulation').hidden;renderSimulation();};
    $('nextLine').onclick=()=>{state.simStep=Math.min(state.simStep+1,exercise().simulation.steps.length-1);renderSimulation();};
    $('prevLine').onclick=()=>{state.simStep=Math.max(-1,state.simStep-1);renderSimulation();};
    $('resetSim').onclick=()=>{state.simStep=-1;renderSimulation();};
    $('closeGlossary').onclick=()=>{$('glossary').hidden=true;};
    $('knowTerm').onclick=()=>{state.known=state.known.includes(state.term)?state.known.filter(k=>k!==state.term):[...state.known,state.term];preference();updateText();};
    state.index = Math.min(state.progress.current, state.exercises.length - 1);
    $('continue').onclick = () => renderMission(); $('homeButton').onclick = renderHome;
    $('submit').onclick = submit; $('hint').onclick = showHint;
    $('next').onclick = () => { if(state.index===state.exercises.length-1){renderHome();return;} state.index = game.getNextIndex(state.exercises, state.index); renderMission(); };
    $('restartModule').onclick = restartModule;
    $('reset').onclick = () => { if (window.confirm(ui().resetConfirm)) { storage.removeItem('pythonAiTrainerV1'); storage.removeItem('trainer-language');storage.removeItem('trainer-known');state.language='mixed';state.known=[]; state.progress = game.createProgress(); state.index = 0; renderHome(); } };
    renderHome();
  }
  init().catch(error => { $('homeProgress').textContent = ui().loadError; console.error(error); });
})();
