import assert from 'node:assert/strict';
import worker,{activeGrant,validSnapshot} from './worker.mjs';
const now=Date.now(),future=new Date(now+60000).toISOString(),past=new Date(now-60000).toISOString();
let total=0;
const equal=(a,b)=>{assert.deepEqual(a,b);total++;};
const users={a:{id:'user-a',email_confirmed_at:past},b:{id:'user-b',email_confirmed_at:past},unconfirmed:{id:'user-c',email_confirmed_at:null}};
const ent={a:[{expires_at:future,revoked_at:null}],b:[]};
let revision=0,backup=null,upstreamDown=false;
const reply=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json'}});
const originalFetch=globalThis.fetch;
globalThis.fetch=async (input,options)=>{
 const path=new URL(input).pathname,token=options.headers.Authorization.split(' ')[1];
 if(upstreamDown)throw Error('network unavailable');
 if(path==='/auth/v1/user')return users[token]?reply(users[token]):reply({},401);
 if(path==='/auth/v1/token')return reply({user:users.a,access_token:'a',expires_in:3600});
 if(path==='/auth/v1/logout')return reply({});
 if(path==='/rest/v1/trainer_entitlements')return reply(ent[token]||[]);
 if(path==='/rest/v1/trainer_progress')return reply(backup===null?[]:[{revision,snapshot:backup}]);
 if(path==='/rest/v1/rpc/trainer_save_progress'){
  const data=JSON.parse(options.body);if(data.expected_revision!==revision)return reply(null);
  backup=data.new_snapshot;return reply(++revision);
 }
 throw Error('Unexpected upstream route '+path);
};
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'fake',ASSETS:{fetch:async r=>new Response(new URL(r.url).pathname)}};
const call=(path,{method='GET',token,account,body,origin='https://test.example',headers={}}={})=>worker.fetch(new Request('https://test.example'+path,{method,headers:{...(token?{Cookie:'__Host-trainer_session='+token}:{}),...(account?{'X-Trainer-Account':account}:{}),...(!['GET','HEAD'].includes(method)?{Origin:origin,'Content-Type':'application/json'}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
try{
 equal(activeGrant(ent.a,now),true);equal(activeGrant([{expires_at:past,revoked_at:null}],now),false);equal(activeGrant([{expires_at:future,revoked_at:past}],now),false);equal(activeGrant([],now),false);
 equal(validSnapshot({a:'ok'}),true);equal(validSnapshot({a:1}),false);equal(validSnapshot([]),false);
 equal((await call('/app/index.html')).status,303);
 equal((await call('/app/curriculum/exercises.json')).status,303);
 equal((await call('/runtime/lessons.json')).status,303);
 equal((await call('/runtime/client.js')).status,200);
 equal((await call('/demo-exec.json')).status,200);
 equal((await call('/app%2findex.html')).status,400);
 equal((await call('/api/progress')).status,401);
 equal((await call('/api/login',{method:'POST',body:{email:'a@b.test',password:'password'},origin:'https://evil.test'})).status,403);
 const login=await call('/api/login',{method:'POST',body:{email:'a@b.test',password:'password'}});
 equal(login.status,200);equal(login.headers.get('Set-Cookie').includes('HttpOnly; Secure; SameSite=Strict'),true);
 equal((await call('/app/index.html',{token:'unconfirmed'})).status,303);
 equal((await call('/app/index.html',{token:'b'})).status,403);
 equal((await call('/app/index.html',{token:'a'})).status,200);
 equal((await call('/app/index.html',{token:'a'})).headers.get('Cache-Control'),'private, no-store');
 equal((await call('/api/session',{token:'b'})).status,200);equal((await (await call('/api/session',{token:'b'})).json()).pro,false);
 equal((await call('/api/progress',{token:'a',account:'user-b'})).status,409);
 equal((await call('/api/progress',{token:'a'})).status,409);
 equal((await call('/api/progress',{method:'PUT',token:'a',account:'user-a',body:{revision:0,snapshot:{x:3}}})).status,400);
 equal(await (await call('/api/progress',{token:'a',account:'user-a'})).json(),{revision:0,snapshot:null});
 equal(await (await call('/api/progress',{method:'PUT',token:'a',account:'user-a',body:{revision:0,snapshot:{x:'1'}}})).json(),{revision:1});
 equal((await call('/api/progress',{method:'PUT',token:'a',account:'user-a',body:{revision:0,snapshot:{x:'2'}}})).status,409);
 equal(await (await call('/api/progress',{token:'a',account:'user-a'})).json(),{revision:1,snapshot:{x:'1'}});
 equal((await call('/api/progress',{token:'b',account:'user-b'})).status,403);
 ent.a=[{expires_at:future,revoked_at:past}];equal((await call('/app/index.html',{token:'a'})).status,403);
 const logout=await call('/api/logout',{method:'POST',token:'a'});equal(logout.status,200);equal(logout.headers.get('Set-Cookie').includes('Max-Age=0'),true);
 upstreamDown=true;equal((await call('/app/index.html',{token:'a'})).status,503);
 console.log(total+' checks passed (native Node HTTP objects, mocked Supabase and assets).');
}finally{globalThis.fetch=originalFetch;}
