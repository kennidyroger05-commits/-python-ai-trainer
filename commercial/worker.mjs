import {authEmail} from './auth-email.mjs';
// Staging only. No live checkout or public signup.
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8',...extra}});
const redirect=(location,extra={})=>new Response(null,{status:303,headers:{...headers,Location:location,...extra}});
const cookie=(token,maxAge)=>'__Host-trainer_session='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+maxAge;
const tokenOf=r=>r.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-trainer_session=([A-Za-z0-9._-]+)/)?.[1];
const publicPaths=new Set(['/','/index.html','/demo.html','/demo.js','/demo.json','/portal.css','/portal.js','/demo-exec.json','/account.html','/account.js',"/runtime/client.js","/runtime/manifest.json","/runtime/worker.js","/runtime/frame.js","/runtime/runner.py","/runtime/memory.js","/runtime/vendor/pyodide/pyodide.js","/runtime/vendor/pyodide/pyodide.asm.mjs","/runtime/vendor/pyodide/pyodide.asm.wasm","/runtime/vendor/pyodide/python_stdlib.zip","/runtime/vendor/pyodide/pyodide-lock.json"]);
export function activeGrant(rows,now=Date.now()){return Array.isArray(rows)&&rows.some(x=>x.revoked_at===null&&Date.parse(x.expires_at)>now);}
export function validSnapshot(data){return data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length<=100&&Object.entries(data).every(([k,v])=>/^[A-Za-z0-9_.-]{1,120}$/.test(k)&&typeof v==='string');}
async function boundedJSON(r,max=262144){
 if(!r.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw new Error('content type');
 const reader=r.body?.getReader();if(!reader)throw new Error('body');
 let chunks=[],size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new Error('body size');}chunks.push(value);}
 let bytes=new Uint8Array(size),offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
async function sup(env,path,token,options={}){
 const url=new URL(env.SUPABASE_URL);if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))throw Error('Invalid Supabase URL');
 return fetch(new URL(path,url),{...options,headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:'Bearer '+(token||env.SUPABASE_ANON_KEY),'Content-Type':'application/json',...options.headers}});
}
async function identity(env,r){
 const token=tokenOf(r);if(!token)return null;
 const res=await sup(env,'/auth/v1/user',token);if(!res.ok)return null;const user=await res.json();
 return user.id&&user.email_confirmed_at?{token,id:user.id}:null;
}
async function asset(env,r,path){
 const u=new URL(r.url);u.pathname=path;u.search='';
 const res=await env.ASSETS.fetch(new Request(u,r));const h=new Headers(res.headers);for(const [k,v] of Object.entries(headers))h.set(k,v);
 if(path==='/index.html'||path==='/account.html')h.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self' about:; worker-src blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
 return new Response(res.body,{status:res.status,headers:h});
}
export default {async fetch(r,env){
 try{
 const url=new URL(r.url),p=url.pathname;
 if(/%2f|%5c|%2e|%00/i.test(p)||p.includes('\\'))return json({error:'Caminho inválido'},400);
 if(!['GET','HEAD','POST','PUT'].includes(r.method))return json({error:'Método não permitido'},405);
 if(!['GET','HEAD'].includes(r.method)&&r.headers.get('Origin')!==url.origin)return json({error:'Origem inválida'},403);
 if(publicPaths.has(p)&&['GET','HEAD'].includes(r.method))return asset(env,r,p==='/'?'/index.html':p);
 const authResponse=await authEmail(r,env,{sup,boundedJSON,json});if(authResponse)return authResponse;
 if(p==='/api/login'&&r.method==='POST'){
   if(env.AUTH_LIMITER){const rate=await env.AUTH_LIMITER.limit({key:r.headers.get('CF-Connecting-IP')||'unknown'});if(!rate.success)return json({error:'Muitas tentativas'},429);}
   const b=await boundedJSON(r,4096);if(typeof b.email!=='string'||typeof b.password!=='string'||b.email.length>254||b.password.length>256)return json({error:'Dados inválidos'},400);
   const a=await sup(env,'/auth/v1/token?grant_type=password',null,{method:'POST',body:JSON.stringify({email:b.email,password:b.password})});
   if(!a.ok)return json({error:'Não foi possível entrar'},401);const s=await a.json();
   if(!s.user?.email_confirmed_at||!s.access_token)return json({error:'Confirme seu e-mail'},403);
   return json({ok:true},200,{'Set-Cookie':cookie(s.access_token,Math.min(3600,Number(s.expires_in)||3600))});
 }
 if(p==='/api/logout'&&r.method==='POST'){const token=tokenOf(r);if(token){try{await sup(env,'/auth/v1/logout?scope=local',token,{method:'POST'});}catch{/* local cookie still cleared */}}return json({ok:true},200,{'Set-Cookie':cookie('',0)});}
 const who=await identity(env,r);if(!who)return p.startsWith('/api/')?json({error:'Entre novamente'},401):redirect('/');
 if(p==='/api/progress'&&r.headers.get('X-Trainer-Account')!==who.id)return json({error:'Conta alterada. Entre novamente antes de salvar ou restaurar.'},409);
 const grants=await sup(env,'/rest/v1/trainer_entitlements?select=expires_at,revoked_at',who.token);
 if(!grants.ok)return json({error:'Permissões indisponíveis'},503);
 const pro=activeGrant(await grants.json());
 if(p==='/api/session'&&r.method==='GET')return json({pro,id:who.id,checkoutEnabled:false});
 if(!pro)return json({error:'Acesso Pro não ativo'},403);
 if(p==='/api/progress'&&r.method==='GET'){
   const a=await sup(env,'/rest/v1/trainer_progress?select=revision,snapshot',who.token);
   if(!a.ok)return json({error:'Backup indisponível'},503);
   return json((await a.json())[0]||{revision:0,snapshot:null});
 }
 if(p==='/api/progress'&&r.method==='PUT'){
   const b=await boundedJSON(r);
   if(!Number.isSafeInteger(b.revision)||b.revision<0||!validSnapshot(b.snapshot))return json({error:'Backup inválido'},400);
   const a=await sup(env,'/rest/v1/rpc/trainer_save_progress',who.token,{method:'POST',body:JSON.stringify({expected_revision:b.revision,new_snapshot:b.snapshot})});
   if(!a.ok)return json({error:'Não foi possível salvar'},503);
   const revision=await a.json();return revision===null?json({error:'Outra sessão salvou antes. Recarregue o backup.'},409):json({revision});
 }
 if(p==='/app/account-context.js'&&r.method==='GET')return new Response('window.TrainerAccount='+JSON.stringify(who.id)+';', {headers:{...headers,'Content-Type':'application/javascript; charset=utf-8'}});
 if(p.startsWith('/app/')&&['GET','HEAD'].includes(r.method))return asset(env,r,p);
 return json({error:'Não encontrado'},404);
 }catch{return json({error:'Serviço indisponível ou requisição inválida'},503);}
}};