const state = {
  exercises: [],
  index: 0,
  codeParts: [],
  xp: 0,
  completed: []
};

const els = {
  xp: document.getElementById('xp'),
  missionCounter: document.getElementById('missionCounter'),
  progressText: document.getElementById('progressText'),
  progressBar: document.getElementById('progressBar'),
  topic: document.getElementById('topic'),
  title: document.getElementById('title'),
  description: document.getElementById('description'),
  starterCode: document.getElementById('starterCode'),
  tokenBank: document.getElementById('tokenBank'),
  codeDisplay: document.getElementById('codeDisplay'),
  feedback: document.getElementById('feedback'),
  legend: document.getElementById('legend'),
  why: document.getElementById('why'),
  nextBtn: document.getElementById('nextBtn'),
  runBtn: document.getElementById('runBtn'),
  undoBtn: document.getElementById('undoBtn'),
  clearBtn: document.getElementById('clearBtn'),
  hintBtn: document.getElementById('hintBtn')
};

function saveProgress() {
  localStorage.setItem('pythonAiTrainerProgress', JSON.stringify({
    index: state.index,
    xp: state.xp,
    completed: state.completed
  }));
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem('pythonAiTrainerProgress'));
    if (!saved) return;
    state.index = Number.isInteger(saved.index) ? saved.index : 0;
    state.xp = Number.isFinite(saved.xp) ? saved.xp : 0;
    state.completed = Array.isArray(saved.completed) ? saved.completed : [];
  } catch (_) {
    localStorage.removeItem('pythonAiTrainerProgress');
  }
}

function normalize(code) {
  return code.replace(/\r/g, '').trim();
}

function renderCode() {
  const text = state.codeParts.join('');
  els.codeDisplay.textContent = text || '';
  if (!text) {
    const span = document.createElement('span');
    span.className = 'code-placeholder';
    span.textContent = 'Monte o código tocando nas peças acima.';
    els.codeDisplay.appendChild(span);
  }
}

function renderTokens(exercise) {
  els.tokenBank.innerHTML = '';
  exercise.tokens.forEach(token => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = token === '\n' ? '↵ nova linha' : token === '\n    ' ? '↵ + indentação' : token;
    button.addEventListener('click', () => {
      state.codeParts.push(token);
      renderCode();
    });
    els.tokenBank.appendChild(button);
  });
}

function renderLegend(exercise) {
  els.legend.innerHTML = '';
  Object.entries(exercise.legend).forEach(([key, value]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<code>${escapeHtml(key)}</code><p>${escapeHtml(value)}</p>`;
    els.legend.appendChild(item);
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderExercise() {
  if (!state.exercises.length) return;
  if (state.index >= state.exercises.length) state.index = state.exercises.length - 1;

  const exercise = state.exercises[state.index];
  state.codeParts = [];

  els.topic.textContent = `Missão ${exercise.id} · ${exercise.topic}`;
  els.title.textContent = exercise.title;
  els.description.textContent = exercise.description;
  els.starterCode.textContent = exercise.starter;
  els.why.textContent = exercise.why;
  els.xp.textContent = state.xp;
  els.missionCounter.textContent = `Missão ${state.index + 1} de ${state.exercises.length}`;

  const percent = Math.round((state.completed.length / state.exercises.length) * 100);
  els.progressText.textContent = `${percent}%`;
  els.progressBar.style.width = `${percent}%`;

  els.feedback.className = 'feedback';
  els.feedback.textContent = state.completed.includes(exercise.id)
    ? 'Você já concluiu esta missão. Pode refazer para treinar.'
    : 'Monte a solução usando os blocos acima.';
  els.nextBtn.classList.add('hidden');

  renderTokens(exercise);
  renderLegend(exercise);
  renderCode();
}

function checkAnswer() {
  const exercise = state.exercises[state.index];
  const userCode = normalize(state.codeParts.join(''));
  const solution = normalize(exercise.solution);

  if (!userCode) {
    els.feedback.className = 'feedback error';
    els.feedback.textContent = 'Você ainda não montou nenhum código.';
    return;
  }

  if (userCode === solution) {
    const firstCompletion = !state.completed.includes(exercise.id);
    if (firstCompletion) {
      state.completed.push(exercise.id);
      state.xp += exercise.xp;
    }

    els.feedback.className = 'feedback success';
    els.feedback.textContent = firstCompletion
      ? `✅ Missão concluída! +${exercise.xp} XP`
      : '✅ Certo novamente! Ótimo treino.';
    els.xp.textContent = state.xp;
    saveProgress();

    if (state.index < state.exercises.length - 1) {
      els.nextBtn.classList.remove('hidden');
    } else {
      els.feedback.textContent += ' Você concluiu as 10 missões do MVP.';
    }

    const percent = Math.round((state.completed.length / state.exercises.length) * 100);
    els.progressText.textContent = `${percent}%`;
    els.progressBar.style.width = `${percent}%`;
  } else {
    els.feedback.className = 'feedback error';
    els.feedback.textContent = 'Ainda não. Compare a ordem das peças, parênteses, colchetes e quebras de linha. Use Dica se precisar.';
  }
}

els.runBtn.addEventListener('click', checkAnswer);
els.undoBtn.addEventListener('click', () => {
  state.codeParts.pop();
  renderCode();
});
els.clearBtn.addEventListener('click', () => {
  state.codeParts = [];
  renderCode();
  els.feedback.className = 'feedback';
  els.feedback.textContent = 'Código limpo. Tente novamente.';
});
els.hintBtn.addEventListener('click', () => {
  const exercise = state.exercises[state.index];
  els.feedback.className = 'feedback';
  els.feedback.textContent = `💡 ${exercise.hint}`;
});
els.nextBtn.addEventListener('click', () => {
  if (state.index < state.exercises.length - 1) {
    state.index += 1;
    saveProgress();
    renderExercise();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

async function init() {
  try {
    const response = await fetch('exercises.json');
    if (!response.ok) throw new Error('Falha ao carregar exercícios');
    state.exercises = await response.json();
    loadProgress();
    renderExercise();
  } catch (error) {
    els.feedback.className = 'feedback error';
    els.feedback.textContent = 'Não foi possível carregar as missões. Abra pelo GitHub Pages ou por um servidor local.';
    console.error(error);
  }
}

init();
