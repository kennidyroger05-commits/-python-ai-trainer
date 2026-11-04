(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.TrainerContent=api;})(globalThis,function(){
  const TYPES=['build','read','predict','error','fix','complete'];
  function validate(exercises,glossary){
    if(!Array.isArray(exercises)||!exercises.length)throw Error('Missing exercises');
    const ids=new Set(),titles=new Set(),introduced=new Set();
    for(const e of exercises){
      if(!e.id||ids.has(e.id)||!e.title||titles.has(e.title))throw Error('Duplicate or absent identity');
      if(!TYPES.includes(e.type)||!e.track||!e.concept||!Number.isInteger(e.difficulty)||e.difficulty<1)throw Error(`Invalid metadata ${e.id}`);
      if(!Array.isArray(e.requires)||e.requires.some(id=>!ids.has(id)))throw Error(`Invalid prerequisites ${e.id}`);
      if(!Array.isArray(e.introduces)||e.introduces.length>1)throw Error(`Concept jump ${e.id}`);
      for(const c of e.introduces){if(introduced.has(c))throw Error(`Concept introduced twice: ${c}`);introduced.add(c);}
      if(e.type==='build'){if(!e.blocks?.length||!e.answers?.length||!e.answers.every(a=>typeof a==='string'&&a.trim()))throw Error(`Missing block solution ${e.id}`);}
      else if(e.options?.length!==3||new Set(e.options).size!==3||!Number.isInteger(e.correct)||e.correct<0||e.correct>=3)throw Error(`Invalid choices ${e.id}`);
      if(['fix','complete'].includes(e.type)&&(!e.solutionCode||!e.replacement||!e.code.includes(e.replacement.target)))throw Error(`Invalid patch ${e.id}`);
      if(!e.terms?.length||e.terms.some(k=>!glossary[k]))throw Error(`Missing glossary ${e.id}`);
      for(const lang of ['pt','mixed','en']){
        const c=e.translations?.[lang];
        if(!c||['title','prompt','explanation','aiApplication'].some(k=>!c[k]?.trim())||c.hints?.length!==2||c.hints.some(h=>!h?.trim())||!Object.keys(c.legend||e.legend||{}).length)throw Error(`Missing translation ${e.id}/${lang}`);
        if(e.options&&(c.options?.length!==3||new Set(c.options).size!==3))throw Error(`Missing translated choices ${e.id}/${lang}`);
      }
      if(e.debug){const d=e.debug;if(!['SyntaxError','TypeError','KeyError','IndexError','NameError','LogicError'].includes(d.kind)||![0,1].includes(d.correctInvestigation)||['pt','mixed','en'].some(l=>d.investigate?.[l]?.length!==2)||d.kind!=='LogicError'&&(!d.exception?.message||d.exception.type!==d.kind))throw Error(`Invalid debug scenario ${e.id}`);}
      if(e.simulation){const s=e.simulation;if(!s.steps.length||s.steps.some(st=>!Number.isInteger(st.line)||st.line<0||st.line>=s.code.split('\n').length||!st.variables||!Array.isArray(st.output)||['pt','mixed','en'].some(l=>!st.explanation?.[l])))throw Error(`Invalid trace ${e.id}`);}
      ids.add(e.id);titles.add(e.title);
    }
    return exercises;
  }
  async function json(path,{timeoutMs=15000,fetcher=globalThis.fetch}={}){
    if(typeof path!=='string'||!/^[a-z0-9][a-z0-9/-]*\.json$/i.test(path))throw Error('Only relative content JSON paths are supported');
    const controller=new AbortController(),budget=Number.isFinite(timeoutMs)?Math.max(10,Math.min(30000,timeoutMs)):15000;
    const timer=setTimeout(()=>controller.abort(),budget);
    try{const r=await fetcher(path,{signal:controller.signal});if(!r.ok)throw Error('Content unavailable: '+path);return await r.json();}
    finally{clearTimeout(timer);}
  }
  async function load(glossary){return validate(await json('exercises.json'),glossary);}
  return {TYPES,validate,json,load};
});
