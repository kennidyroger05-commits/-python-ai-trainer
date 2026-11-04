const V4=require('./v4-navigation.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict');const E=require('../projects/engine'),missions=require('../exercises.json');
const catalog=[...require('../projects/catalog.json'),...require('../projects/debugging.json'),...require('../projects/testing.json')];
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const launch=async seed=>{const context=await browser.newContext({viewport:{width:375,height:850},isMobile:true,hasTouch:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));if(seed)await page.addInitScript(seed.fn,seed.args);await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>document.querySelector('#homeProgress').textContent.includes('40'));return {context,page,errors};};
 for(const n of [5,15,40]){
  const legacy={version:2,current:n,completed:missions.slice(0,n).map(m=>m.id),xp:n*5,attempts:Object.fromEntries(missions.slice(0,n).map(m=>[m.id,1])),awards:Object.fromEntries(missions.slice(0,n).map(m=>[m.id,5])),concepts:{},unlocked:['Fundamentos']},legacyKey=n===40?'pythonAiTrainerV2':'pythonAiTrainerV1';
  const {context,page,errors}=await launch({fn:({key,legacy})=>{if(!localStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(legacy));localStorage.setItem('trainer-language','en');localStorage.setItem('trainer-known','["model"]');localStorage.setItem('seeded','1');}},args:{key:legacyKey,legacy}});
  assert.equal(await page.locator('#xp').textContent(),`${n*5} XP`);assert.equal(await page.locator('#language').inputValue(),'en');assert.equal(await page.evaluate(()=>localStorage.getItem('trainer-known')),'["model"]');assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).xp,legacyKey),n*5);
  if(n===40){await V4.original(page);assert.equal(await page.locator('#module').textContent(),'Training');await page.locator('#homeButton').tap();}
  await V4.area(page,'projects');await page.locator('[data-activity="project/model-router"]').tap();assert.match(await page.locator('#pXP').textContent(),/: 0$/);const s=catalog[0].steps[0];await page.locator(`[data-choice="${s.correctId}"]`).tap();await page.locator('#pHint').tap();
  await page.locator('#pFlow').evaluate(el=>el.open=true);await page.locator('#pFlowNext').tap();const flowText=await page.locator('#pFlowOutput').textContent();await page.reload();await page.waitForFunction(()=>document.querySelector('#homeProgress').textContent.includes('40'));await V4.area(page,'projects');await page.locator('[data-activity="project/model-router"]').tap();assert.equal(await page.locator('#pAnswers [aria-pressed=true]').getAttribute('data-choice'),s.correctId);assert.equal(await page.locator('#pFeedback').textContent(),s.hints[0].en);assert.equal(await page.locator('#pFlowOutput').textContent(),flowText);assert.equal(await page.locator('#xp').textContent(),`${n*5} XP`);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS browser migration ${n} legacy completions to V3: XP/preferences preserved, drafts/hints/flow survive reload.`);
 }
 // A damaged Lab record does not erase valid mission history.
 {
  const p={version:2,current:1,completed:[missions[0].id],xp:10,attempts:{},awards:{[missions[0].id]:10},concepts:{},unlocked:['Fundamentos']};const {context,page,errors}=await launch({fn:p=>{localStorage.setItem('pythonAiTrainerV2',JSON.stringify(p));localStorage.setItem('pythonAiLabV3','{damaged');},args:p});
  assert.equal(await page.locator('#xp').textContent(),'10 XP');assert.equal(await page.evaluate(()=>localStorage.getItem('pythonAiLabV3.recovery')),'{damaged');await V4.area(page,'projects');assert.equal(await page.locator('[data-activity]').count(),4);assert.deepEqual(errors,[]);await context.close();
 }
 // Corruption in one project is salvaged field by field; completed records are not globally discarded.
 {
  const state=E.empty(),a=catalog[0],s=a.steps[0];E.choose(state,a,s,s.correctId);E.submit(state,a,s,1000);const r=E.get(state,a);r.currentStepId=a.steps.at(-1).id;r.steps[s.id].attempts='bad';r.steps[s.id].feedback='hint';r.steps[s.id].hints=0;
  const {context,page,errors}=await launch({fn:value=>localStorage.setItem('pythonAiLabV3',JSON.stringify(value)),args:state});await V4.area(page,'projects');await page.locator('[data-activity="project/model-router"]').tap();assert.match(await page.locator('#pStep').textContent(),/^2\/10/);assert.match(await page.locator('#pXP').textContent(),/: 5$/);assert.ok(await page.evaluate(()=>localStorage.getItem('pythonAiLabV3.recovery')));assert.deepEqual(errors,[]);await context.close();
 }
 // Storage denial is a visible limitation, while the game remains usable within the tab.
 for(const denyReads of [false,true]){
  const {context,page,errors}=await launch({fn:denyReads=>{Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError');};if(denyReads)Storage.prototype.getItem=function(){throw new DOMException('denied','SecurityError');};},args:denyReads});
  assert.equal(await page.locator('#storageStatus').isVisible(),true);await V4.area(page,'projects');await page.locator('[data-activity="project/model-router"]').tap();await page.locator(`[data-choice="${catalog[0].steps[0].correctId}"]`).tap();await page.locator('#pSubmit').tap();assert.match(await page.locator('#pProgress').textContent(),/^1\/10/);await page.locator('#language').selectOption('en');assert.match(await page.locator('#pFeedback').textContent(),/Stage validated/);assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS V3 browser extremes: missing/corrupt records, field recovery, isolated history and denied storage/quota without false persistence claims.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
