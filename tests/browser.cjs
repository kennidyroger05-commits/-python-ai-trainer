const V4=require('./v4-navigation.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const data=require('../exercises.json');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{for(const width of [320,375,390]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true});
  const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>document.querySelector('#homeProgress').textContent.includes('40'));
  assert.equal(await page.locator('#language').inputValue(),'mixed');await V4.original(page);
  for(let i=0;i<data.length;i++){
   const e=data[i];assert.match(await page.locator('#counter').textContent(),new RegExp(`${i+1} de 40`));
   // Wrong answers must fail; hints must progress and localize.
   if(e.type==='build'){await page.locator('#answer button').first().tap();}else await page.locator('#answer button').nth((e.correct+1)%3).tap();
   await page.locator('#submit').tap();assert.match(await page.locator('#feedback').textContent(),/Ainda não/);
   await page.locator('#hint').tap();assert.equal(await page.locator('#feedback').textContent(),e.hints[0]);
   await page.locator('#hint').tap();assert.equal(await page.locator('#feedback').textContent(),e.hints[1]);
   await page.locator('#language').selectOption('en');assert.equal(await page.locator('#feedback').textContent(),e.translations.en.hints[1]);
   assert.equal(await page.locator('#code').textContent(),e.code||'');
   if(e.type==='build'){
    // Clear then use an exact, reviewed sequence of available blocks.
    await page.locator('#answer button').last().tap();
    let rest=e.answers[0];while(rest.length){const j=e.blocks.findIndex(b=>rest.startsWith(b));assert.ok(j>=0);await page.locator('#answer button').nth(j).tap();rest=rest.slice(e.blocks[j].length);}
    assert.equal(await page.locator('#assembled').textContent(),e.answers[0]);
   }else await page.locator('#answer button').nth(e.correct).tap();
   await page.locator('#homeButton').tap();await V4.original(page);
   const before=await page.locator('#assembled').textContent();
   await page.locator('#language').selectOption('pt');assert.equal(await page.locator('#assembled').textContent(),before);
   if(e.options)assert.equal(await page.locator('#answer .selected').textContent(),e.options[e.correct]);
   await page.locator('#legend button').first().tap();assert.equal(await page.locator('#glossary').isVisible(),true);
   await context.setOffline(true);await page.locator('#knowTerm').tap();await page.locator('#closeGlossary').tap();await context.setOffline(false);
   if(e.simulation){
    await page.locator('#simulate').tap();assert.equal(await page.locator('#prevLine').isDisabled(),true);
    for(const step of e.simulation.steps){await page.locator('#nextLine').tap();assert.deepEqual(JSON.parse(await page.locator('#simVariables').textContent()),step.variables);assert.equal(await page.locator('#simOutput').textContent(),[...step.output,step.error?`${step.error.type}: ${step.error.message}`:''].filter(Boolean).join('\n'));assert.equal(await page.locator('#simCode .current-line').textContent(),e.simulation.code.split('\n')[step.line]+'\n');}
    assert.equal(await page.locator('#nextLine').isDisabled(),true);await page.locator('#homeButton').tap();await V4.original(page);assert.deepEqual(JSON.parse(await page.locator('#simVariables').textContent()),e.simulation.steps.at(-1).variables);await page.locator('#prevLine').tap();assert.deepEqual(JSON.parse(await page.locator('#simVariables').textContent()),e.simulation.steps.at(-2).variables);await page.locator('#resetSim').tap();assert.equal(await page.locator('#simVariables').textContent(),'{}');
   }
   await page.locator('#submit').tap();assert.match(await page.locator('#feedback').textContent(),/Correto!/);
   const xp=await page.locator('#xp').textContent();assert.equal(await page.locator('#submit').isDisabled(),true);await page.locator('#submit').evaluate(el=>el.onclick());assert.equal(await page.locator('#xp').textContent(),xp);
   assert.equal(await page.locator('input:visible,textarea:visible,[contenteditable=true]:visible').count(),0);assert.equal(await page.evaluate(()=>['INPUT','TEXTAREA'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable),false);
   assert.equal(await page.locator('button:visible').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}: ${e.id} overflow`);
   await page.locator('#language').selectOption('mixed');
   if(i===39)await page.screenshot({path:`/tmp/trainer-${width}.png`,fullPage:true});
   await page.locator('#next').tap();
  }
  assert.match(await page.locator('#homeProgress').textContent(),/40 de 40/);
  await page.locator('#language').selectOption('en');await page.reload();await page.waitForFunction(()=>document.querySelector('#homeProgress').textContent.includes('40'));
  assert.equal(await page.locator('#language').inputValue(),'en');assert.equal(await page.locator('#xp').textContent(),'80 XP');
  await V4.original(page);page.once('dialog',d=>d.accept());await page.locator('#restartModule').tap();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pythonAiTrainerV2')).completed.length),36);
  assert.equal(await page.locator('#xp').textContent(),'72 XP');await V4.original(page);assert.match(await page.locator('#counter').textContent(),/37 of 40/);await page.locator('#homeButton').tap();
  page.once('dialog',d=>d.dismiss());await V4.area(page,'progress');await page.locator('#reset').tap();assert.equal(await page.locator('#xp').textContent(),'72 XP');
  page.once('dialog',d=>d.accept());await V4.area(page,'progress');await page.locator('#reset').tap();assert.equal(await page.locator('#xp').textContent(),'0 XP');assert.equal(await page.locator('#language').inputValue(),'mixed');assert.equal(await page.evaluate(()=>localStorage.getItem('trainer-known')),null);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}px: 40 missions, six types, three languages, preserved answer/code, glossary offline, six traces, hints, XP, storage, restart, reset, no keyboard fields/overflow.`);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
