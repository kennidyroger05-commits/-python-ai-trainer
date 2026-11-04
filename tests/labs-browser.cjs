const V4=require('./v4-navigation.cjs');
const {chromium}=require('playwright');const assert=require('node:assert/strict');const data=require('../exercises.json'),labs=require('../labs.json');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const width of [320,375,390]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const legacy={current:15,completed:data.slice(0,15).map(e=>e.id),xp:150,unlocked:['Fundamentos'],attempts:Object.fromEntries(data.slice(0,15).map(e=>[e.id,1])),awards:Object.fromEntries(data.slice(0,15).map(e=>[e.id,10]))};
  await page.addInitScript(p=>{if(!localStorage.getItem('seeded')){localStorage.setItem('pythonAiTrainerV1',JSON.stringify(p));localStorage.setItem('seeded','true');}},legacy);
  await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>document.querySelector('#homeProgress').textContent.includes('40'));
  assert.equal(await page.locator('#xp').textContent(),'150 XP');assert.equal(await page.locator('#bar').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pythonAiTrainerV2')).completed.length),15);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('pythonAiTrainerV1'))),legacy);
  // Generate a real error record, solve, review it once, and confirm no XP duplication or immediate loop.
  await V4.original(page);await page.locator('#answer button').nth(1).tap();await page.locator('#submit').tap();await page.locator('#hint').tap();await page.locator('#answer button').nth(0).tap();await page.locator('#submit').tap();
  assert.equal(await page.locator('#xp').textContent(),'152 XP');await page.locator('#homeButton').tap();await V4.area(page,'progress');await page.locator('#reviewButton').tap();assert.match(await page.locator('#counter').textContent(),/16 de 40/);await page.locator('#submit').tap();assert.equal(await page.locator('#xp').textContent(),'152 XP');await page.locator('#next').tap();await V4.area(page,'progress');await page.locator('#reviewButton').tap();assert.match(await page.locator('#reviewNotice').textContent(),/Nenhuma revisão/);
  // All five AI labs: eight stages, wrong decision blocked, valid decision advances.
  await V4.area(page,'lab');await page.locator('#aiLabButton').tap();for(let i=0;i<labs.length;i++){
   await page.locator('#labChoices button').nth(i).tap();for(let stage=0;stage<8;stage++){
    assert.match(await page.locator('#labStage').textContent(),new RegExp(`^${stage+1}/8`));assert.deepEqual(JSON.parse(await page.locator('#labData').textContent()),labs[i].stages[stage].data);
    await page.locator('#language').selectOption('en');assert.equal(await page.locator('#labExplanation').textContent(),labs[i].stages[stage].en);await page.locator('#language').selectOption('mixed');
    if(stage===5){await page.locator('#labActions button').nth((labs[i].correct+1)%3).tap();assert.equal(await page.locator('#labNext').isDisabled(),true);await page.locator('#labActions button').nth(labs[i].correct).tap();assert.equal(await page.locator('#labNext').isDisabled(),false);}
    if(stage<7)await page.locator('#labNext').tap();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
   await page.locator('#labPrev').tap();assert.match(await page.locator('#labStage').textContent(),/^7\/8/);await page.locator('#labRestart').tap();assert.match(await page.locator('#labStage').textContent(),/^1\/8/);
  }
  await page.locator('#labHome').tap();
  // Study the remaining API prerequisites before entering the debugging track.
  await V4.original(page);
  for(let j=16;j<26;j++){assert.match(await page.locator('#counter').textContent(),new RegExp(`${j+1} de 40`));await page.locator('#answer button').nth(data[j].correct).tap();await page.locator('#submit').tap();await page.locator('#next').tap();}
  await page.locator('#homeButton').tap();await V4.area(page,'practice');await page.locator('#debugButton').tap();const scenarios=data.filter(e=>e.debug);assert.equal(await page.locator('#debugList button').count(),6);
  for(let i=0;i<scenarios.length;i++){
   const e=scenarios[i];await page.locator('#debugList button').nth(i).tap();assert.equal(await page.locator('#debugPanel').isVisible(),true);
   if(e.debug.exception)assert.equal(await page.locator('#debugError').textContent(),`${e.debug.exception.type}: ${e.debug.exception.message}`);
   await page.locator('#investigate button').nth(1-e.debug.correctInvestigation).tap();assert.match(await page.locator('#investigationFeedback').textContent(),/Repetir/);await page.locator('#investigate button').nth(e.debug.correctInvestigation).tap();await page.locator('#language').selectOption('en');assert.match(await page.locator('#investigationFeedback').textContent(),/Good investigation/);await page.locator('#language').selectOption('mixed');
   await page.locator('#answer button').nth((e.correct+1)%3).tap();await page.locator('#submit').tap();assert.match(await page.locator('#feedback').textContent(),/Ainda não/);await page.locator('#answer button').nth(e.correct).tap();assert.equal(await page.locator('#assembled').textContent(),e.solutionCode);await page.locator('#submit').tap();assert.match(await page.locator('#feedback').textContent(),/Correto!/);const xp=await page.locator('#xp').textContent();assert.equal(await page.locator('#submit').isDisabled(),true);await page.locator('#submit').evaluate(el=>el.onclick());assert.equal(await page.locator('#xp').textContent(),xp);await page.locator('#homeButton').tap();
  }
  // Return through laboratory preserves an in-progress answer.
  await V4.original(page);await page.locator('#answer button').nth(1).tap();await page.locator('#homeButton').tap();await V4.area(page,'lab');await page.locator('#aiLabButton').tap();await page.locator('#labHome').tap();await V4.original(page);assert.match(await page.locator('#counter').textContent(),/33 de 40/);assert.equal(await page.locator('#answer button').nth(1).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#next').isVisible(),false);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}px: V1.5 migration, reviews/cooldown, five AI flows, six debugging cases, language, investigation, repairs and nonduplicated XP.`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
