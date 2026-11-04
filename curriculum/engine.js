(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.TrainerCurriculum=api;})(globalThis,function(){
 function validate(plan,exercises){
  if(plan?.version!==4||!Array.isArray(plan.units)||plan.units.length!==14)throw Error('Invalid curriculum');
  const ids=new Set(exercises.map(e=>e.id)),route=[],units=new Set();
  for(const [i,u]of plan.units.entries()){
   if(units.has(u.id)||u.number!==i+1||!u.missions?.length||u.requires.some(id=>!units.has(id)))throw Error('Invalid unit order');
   for(const lang of ['pt','mixed','en'])if(!u.title[lang]||!u.goal[lang])throw Error('Missing unit translation');
   for(const id of u.missions){if(!ids.has(id)||route.includes(id)||!Array.isArray(plan.requires[id])||plan.requires[id].some(p=>!route.includes(p)))throw Error('Invalid exercise prerequisite '+id);route.push(id);}
   units.add(u.id);
  }
  if(route.length!==ids.size||new Set(route).size!==route.length)throw Error('Incomplete curriculum');
  for(const list of Object.values(plan.projectUnits||{}))if(!list.length||list.some(id=>!units.has(id)))throw Error('Invalid project preparation');
  for(const unit of plan.units)for(const id of unit.executables||[])if(!plan.runtimeRequires?.[id]?.length||plan.runtimeRequires[id].some(p=>!ids.has(p)||route.indexOf(p)>route.indexOf(unit.missions.at(-1))))throw Error('Executable introduced too early '+id);
  return plan;
 }
 function unitFor(plan,id){return plan.units.find(u=>u.missions.includes(id));}
 function next(plan,p){const route=plan.units.flatMap(u=>u.missions);return route.find(id=>!p.completed.includes(id)&&plan.requires[id].every(k=>p.completed.includes(k)))||route.find(id=>!p.completed.includes(id))||route[0];}
 function status(unit,p){const done=unit.missions.filter(id=>p.completed.includes(id)).length;return {done,total:unit.missions.length,started:unit.missions.some(id=>p.completed.includes(id)||p.attempts[id]),complete:done===unit.missions.length};}
 function prepare(plan,exercises,p){validate(plan,exercises);if(p.curriculumVersion!==4){p.legacyCompleted=[...p.completed];p.curriculumVersion=4;}return exercises.map(e=>({...e,requires:plan.requires[e.id],...(p.legacyCompleted?.includes(e.id)?{reviewRequires:e.requires}:{}),unit:unitFor(plan,e.id).id}));}
 function resetUnit(plan,p,id){const unit=plan.units.find(u=>u.id===id);if(!unit)return;const keys=new Set(unit.missions);let removed=0;for(const key of keys){removed+=p.awards[key]||0;delete p.awards[key];delete p.attempts[key];if(p.missionHints)delete p.missionHints[key];}p.completed=p.completed.filter(k=>!keys.has(k));p.xp=Math.max(0,p.xp-removed);}
 return {validate,unitFor,next,status,prepare,resetUnit};
});
