(() => {
  const $ = id => document.getElementById(id);
  const game = window.TrainerGame;
  const state = { exercises: [], progress: game.createProgress(), index: 0, answer: '', attempts: 0, hintLevel: 0 };
  const storage = window.localStorage;
  function renderHome() {
    $('home').hidden = false; $('mission').hidden = true;
    $('xp').textContent = `${state.progress.xp} XP`;
    $('homeProgress').textContent = `${state.progress.completed.length} de ${state.exercises.length} missões concluídas`;
  }
  function renderMission() {
    const e = state.exercises[state.index];
    state.answer = ''; state.attempts = 0; state.hintLevel = 0;
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
      const row = document.createElement('p'); row.textContent = `${name}: ${description}`; $('legend').append(row);
    });
    if (e.type === 'build') {
      e.blocks.forEach(block => { const button = document.createElement('button'); button.textContent = block; button.onclick = () => { state.answer += block; $('assembled').textContent = state.answer; }; $('answer').append(button); });
      const undo = document.createElement('button'); undo.textContent = 'Desfazer'; undo.onclick = () => { state.answer = ''; $('assembled').textContent = ''; }; $('answer').append(undo);
    } else e.options.forEach((option, index) => { const button = document.createElement('button'); button.textContent = option; button.onclick = () => { state.answer = String(index); [...$('answer').children].forEach(b => b.classList.remove('selected')); button.classList.add('selected'); }; $('answer').append(button); });
  }
  function submit() {
    const e = state.exercises[state.index];
    if (state.answer === '') { $('feedback').textContent = 'Escolha uma resposta antes de continuar.'; return; }
    state.attempts++;
    state.progress.attempts[e.id] = (state.progress.attempts[e.id] || 0) + 1;
    if (game.checkAnswer(e, state.answer)) {
      const gained = game.awardXP(state.progress, e.id, state.attempts, state.hintLevel > 0);
      state.progress.current = Math.max(state.progress.current, state.index + 1);
      const next = state.exercises[state.index + 1];
      if (next && !state.progress.unlocked.includes(next.module)) state.progress.unlocked.push(next.module);
      $('feedback').textContent = `${gained ? `Correto! +${gained} XP. ` : 'Correto! Missão já concluída. '}${e.explanation} ${e.aiApplication}`;
      $('next').hidden = false;
    } else $('feedback').textContent = 'Ainda não. Revise o código e tente novamente.';
    game.saveProgress(storage, state.progress); $('xp').textContent = `${state.progress.xp} XP`;
  }
  function showHint() {
    const e = state.exercises[state.index];
    if (state.hintLevel < 2) state.hintLevel++;
    $('hint').textContent = state.hintLevel === 1 ? 'Dica 2' : 'Dicas usadas';
    $('feedback').textContent = e.hints[state.hintLevel - 1];
  }
  function restartModule() {
    if (!window.confirm(`Recomeçar o módulo ${state.exercises[state.index].module}? O XP e as conclusões dele serão removidos.`)) return;
    game.resetModule(state.progress, state.exercises, state.exercises[state.index].module);
    game.saveProgress(storage, state.progress); renderHome();
  }
  async function init() {
    const response = await fetch('exercises.json'); if (!response.ok) throw new Error('Falha ao carregar exercícios');
    state.exercises = await response.json(); state.progress = game.loadProgress(storage);
    state.index = Math.min(state.progress.current, state.exercises.length - 1);
    $('continue').onclick = () => renderMission(); $('homeButton').onclick = renderHome;
    $('submit').onclick = submit; $('hint').onclick = showHint;
    $('next').onclick = () => { state.index = game.getNextIndex(state.exercises, state.index); renderMission(); };
    $('restartModule').onclick = restartModule;
    $('reset').onclick = () => { if (window.confirm('Apagar todo o progresso e XP?')) { storage.removeItem('pythonAiTrainerV1'); state.progress = game.createProgress(); state.index = 0; renderHome(); } };
    renderHome();
  }
  init().catch(error => { $('homeProgress').textContent = 'Não foi possível carregar as missões. Inicie um servidor local.'; console.error(error); });
})();
