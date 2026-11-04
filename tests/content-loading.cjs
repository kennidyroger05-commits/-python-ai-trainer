const assert=require('node:assert/strict'),C=require('../core/content'),R=require('../runtime/content');
const lessons=require('../runtime/lessons.json'),missions=require('../exercises.json'),projects=require('../projects/catalog.json'),terms={...require('../runtime/terms.json')};
(async()=>{
let seen;const value=await C.json('projects/catalog.json',{fetcher:async(path,options)=>{seen={path,options};return {ok:true,json:async()=>({ready:true})};}});assert.deepEqual(value,{ready:true});assert.equal(seen.path,'projects/catalog.json');assert.ok(seen.options.signal instanceof AbortSignal);
for(const path of ['https://external.invalid/data.json','/absolute.json','../data.json','a/../../data.json','data.js'])await assert.rejects(C.json(path,{fetcher:()=>{throw Error('must not fetch');}}),/relative content/);
await assert.rejects(C.json('labs.json',{fetcher:async()=>({ok:false})}),/unavailable/);
await assert.rejects(C.json('labs.json',{fetcher:async()=>({ok:true,json:async()=>{throw SyntaxError('broken');}})}),SyntaxError);
const begin=performance.now();await assert.rejects(C.json('labs.json',{timeoutMs:20,fetcher:(_,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('deadline','AbortError'))))}),{name:'AbortError'});assert.ok(performance.now()-begin<1000,'A stalled request must finish within its bounded test deadline');
assert.throws(()=>R.validate(lessons,missions,null,terms),/project link/);assert.equal(R.validate(lessons,missions,null,terms,{allowMissingProjects:true}),lessons);assert.equal(R.validate(lessons,missions,projects,terms),lessons);
const broken=structuredClone(lessons);broken[9].projectId='unknown-project';assert.throws(()=>R.validate(broken,missions,projects,terms),/project link/,'Complete content validation is still mandatory when projects are present');
console.log('PASS bounded JSON loading/abort/errors, relative paths and explicit degraded runtime without weakening full project-reference validation');
})().catch(e=>{console.error(e);process.exitCode=1;});
