(function(root){
 function validate(catalog,missions,projects,glossary,{allowMissingProjects=false}={}){
  const ids=new Set(),titles=new Set(),known=new Set(missions.map(m=>m.id));
  if(!Array.isArray(catalog)||catalog.length<12)throw Error('At least twelve executable challenges are required');
  for(const l of catalog){
   const check=(v,label)=>{if(!v)throw Error(`${l.id||'lesson'}: ${label}`);};
   check(typeof l.id==='string'&&!ids.has(l.id),'unique id');ids.add(l.id);
   check(l.template.split('___').length===2,'one selectable slot');
   check(l.patches.length===3&&new Set(l.patches.map(p=>p.id)).size===3&&new Set(l.patches.map(p=>p.code)).size===3,'distinct patches');
   check(l.starter===l.template.replace('___',l.patches.find(p=>p.id===l.initialPatchId)?.code),'starter');
   check(l.blocks.length&&l.blocks.every(b=>typeof b==='string'),'blocks');
   check(l.tests.length>=3&&l.tests.length<=8&&new Set(l.tests.map(t=>t.id)).size===l.tests.length,'test IDs');
   check(l.tests.filter(t=>t.role==='demo').length===1&&l.tests.filter(t=>t.role==='validation').length>=2,'demo and validation separation');
   for(const test of l.tests){check(['call','variable','stdout'].includes(test.kind)&&Object.hasOwn(test,'expected'),'test contract');check(test.kind!=='call'||(typeof test.function==='string'&&Array.isArray(test.args)),'function test');check(test.kind!=='variable'||typeof test.name==='string','variable test');}
   for(const lang of ['pt','mixed','en']){for(const key of ['title','goal','explanation','legend'])check(typeof l[key][lang]==='string'&&l[key][lang].trim(),`${key}/${lang}`);check(l.hints[lang].length===2&&l.hints[lang].every(Boolean),'two hints');check(!titles.has(`${lang}/${l.title[lang]}`),'distinct title');titles.add(`${lang}/${l.title[lang]}`);}
   check(typeof l.concept==='string'&&l.concept.trim()&&l.terms.length>0,'concept and terms');
   check(l.requires.length&&l.requires.every(id=>known.has(id)),'prerequisite mission');check(l.terms.every(id=>glossary[id]),'glossary');
   check(!l.projectId||(Array.isArray(projects)&&projects.some(p=>p.id===l.projectId))||(allowMissingProjects&&projects===null&&typeof l.projectId==='string'&&/^[a-z][a-z-]+$/.test(l.projectId)),'project link');
  }return catalog;
 }
 const api={validate};if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.ExecutableContent=api;
})(globalThis);
