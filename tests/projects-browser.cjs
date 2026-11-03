const {chromium}=require('playwright');const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const activities=[...require('../projects/catalog.json'),...require('../projects/debugging.json'),...require('../projects/testing.json')];
const E=require('../projects/engine'),M=require('../projects/models'),datasets=require('../projects/datasets.json');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const width of [320,375,390]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>document.querySelector('#homeProgress').textContent.includes('40'));assert.equal(await page.locator('#language').inputValue(),'mixed');
  const originalMission=await page.evaluate(()=>localStorage.getItem('pythonAiTrainerV2'));
  await page.locator('#projectsButton').tap();
  const menu=async id=>{await page.locator('#pMenu').evaluate(el=>el.open=true);await page.locator('#'+id).tap();};
  const open=async a=>{if(a.kind==='testing'){await menu('pTesting');return;}await menu(a.kind==='debug'?'pDebug':'pHub');await page.locator(`[data-activity="${E.key(a)}"]`).tap();};
  const record=async a=>page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).activities[id],{key:E.KEY,id:E.key(a)});
  let expectedXP=0;
  for(const a of activities){
   await open(a);
   for(let i=0;i<a.steps.length;i++){
    const s=a.steps[i];assert.ok((await page.locator('#pStep').textContent()).includes(s.title.mixed),`${a.id}/${s.id}`);
    assert.equal(await page.locator('#pNext').isDisabled(),true);
    // Exact wrong IDs fail even when their labels mention valid technical terms.
    const wrong=s.choices.find(c=>c.id!==s.correctId);await page.locator(`[data-choice="${wrong.id}"]`).tap();
    if(s.requiresTests)await page.locator('#pRunTests').tap();
    await page.locator('#pSubmit').tap();assert.match(await page.locator('#pFeedback').textContent(),/Ainda não/);
    await page.locator('#pSubmit').tap();assert.equal((await record(a)).steps[s.id].attempts,2);
    assert.equal(await page.locator('#pSupport').isVisible(),true);
    await page.locator('#pProceed').tap();assert.equal(await page.locator('#pSupport').isVisible(),false);
    await page.locator('#pHint').tap();assert.equal(await page.locator('#pFeedback').textContent(),s.hints[0].mixed);
    await page.locator('#pHint').tap();assert.equal(await page.locator('#pFeedback').textContent(),s.hints[1].mixed);
    for(const layer of ['definition','example','professional']){await page.locator(`[data-layer="${layer}"]`).tap();assert.equal(await page.locator('#pLayerText').textContent(),s.layers[layer].mixed);}
    await context.setOffline(true);await page.locator('#pTerms button').first().tap();assert.equal(await page.locator('#pTermText').isVisible(),true);await context.setOffline(false);
    await page.locator(`[data-choice="${s.correctId}"]`).tap();const code=await page.locator('#pCode').textContent();
    await page.locator('#language').selectOption('en');assert.equal(await page.locator('#pAnswers [aria-pressed=true]').getAttribute('data-choice'),s.correctId);assert.equal(await page.locator('#pCode').textContent(),code);assert.equal(await page.locator('#pPrompt').textContent(),s.prompt.en);
    // Persist mid-stage, including answer, hint level, flow and current step, rather than only completions.
    if(a.kind==='project'&&(i===0||i===4)){
     await page.reload();await page.waitForFunction(()=>document.querySelector('#homeProgress').textContent.includes('40'));assert.equal(await page.locator('#language').inputValue(),'en');await page.locator('#projectsButton').tap();await open(a);assert.equal((await record(a)).currentStepId,s.id);assert.equal(await page.locator('#pAnswers [aria-pressed=true]').getAttribute('data-choice'),s.correctId);assert.equal(await page.locator('#pHint').isDisabled(),true);
    }
    await page.locator('#language').selectOption('mixed');
    if(i===0){
     await page.locator('#pFlow').evaluate(el=>el.open=true);
     for(const trace of a.traces){
      const position=a.traces.indexOf(trace);await page.locator('#pFlowChoices button').nth(position).tap();
      for(let n=0;n<trace.nodes.length;n++){
       const node=trace.nodes[n];assert.deepEqual(JSON.parse(await page.locator('#pFlowInput').textContent()),node.input);assert.deepEqual(JSON.parse(await page.locator('#pFlowOutput').textContent()),node.output);assert.equal(await page.locator('#pFlowPath [aria-current=step]').textContent(),`${n+1}. ${node.title.mixed}`);if(n<trace.nodes.length-1)await page.locator('#pFlowNext').tap();
      }
      assert.equal(await page.locator('#pFlowNext').isDisabled(),true);await page.locator('#pFlowPrev').tap();await page.locator('#pFlowReset').tap();assert.equal(await page.locator('#pFlowPrev').isDisabled(),true);
     }
     await page.locator('#pFlow').evaluate(el=>el.open=false);
    }
    if(a.id==='model-router'&&i===0){
      // Optional concept review must return to the exact draft without jumping normal mission progress.
      await page.locator('#pSupport').evaluate(el=>el.hidden=false);await page.locator('#pReview').tap();assert.equal(await page.locator('#returnToProject').isVisible(),true);await page.locator('#returnToProject').tap();assert.equal(await page.locator('#pAnswers [aria-pressed=true]').getAttribute('data-choice'),s.correctId);assert.equal((await record(a)).currentStepId,s.id);
    }
    if(s.requiresTests){await page.locator('#pRunTests').tap();const tests=(await record(a)).testRun;assert.equal(tests.passed,true);assert.ok(tests.results.length);}
    await page.locator('#pSubmit').tap();assert.match(await page.locator('#pFeedback').textContent(),/Etapa validada/);expectedXP+=2;assert.match(await page.locator('#pXP').textContent(),new RegExp(`${expectedXP}$`));
    await page.evaluate(()=>document.getElementById('pSubmit').click());assert.match(await page.locator('#pXP').textContent(),new RegExp(`${expectedXP}$`));
    if(a.id==='model-router'&&s.id==='find-inversion'){await page.locator('#pRunTests').tap();assert.equal((await record(a)).testRun.passed,false,'The investigated buggy copy must really fail tests');}
    if(i>0){await page.locator('#pPrev').tap();await page.locator('#pNext').tap();assert.ok((await page.locator('#pStep').textContent()).includes(s.title.mixed));assert.equal(await page.locator('#pSubmit').isDisabled(),true);}
    assert.equal(await page.locator('input,textarea,[contenteditable=true]').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}: ${a.id}/${s.id}`);
    assert.equal(await page.locator('#projectsArea button:visible').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})),true);
    await page.locator('#pNext').tap();
   }
   assert.equal(await page.locator('#pConclusion').isVisible(),true);assert.equal((await record(a)).completedAt>0,true);
   if(a.kind==='project'){
     const downloading=page.waitForEvent('download');await page.locator('#pExport').tap();const download=await downloading;assert.equal(download.suggestedFilename(),`python-ai-lab-${a.id}.md`);const report=await fs.readFile(await download.path(),'utf8');assert.ok(report.includes('Projeto didático e simulado'));assert.ok(report.includes(a.goal.mixed));for(const s of a.steps)assert.ok(report.includes(s.id));assert.ok(report.includes('Não comprova experiência profissional'));
   }
  }
  assert.equal(expectedXP,140);await menu('pSkills');assert.equal(await page.locator('#pSkillsCards article').count(),10);const english=page.locator('#pSkillsCards article').filter({hasText:'Inglês técnico'});assert.match(await english.textContent(),/Praticado: 1/);assert.match(await english.textContent(),/Acertado ao menos uma vez: 1/);
  await menu('pPortfolio');assert.equal(await page.locator('[data-export]').count(),4);
  const a=activities[0];await open(a);await page.locator('#pRevisit').tap();assert.equal(await page.locator('#pSubmit').isDisabled(),true);page.once('dialog',d=>d.dismiss());await page.locator('#pRestart').tap();assert.match(await page.locator('#pProgress').textContent(),/10\/10/);page.once('dialog',d=>d.accept());await page.locator('#pRestart').tap();assert.match(await page.locator('#pProgress').textContent(),/0\/10/);
  for(const s of a.steps){await page.locator(`[data-choice="${s.correctId}"]`).tap();if(s.requiresTests)await page.locator('#pRunTests').tap();await page.locator('#pSubmit').tap();await page.locator('#pNext').tap();}assert.match(await page.locator('#pXP').textContent(),/140$/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('pythonAiTrainerV2')),originalMission,'Lab must not overwrite mission history');
  // Rapid screen alternation preserves completed records and the current project.
  for(let n=0;n<3;n++){await page.locator('#pHome').tap();await page.locator('#projectsButton').tap();await open(a);assert.equal(await page.locator('#pConclusion').isVisible(),true);}
  await page.screenshot({path:`/tmp/v3-complete-${width}.png`,fullPage:true});await page.locator('#pHome').tap();page.once('dialog',d=>d.dismiss());await page.locator('#reset').tap();assert.ok(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).awards,E.KEY));page.once('dialog',d=>d.accept());await page.locator('#reset').tap();assert.equal(await page.locator('#xp').textContent(),'0 XP');assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).awards,E.KEY),{});assert.equal(await page.locator('#language').inputValue(),'mixed');
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS V3 ${width}px: 70 stages, 4 projects, 8 debugging cases, tutorial, flows, reload/translation/return, test gating, evidence, exports, restart/reset and isolated mission XP.`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
