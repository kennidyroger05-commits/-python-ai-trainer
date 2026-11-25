import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
import worker from './worker.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=resolve('commercial/dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.wasm':'application/wasm','.zip':'application/zip','.py':'text/plain','.svg':'image/svg+xml'};
const env={ASSETS:{fetch:async r=>{
 const pathname=decodeURIComponent(new URL(r.url).pathname),file=resolve(root,'.'+pathname);
 if(!file.startsWith(root+sep))return new Response('not found',{status:404});
 try{return new Response(await readFile(file),{headers:{'Content-Type':types[extname(file)]||'application/octet-stream'}});}catch{return new Response('not found',{status:404});}
}}};
const server=createServer(async(req,res)=>{
 try{
  const u='http://127.0.0.1:'+server.address().port+req.url;
  const chunks=[];for await(const c of req)chunks.push(c);
  const body=Buffer.concat(chunks),r=await worker.fetch(new Request(u,{method:req.method,headers:req.headers,...(body.length?{body}:{})}),env);
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
 }catch{res.writeHead(500);res.end('test server error');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 const base='http://127.0.0.1:'+server.address().port;
 const catalog=JSON.parse(await readFile(root+'/demo.json','utf8'));
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 for(const width of [320,375,1280]){
  const context=await browser.newContext({viewport:{width,height:812},acceptDownloads:true}),p=await context.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);
  assert.ok(await p.getByRole('heading',{name:'Aprenda código. Entenda inteligência artificial.'}).isVisible());
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await p.locator('#accountLink').isVisible(),false);
  assert.equal(await p.locator('#app').isVisible(),false);
  assert.equal((await p.request.get(base+'/app/curriculum/exercises.json',{maxRedirects:0})).status(),303);
  if(width===375){
   await p.getByRole('link',{name:'Começar gratuitamente'}).click();
   await p.waitForFunction(()=>document.querySelector('#count').textContent==='1 / 13');
   for(const [index,e] of catalog.entries()){
    assert.equal(await p.locator('#count').textContent(),(index+1)+' / 13');
    if(e.options){
     if(index===0){await p.locator('#choices button').nth((e.correct+1)%e.options.length).click();assert.equal(await p.locator('#next').isEnabled(),false);await p.click('#hint');}
     await p.locator('#choices button').nth(e.correct).click();
    }else{
     let rest=e.answers[0];const used=new Set();
     while(rest){const n=e.blocks.findIndex((b,k)=>!used.has(k)&&rest.startsWith(b));assert.ok(n>=0,e.id);used.add(n);await p.locator('#choices button').nth(e.blocks.length-1-n).click();rest=rest.slice(e.blocks[n].length);}
     await p.getByRole('button',{name:'Verificar código'}).click();
    }
    assert.ok(await p.locator('#next').isEnabled(),e.id);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),e.id+' overflow');
    await p.click('#next');
   }
   await p.locator('#practice').waitFor({state:'visible'});
   await p.locator('#source').fill('score = base_score + 0.1\nprint(score)');
   await p.click('#execute');
   await p.waitForFunction(()=>document.querySelector('#execution').textContent.includes('Todos os testes passaram'),{},{timeout:120000});
   const downloadEvent=p.waitForEvent('download');await p.click('#report');const download=await downloadEvent;
   const report=JSON.parse(await readFile(await download.path(),'utf8'));
   assert.equal(report.missionsCompleted,13);assert.equal(report.pythonPassed,true);assert.equal(report.wrong,1);assert.equal(report.hints,1);
   assert.deepEqual(Object.keys(report).sort(),['attempts','elapsedSeconds','hints','missionsCompleted','pythonAttempts','pythonPassed','version','wrong'].sort());
  }
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS commercial portal '+width+'px'+(width===375?' + 13 missions + real Python + voluntary report':''));
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
