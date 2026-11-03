const assert = require('node:assert/strict');
const fs = require('node:fs');
const exercises = JSON.parse(fs.readFileSync('exercises.json', 'utf8'));
const game = require('../game.js');
assert.equal(exercises.length, 5);
assert.equal(new Set(exercises.map(e => e.id)).size, 5, 'IDs duplicados');
assert.equal(new Set(exercises.map(e => e.title)).size, 5, 'Títulos duplicados');
const modules = new Set(['Fundamentos', 'Scores e modelos', 'Listas']);
const concepts = new Set();
for (const e of exercises) {
  assert.ok(modules.has(e.module), `Módulo inválido: ${e.module}`);
  assert.ok(e.id && e.title && e.prompt && e.explanation && e.aiApplication);
  assert.ok(Array.isArray(e.hints) && e.hints.length === 2 && e.hints.every(Boolean));
  assert.ok(Array.isArray(e.concepts) && e.concepts.length);
  assert.ok(e.legend && Object.keys(e.legend).length);
  for (const concept of e.concepts) assert.ok(typeof e.legend[concept] === 'string' || Object.keys(e.legend).some(k => k.toLowerCase().includes(concept.toLowerCase())), `Sem legenda contextual: ${concept}`);
  if (e.type === 'build') {
    assert.ok(e.blocks.length && e.answers.length);
    assert.equal(typeof e.correct, 'undefined');
    assert.ok(game.checkAnswer(e, e.answers[0]));
    assert.ok(!game.checkAnswer(e, 'resposta errada'));
    for (const wrong of e.id === 'score-variable' ? ['score = 0.9', 'score == 0.82'] : ['print(other)', 'print(score, score)']) assert.ok(!game.checkAnswer(e, wrong));
    assert.ok(!game.checkAnswer(e, ''));
  } else {
    assert.ok(['read', 'predict', 'error'].includes(e.type));
    assert.equal(e.options.length, 3);
    assert.ok(Number.isInteger(e.correct) && e.correct >= 0 && e.correct < e.options.length);
    assert.ok(game.checkAnswer(e, String(e.correct)));
    for (let i = 0; i < e.options.length; i++) if (i !== e.correct) assert.ok(!game.checkAnswer(e, String(i)), `${e.id} aceitou resposta errada ${i}`);
  }
  for (const c of e.concepts) concepts.add(c);
}
assert.deepEqual(exercises.map(e => e.type), ['build','build','predict','read','error']);
assert.ok(exercises[1].concepts.every(c => exercises[0].concepts.includes(c)) === false, 'Conceitos devem crescer progressivamente');
assert.ok(exercises[2].concepts.includes('max()'));
assert.deepEqual(new Set(exercises.map(e=>e.type)), new Set(['build','predict','read','error']));
assert.ok(exercises[3].concepts.includes('índice'));
assert.ok(exercises[4].concepts.every(c => concepts.has(c)));
let p = game.createProgress();
assert.equal(game.awardXP(p, exercises[0].id, 1, false), 10);
assert.equal(game.awardXP(p, exercises[0].id, 3, false), 0);
assert.equal(game.awardXP(p, exercises[1].id, 2, false), 5);
assert.equal(game.awardXP(p, exercises[2].id, 1, true), 2);
assert.equal(p.xp, 17);
const data = new Map(); const storage = {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
game.saveProgress(storage,p); assert.deepEqual(game.loadProgress(storage),p);
assert.equal(game.loadProgress({getItem:()=>'{'}).xp,0);
assert.equal(game.getNextIndex(exercises,0),1); assert.equal(game.getNextIndex(exercises,4),4);
p.current=4; const reset=game.resetModule(p,exercises,'Listas'); assert.equal(reset.completed.includes('read-index'),false); assert.equal(reset.xp,17);
console.log('PASS: JSON integrity; 5 unique missions; modules/references/concepts; all answer keys accept correct and reject every incorrect choice; hints; XP first/retry/hint/no duplicate; storage round trip/corruption; navigation; module reset.');
