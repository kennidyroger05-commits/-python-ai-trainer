(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TrainerGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const XP_FIRST = 10;
  const XP_RETRY = 5;
  const XP_HINT = 2;
  function checkAnswer(exercise, answer) {
    if (exercise.type === 'build') return exercise.answers.includes(answer.trim());
    return Number(answer) === exercise.correct;
  }
  function awardXP(progress, exerciseId, attempts, usedHint) {
    if (progress.completed.includes(exerciseId)) return 0;
    const earned = usedHint ? XP_HINT : attempts === 1 ? XP_FIRST : XP_RETRY;
    progress.completed.push(exerciseId);
    progress.awards ||= {};
    progress.awards[exerciseId] = earned;
    progress.xp += earned;
    return earned;
  }
  function createProgress() { return { current: 0, completed: [], xp: 0, unlocked: ['Fundamentos'], attempts: {}, awards: {} }; }
  function loadProgress(storage) {
    try {
      const saved = JSON.parse(storage.getItem('pythonAiTrainerV1'));
      if (!saved || !Array.isArray(saved.completed) || !Number.isFinite(saved.xp)) return createProgress();
      return { ...createProgress(), ...saved };
    } catch { return createProgress(); }
  }
  function saveProgress(storage, progress) { storage.setItem('pythonAiTrainerV1', JSON.stringify(progress)); }
  function resetModule(progress, exercises, module) {
    const ids = exercises.filter(e => e.module === module).map(e => e.id);
    const removedXP = ids.reduce((sum, id) => sum + (progress.awards?.[id] || 0), 0);
    progress.completed = progress.completed.filter(id => !ids.includes(id));
    for (const id of ids) if (progress.awards) delete progress.awards[id];
    progress.xp = Math.max(0, progress.xp - removedXP);
    progress.current = Math.min(progress.current, exercises.findIndex(e => e.module === module));
    return progress;
  }
  function getNextIndex(exercises, index) { return Math.min(index + 1, exercises.length - 1); }
  return { XP_FIRST, XP_RETRY, XP_HINT, checkAnswer, awardXP, createProgress, loadProgress, saveProgress, resetModule, getNextIndex };
});
