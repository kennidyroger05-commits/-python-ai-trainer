// Legacy regression suites use the real original-mission library, not the new guided order.
const originals=require('../exercises.json');
async function area(page,name){await page.waitForFunction(()=>!document.getElementById('learningNav').hidden);const card={practice:'#jPractice',lab:'#jLab',progress:'#jProgress'}[name];if(card&&await page.locator(card).isVisible())return;if(name==='learn'){await page.click('#vLearnTab');return;}if(name==='practice'){await page.click('#vPracticeTab');return;}if(!await page.locator('#jMenu').evaluate(e=>e.open))await page.click('#jMenuLabel');await page.click(`[data-area="${name}"]`);}
async function library(page){await area(page,'learn');await page.click('#vLegacy');}
async function original(page,id){await library(page);if(!id){const completed=await page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('pythonAiTrainerV2'))?.completed||[]}catch{return []}});id=originals.find(e=>!completed.includes(e.id))?.id||originals.at(-1).id;}await page.click(`[data-mission="${id}"]`);}
module.exports={area,library,original};
