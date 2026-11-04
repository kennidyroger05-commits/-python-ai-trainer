(function (root, factory) {
  const storage = typeof module === 'object' && module.exports && typeof require === 'function' ? require('../core/storage.js') : root.TrainerStorage;
  const api = factory(storage);
  if (typeof module === 'object' && module.exports && typeof require === 'function') module.exports = api;
  root.PythonLabEngine = api;
})(globalThis, function (storageAPI) {
  const KEY = 'pythonAiLabV3';
  const languages = ['pt', 'mixed', 'en'];
  const skills = ['fundamentals','data','functions','debugging','api','logic','ai','evaluation','training','english'];
  const clone = value => structuredClone(value);
  const count = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  function equal(a,b){const canonical=v=>Array.isArray(v)?v.map(canonical):object(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));}
  function text(value) { return object(value) && languages.every(lang => typeof value[lang] === 'string' && value[lang].trim()); }
  function key(activity) { return `${activity.kind}/${activity.id}`; }
  function unitKey(activity, step) { return `${key(activity)}/${step.id}`; }
  function validate(catalog, glossary) {
    const ids = new Set();
    if (!Array.isArray(catalog) || !catalog.length) throw Error('Missing activities');
    for (const a of catalog) {
      if (!['project','debug','testing'].includes(a.kind) || !a.id || ids.has(key(a)) || !text(a.title) || !text(a.goal) || !text(a.context) || !text(a.limitations) || !text(a.result)) throw Error(`Invalid activity ${a.id}`);
      ids.add(key(a));
      const steps = new Set();
      if (!Array.isArray(a.steps) || !a.steps.length || !object(a.initialArtifact)) throw Error(`Missing steps ${a.id}`);
      for (const s of a.steps) {
        if (!s.id || steps.has(s.id) || !text(s.title) || !text(s.prompt) || !text(s.explanation) || !s.concept || !s.skills?.length || s.skills.some(skill => !skills.includes(skill))) throw Error(`Invalid step ${a.id}/${s.id}`);
        if (!s.requires?.every(id => steps.has(id)) || s.hints?.length !== 2 || !s.hints.every(text) || !s.layers || !['definition','example','professional'].every(k => text(s.layers[k]))) throw Error(`Missing teaching support ${s.id}`);
        if (s.choices?.length !== 3 || new Set(s.choices.map(c => c.id)).size !== 3 || s.choices.some(c => !c.id || !text(c.label)) || !s.choices.some(c => c.id === s.correctId)) throw Error(`Invalid choices ${s.id}`);
        if (!object(s.effect) || Object.keys(s.effect).some(k => ['__proto__','prototype','constructor'].includes(k))) throw Error(`Invalid artifact effect ${s.id}`);
        if (!s.terms?.length || s.terms.some(t => !glossary[t])) throw Error(`Unknown term ${s.id}`);
        steps.add(s.id);
      }
      if (!a.traces?.length) throw Error(`Missing flow ${a.id}`);
      const traces = new Set();
      for (const trace of a.traces) {
        if (!trace.id || traces.has(trace.id) || !text(trace.title) || !trace.nodes?.length) throw Error(`Invalid flow ${a.id}`);
        traces.add(trace.id); const nodes = new Set();
        for (const node of trace.nodes) {
          if (!node.id || nodes.has(node.id) || !text(node.title) || !text(node.explanation) || !('input' in node) || !('output' in node)) throw Error(`Invalid flow node ${a.id}`);
          nodes.add(node.id);
        }
      }
    }
    return catalog;
  }
  function empty() { return { version: 3, activities: {}, awards: {}, evidence: {} }; }
  function valid(value) { return object(value) && value.version === 3 && object(value.activities) && object(value.awards) && object(value.evidence) && Object.values(value.awards).every(n=>[2,3,5].includes(n)) && Object.values(value.activities).every(a=>object(a)&&typeof a.currentStepId==='string'&&object(a.steps)&&Object.values(a.steps).every(s=>object(s)&&[null,'string'].includes(s.answerId===null?null:typeof s.answerId)&&Number.isSafeInteger(s.attempts)&&s.attempts>=0&&[0,1,2].includes(s.hints)&&typeof s.passed==='boolean')) && Object.values(value.evidence).every(e=>object(e)&&typeof e.concept==='string'&&Array.isArray(e.skills)&&Array.isArray(e.recent)); }
  function start(activity) {
    return { currentStepId: activity.steps[0].id, steps: {}, completedAt: null, conclusion: false, restarts: 0,
      dismissed: null, openedAt: null, testRun: null, testRuns: 0, flow: { traceId: activity.traces[0].id, nodeId: activity.traces[0].nodes[0].id }, layer: null, term: null };
  }
  function get(state, activity) { return state.activities[key(activity)] ||= start(activity); }
  function load(storage, catalog) {
    const source = storageAPI.read(storage, KEY), state = empty();
    if (!object(source.value)||source.value.version!==3||!object(source.value.activities)) return state;
    const raw = source.value;
    for (const [id, earned] of Object.entries(object(raw.awards)?raw.awards:{})) if ([2,3,5].includes(earned)) state.awards[id] = earned;
    for (const a of catalog) {
      const old = raw.activities[key(a)]; if (!object(old)) continue;
      const record = start(a);
      if (a.steps.some(s => s.id === old.currentStepId)) record.currentStepId = old.currentStepId;
      for (const s of a.steps) {
        const before = old.steps?.[s.id]; if (!object(before)) continue;
        const draft = s.choices.some(c => c.id === before.answerId) ? before.answerId : null;
        record.steps[s.id] = { answerId: draft, attempts: count(before.attempts), hints: Math.min(2,count(before.hints)), passed: before.passed === true && draft === s.correctId, lastGain: [0,2,3,5].includes(before.lastGain)?before.lastGain:0, feedback: ['right','wrong','hint','empty'].includes(before.feedback) ? before.feedback : null };
      }
      // A damaged or forged completion cannot skip prerequisites or create a portfolio entry.
      for (const s of a.steps) if (!s.requires.every(id => record.steps[id]?.passed)) { if (record.steps[s.id]) record.steps[s.id].passed = false; }
      for(const s of a.steps){const saved=record.steps[s.id];if(saved&&((!saved.passed&&saved.feedback==='right')||(saved.hints===0&&saved.feedback==='hint')))saved.feedback=null;}
      if (a.steps.every(s => record.steps[s.id]?.passed)) { record.completedAt = Number.isSafeInteger(old.completedAt)&&old.completedAt>0&&old.completedAt<8640000000000000 ? old.completedAt : null; record.conclusion = old.conclusion === true; }
      if(!a.steps.find(s=>s.id===record.currentStepId).requires.every(id=>record.steps[id]?.passed))record.currentStepId=a.steps.find(s=>!record.steps[s.id]?.passed).id;
      record.dismissed=a.steps.some(s=>s.id===old.dismissed)?old.dismissed:null;
      record.restarts = count(old.restarts);record.openedAt=Number.isFinite(old.openedAt)?old.openedAt:null;record.testRuns=count(old.testRuns);
      if(object(old.testRun)&&typeof old.testRun.signature==='string'&&Array.isArray(old.testRun.results)&&old.testRun.results.every(t=>object(t)&&typeof t.id==='string'&&'expected'in t&&'observed'in t)){record.testRun=clone(old.testRun);record.testRun.passed=record.testRun.results.length>0&&record.testRun.results.every(t=>t&&'expected'in t&&'observed'in t&&equal(t.expected,t.observed));}
      const trace = a.traces.find(t => t.id === old.flow?.traceId);
      if (trace) record.flow = { traceId: trace.id, nodeId: trace.nodes.some(n => n.id === old.flow.nodeId) ? old.flow.nodeId : trace.nodes[0].id };
      if (['definition','example','professional'].includes(old.layer)) record.layer = old.layer;
      record.term = typeof old.term === 'string' ? old.term : null;
      state.activities[key(a)] = record;
    }
    for (const [id, e] of Object.entries(object(raw.evidence)?raw.evidence:{})) {
      if (['__proto__','prototype','constructor'].includes(id) || !object(e) || typeof e.concept !== 'string' || !Array.isArray(e.skills)) continue;
      state.evidence[id] = { ...e, skills: e.skills.filter(s => skills.includes(s)), presented: e.presented === true, practiced: e.practiced === true, passed: e.passed === true,
        attempts: count(e.attempts), correct: count(e.correct), errors: count(e.errors), hints: count(e.hints), recent: Array.isArray(e.recent) ? e.recent.filter(v => typeof v === 'boolean').slice(-3) : [] };
    }
    return state;
  }
  function save(storage,state) { return storageAPI.write(storage,KEY,state,valid); }
  function evidence(state, id, concept, unitSkills) {
    return state.evidence[id] ||= { concept, skills: unitSkills, presented: false, practiced: false, passed: false, attempts: 0, correct: 0, errors: 0, hints: 0, recent: [] };
  }
  function present(state,id,concept,unitSkills) { evidence(state,id,concept,unitSkills).presented = true; }
  function observe(state,id,concept,unitSkills,correct) {
    const e=evidence(state,id,concept,unitSkills);e.presented=true;e.practiced=true;e.attempts++;e[correct?'correct':'errors']++;e.passed ||= correct;e.recent=[...e.recent,correct].slice(-3);
  }
  function needsReview(e) { return !!e && (e.recent.includes(false) || e.hints >= 2); }
  function weakConcept(state,concept) { return Object.values(state.evidence).some(e => e.concept === concept && needsReview(e)); }
  function stepState(state,activity,step) { return get(state,activity).steps[step.id] ||= { answerId:null,attempts:0,hints:0,passed:false,feedback:null,lastGain:0 }; }
  function choose(state,activity,step,choiceId) {
    const s=stepState(state,activity,step);
    if (s.passed || !step.choices.some(c=>c.id===choiceId)) return false;
    s.answerId=choiceId;s.feedback=null;return true;
  }
  function check(step,choiceId) { return typeof choiceId === 'string' && step.correctId === choiceId && step.choices.some(c=>c.id===choiceId); }
  function submit(state,activity,step,now=Date.now(),testSignature=null) {
    const record=get(state,activity),s=stepState(state,activity,step);
    if (!step.requires.every(id=>record.steps[id]?.passed)) return { reason:'prerequisite',gained:0,correct:false };
    if (s.passed) return { reason:'already',gained:0,correct:true };
    if(step.requiresTests&&(!record.testRun?.passed||record.testRun.signature!==testSignature))return {reason:'tests',gained:0,correct:false};
    if (!s.answerId) {s.feedback='empty';return {reason:'empty',gained:0,correct:false};}
    const correct=check(step,s.answerId);s.attempts++;s.feedback=correct?'right':'wrong';
    observe(state,unitKey(activity,step),step.concept,step.skills,correct);
    let gained=0;
    if (correct) {
      s.passed=true;const award=unitKey(activity,step);
      if (!(award in state.awards)) {gained=s.hints?2:s.attempts===1?5:3;state.awards[award]=gained;}
      s.lastGain=gained;
      if (activity.steps.every(st=>record.steps[st.id]?.passed)) record.completedAt ||= now;
    }
    return {reason:correct?'right':'wrong',gained,correct};
  }
  function hint(state,activity,step) {
    const s=stepState(state,activity,step);if(s.passed||s.hints>=2)return;
    s.hints++;s.feedback='hint';evidence(state,unitKey(activity,step),step.concept,step.skills).hints++;
  }
  function move(state,activity,direction) {
    const r=get(state,activity),index=activity.steps.findIndex(s=>s.id===r.currentStepId);
    if(direction>0&&!r.steps[r.currentStepId]?.passed)return false;
    if(direction>0&&index===activity.steps.length-1){r.conclusion=true;return true;}
    r.currentStepId=activity.steps[Math.max(0,Math.min(activity.steps.length-1,index+direction))].id;r.conclusion=false;r.layer=null;r.term=null;return true;
  }
  function testRun(state,activity,results,signature,now=Date.now()){const r=get(state,activity);r.testRuns++;r.testRun={results:clone(results),signature,at:now,passed:results.length>0&&results.every(t=>equal(t.expected,t.observed))};return r.testRun;}
  function restart(state,activity) { const old=get(state,activity);state.activities[key(activity)]={...start(activity),restarts:old.restarts+1}; }
  function artifact(state,activity) {
    const out=clone(activity.initialArtifact),r=get(state,activity);
    for (const s of activity.steps) if(r.steps[s.id]?.passed)Object.assign(out,clone(s.effect));
    return out;
  }
  function xp(state,activity) { return Object.entries(state.awards).filter(([id])=>!activity||id.startsWith(key(activity)+'/')).reduce((sum,[,value])=>sum+value,0); }
  function flow(state,activity,traceId,delta=0) {
    const r=get(state,activity);const trace=activity.traces.find(t=>t.id===traceId);if(!trace)return;
    const same=r.flow.traceId===traceId,at=same?trace.nodes.findIndex(n=>n.id===r.flow.nodeId):0;
    r.flow={traceId,nodeId:trace.nodes[Math.max(0,Math.min(trace.nodes.length-1,at+delta))].id};
  }
  function importMissions(state,progress,missions) {
    const tracks={A:['fundamentals'],B:['logic'],C:['data'],D:['functions'],E:['api'],F:['debugging'],G:['ai'],H:['training','evaluation']};
    for(const m of missions){const id=`mission/${m.id}`,attempts=count(progress.attempts[m.id]),passed=progress.completed.includes(m.id);
      if(state.evidence[id]||(!attempts&&!passed))continue;
      state.evidence[id]={concept:m.concept,skills:Array.isArray(m.skills)?m.skills.filter(k=>skills.includes(k)):(tracks[m.track]||[]),presented:true,practiced:true,passed,attempts,correct:0,errors:0,hints:0,recent:[],historical:true};
    }
  }
  function competencies(state) {
    return skills.map(skill=>{
      const units=Object.values(state.evidence).filter(e=>e.skills.includes(skill)),distinct=items=>new Set(items.map(e=>e.concept)).size;
      return {skill,presented:distinct(units.filter(e=>e.presented)),practiced:distinct(units.filter(e=>e.practiced)),correct:distinct(units.filter(e=>e.passed)),review:distinct(units.filter(needsReview))};
    });
  }
  return {KEY,skills,equal,key,unitKey,validate,empty,valid,start,get,load,save,present,observe,evidence,needsReview,weakConcept,stepState,choose,check,submit,hint,move,testRun,restart,artifact,xp,flow,importMissions,competencies};
});
