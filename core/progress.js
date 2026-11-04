(function(root,factory){const storageAPI=typeof module==='object'&&module.exports&&typeof require==='function'?require('./storage.js'):root.TrainerStorage;const api=factory(storageAPI);if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.TrainerProgress=api;})(globalThis,function(storageAPI){
  const KEY='pythonAiTrainerV2';
  function empty(){return {version:2,current:0,completed:[],xp:0,unlocked:['Fundamentos'],attempts:{},awards:{},concepts:{}};}
  function migrate(value){
    const p=empty();if(!value||typeof value!=='object')return p;
    p.current=Number.isInteger(value.current)&&value.current>=0?value.current:0;
    p.completed=Array.isArray(value.completed)?[...new Set(value.completed.filter(x=>typeof x==='string'))]:[];
    p.xp=Number.isFinite(value.xp)&&value.xp>=0?value.xp:0;
    for(const key of ['attempts','awards','concepts'])if(value[key]&&typeof value[key]==='object'&&!Array.isArray(value[key]))p[key]=structuredClone(value[key]);
    if(Array.isArray(value.unlocked))p.unlocked=value.unlocked.filter(x=>typeof x==='string');
    for(const field of ['attempts','awards'])for(const [id,value]of Object.entries(p[field]))if(!Number.isSafeInteger(value)||value<0)delete p[field][id];
    for(const [key,c] of Object.entries(p.concepts)){
      if(!c||typeof c!=='object'||Array.isArray(c)){delete p.concepts[key];continue;}
      p.concepts[key]={attempts:count(c.attempts),correct:count(c.correct),errors:count(c.errors),hints:count(c.hints),lastReview:Number.isFinite(c.lastReview)?c.lastReview:null,recent:Array.isArray(c.recent)?c.recent.filter(v=>typeof v==='boolean').slice(-5):[]};
    }
    if(value.missionHints&&typeof value.missionHints==='object'&&!Array.isArray(value.missionHints))p.missionHints=Object.fromEntries(Object.entries(value.missionHints).filter(([id,n])=>typeof id==='string'&&Number.isInteger(n)&&n>=0&&n<=2));
    if(value.curriculumVersion===4){p.curriculumVersion=4;p.legacyCompleted=Array.isArray(value.legacyCompleted)?value.legacyCompleted.filter(id=>typeof id==='string'):[];}
    return p;
  }
  const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
  function usable(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Number.isInteger(value.current)&&value.current>=0&&Array.isArray(value.completed)&&Number.isFinite(value.xp)&&value.xp>=0;}
  function valid(value){return usable(value)&&value.version===2&&Array.isArray(value.unlocked)&&['attempts','awards','concepts'].every(k=>value[k]&&typeof value[k]==='object'&&!Array.isArray(value[k]))&&['attempts','awards'].every(k=>Object.values(value[k]).every(n=>Number.isSafeInteger(n)&&n>=0))&&Object.values(value.concepts).every(c=>c&&typeof c==='object'&&['attempts','correct','errors','hints'].every(k=>Number.isSafeInteger(c[k])&&c[k]>=0)&&Array.isArray(c.recent)&&c.recent.every(v=>typeof v==='boolean')&&(c.lastReview===null||Number.isFinite(c.lastReview)));}
  function load(storage){for(const key of [KEY,'pythonAiTrainerV1']){try{const raw=storage.getItem(key);if(raw){const value=JSON.parse(raw);if(usable(value))return migrate(value);}}catch{}}return empty();}
  function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;}
  function save(storage,p){try{return storageAPI.write(storage,KEY,stable(p),valid);}catch{return false;}}
  function record(p,e,correct,hints=0,review=false,now=Date.now()){
    const key=e.concept||e.concepts[0];
    const c=p.concepts[key] ||= {attempts:0,correct:0,errors:0,hints:0,lastReview:null,recent:[]};
    c.attempts++;c[correct?'correct':'errors']++;c.hints+=hints;c.recent=[...(c.recent||[]),correct].slice(-5);
    if(review)c.lastReview=now;
  }
  function hint(p,e){const key=e.concept||e.concepts[0];const c=p.concepts[key] ||= {attempts:0,correct:0,errors:0,hints:0,lastReview:null,recent:[]};c.hints++;}
  function reviews(p,exercises,now=Date.now()){
    return exercises.filter(e=>p.attempts[e.id]&&(p.completed.includes(e.id)||(e.reviewRequires||e.requires).every(id=>p.completed.includes(id))))
      .map(e=>({e,c:p.concepts[e.concept||e.concepts[0]]}))
      .filter(({c})=>c&&(c.errors>0||c.hints>0)&&(!c.lastReview||now-c.lastReview>=60000))
      .sort((a,b)=>{const score=c=>c.errors/Math.max(c.attempts,1)+c.recent.filter(x=>!x).length/5+c.hints/Math.max(c.attempts,1)/4;return score(b.c)-score(a.c)||a.e.id.localeCompare(b.e.id);})
      .filter((item,i,all)=>all.findIndex(other=>(other.e.concept||other.e.concepts[0])===(item.e.concept||item.e.concepts[0]))===i)
      .slice(0,3).map(({e})=>e.id);
  }
  function clear(storage){return storageAPI.remove(storage,[KEY,'pythonAiTrainerV1','trainer-language','trainer-known']);}
  return {KEY,empty,migrate,load,save,record,hint,reviews,clear};
});
