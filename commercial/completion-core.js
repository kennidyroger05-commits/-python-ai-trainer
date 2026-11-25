(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.TrainerCompletion=api;})(globalThis,function(){
 'use strict';
 function summarize(plan,lessons,projects,missionProgress,runtimeProgress,projectProgress){
  if(plan?.version!==4||plan.units?.length!==14||!Array.isArray(lessons)||lessons.length!==14||!Array.isArray(projects)||projects.length!==4)throw Error('Catálogo incompatível');
  const all=plan.units.flatMap(u=>u.missions);if(all.length!==145||new Set(all).size!==145)throw Error('Catálogo incompleto');
  const completed=new Set(Array.isArray(missionProgress?.completed)?missionProgress.completed:[]);
  const missionCount=all.filter(id=>completed.has(id)).length;
  const units=plan.units.filter(u=>u.missions.every(id=>completed.has(id))).length;
  const runtimeCount=lessons.filter(l=>{const p=runtimeProgress?.lessons?.[l.id];return Number.isSafeInteger(p?.completedAt)&&p.completedAt>0&&p.validatedTests===l.tests.length&&typeof p.codeHash==='string'&&/^[a-f0-9]{64}$/.test(p.codeHash)&&/^\d+\.\d+\.\d+$/.test(p.pythonVersion||'');}).length;
  const projectCount=projects.filter(a=>{const p=projectProgress?.activities?.['project/'+a.id];return Number.isSafeInteger(p?.completedAt)&&p.completedAt>0&&a.steps.every(s=>p.steps?.[s.id]?.passed===true);}).length;
  return {missionCount,units,runtimeCount,projectCount,ready:missionCount===145&&units===14&&runtimeCount===14&&projectCount===4,verified:false};
 }
 return {summarize};
});