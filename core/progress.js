(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.TrainerProgress=api;})(globalThis,function(){
  const KEY='pythonAiTrainerV2';
  function empty(){return {version:2,current:0,completed:[],xp:0,unlocked:['Fundamentos'],attempts:{},awards:{},concepts:{}};}
  function migrate(value){
    const p=empty();if(!value||typeof value!=='object')return p;
    p.current=Number.isInteger(value.current)&&value.current>=0?value.current:0;
    p.completed=Array.isArray(value.completed)?[...new Set(value.completed.filter(x=>typeof x==='string'))]:[];
    p.xp=Number.isFinite(value.xp)&&value.xp>=0?value.xp:0;
    for(const key of ['attempts','awards','concepts'])if(value[key]&&typeof value[key]==='object'&&!Array.isArray(value[key]))p[key]=structuredClone(value[key]);
    if(Array.isArray(value.unlocked))p.unlocked=value.unlocked.filter(x=>typeof x==='string');
    return p;
  }
  function load(storage){for(const key of [KEY,'pythonAiTrainerV1']){try{const raw=storage.getItem(key);if(raw)return migrate(JSON.parse(raw));}catch{}}return empty();}
  function save(storage,p){storage.setItem(KEY,JSON.stringify(p));}
  function record(p,e,correct,hints=0,review=false,now=Date.now()){
    const key=e.concept||e.concepts[0];
    const c=p.concepts[key] ||= {attempts:0,correct:0,errors:0,hints:0,lastReview:null,recent:[]};
    c.attempts++;c[correct?'correct':'errors']++;c.hints+=hints;c.recent=[...(c.recent||[]),correct].slice(-5);
    if(review)c.lastReview=now;
  }
  function hint(p,e){const key=e.concept||e.concepts[0];const c=p.concepts[key] ||= {attempts:0,correct:0,errors:0,hints:0,lastReview:null,recent:[]};c.hints++;}
  function reviews(p,exercises,now=Date.now()){
    return exercises.filter(e=>p.attempts[e.id]&&e.requires.every(id=>p.completed.includes(id)))
      .map(e=>({e,c:p.concepts[e.concept||e.concepts[0]]}))
      .filter(({c})=>c&&(c.errors>0||c.hints>0)&&(!c.lastReview||now-c.lastReview>=60000))
      .sort((a,b)=>{const score=c=>c.errors/Math.max(c.attempts,1)+c.recent.filter(x=>!x).length/5+c.hints/Math.max(c.attempts,1)/4;return score(b.c)-score(a.c)||a.e.id.localeCompare(b.e.id);})
      .filter((item,i,all)=>all.findIndex(other=>(other.e.concept||other.e.concepts[0])===(item.e.concept||item.e.concepts[0]))===i)
      .slice(0,3).map(({e})=>e.id);
  }
  function clear(storage){for(const key of [KEY,'pythonAiTrainerV1','trainer-language','trainer-known'])storage.removeItem(key);}
  return {KEY,empty,migrate,load,save,record,hint,reviews,clear};
});
