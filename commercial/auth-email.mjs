// Optional staging feature. Supabase must send OTP codes (not direct login links).
const emailValid=x=>typeof x==='string'&&x.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
const passwordValid=x=>typeof x==='string'&&x.length>=12&&x.length<=128;
const otpValid=x=>typeof x==='string'&&/^\d{6,10}$/.test(x);
export function emailAuthEnabled(env){return env.AUTH_EMAIL_ENABLED==='true'&&typeof env.AUTH_LIMITER?.limit==='function';}
export async function authEmail(r,env,{sup,boundedJSON,json}){
 const path=new URL(r.url).pathname;
 if(path==='/api/auth-config'&&r.method==='GET')return json({emailEnabled:emailAuthEnabled(env)});
 if(!path.startsWith('/api/account/'))return null;
 if(!emailAuthEnabled(env))return json({error:'Cadastro e recuperação indisponíveis nesta fase.'},403);
 if(r.method!=='POST')return json({error:'Método inválido'},405);
 if(r.headers.get('Origin')!==new URL(r.url).origin)return json({error:'Origem inválida'},403);
 // CF-Connecting-IP is inserted by Cloudflare. No browser-provided custom key.
 const ip=r.headers.get('CF-Connecting-IP')||'unknown';
 const rate=await env.AUTH_LIMITER.limit({key:ip});
 if(!rate.success)return json({error:'Muitas tentativas. Tente novamente mais tarde.'},429);
 const b=await boundedJSON(r,4096);
 if(!emailValid(b.email))return json({error:'Informe um e-mail válido.'},400);
 const email=b.email.trim().toLowerCase();
 const captcha=typeof b.captchaToken==='string'&&b.captchaToken.length<=2048?{gotrue_meta_security:{captcha_token:b.captchaToken}}:{};
 const accepted=()=>json({ok:true,message:'Se a solicitação for elegível, um código será enviado. Confira o e-mail e tente novamente mais tarde se necessário.'});
 if(path==='/api/account/signup'){
  if(!passwordValid(b.password))return json({error:'Use uma senha entre 12 e 128 caracteres.'},400);
  const result=await sup(env,'/auth/v1/signup',null,{method:'POST',body:JSON.stringify({email,password:b.password,...captcha})});
  if(result.status>=500)return json({error:'Serviço temporariamente indisponível.'},503);
  // Fail closed if email confirmation is misconfigured: no session exposed.
  if(result.ok){const data=await result.json();if(data.access_token||data.session)return json({error:'Confirmação de e-mail não configurada.'},503);}
  return accepted();
 }
 if(path==='/api/account/recover'){
  const result=await sup(env,'/auth/v1/recover',null,{method:'POST',body:JSON.stringify({email,...captcha})});
  if(result.status>=500)return json({error:'Serviço temporariamente indisponível.'},503);
  return accepted();
 }
 if(path==='/api/account/confirm'||path==='/api/account/reset'){
  const recovery=path.endsWith('/reset');
  if(!otpValid(b.code)||recovery&&!passwordValid(b.password))return json({error:'Código ou senha inválidos.'},400);
  const verified=await sup(env,'/auth/v1/verify',null,{method:'POST',body:JSON.stringify({email,token:b.code,type:recovery?'recovery':'email',...captcha})});
  if(!verified.ok)return json({error:'Código inválido ou expirado.'},400);
  const session=await verified.json();
  if(!session.access_token||!session.user?.email_confirmed_at||session.user.email?.toLowerCase()!==email)return json({error:'Não foi possível confirmar a identidade.'},403);
  if(recovery){
   const changed=await sup(env,'/auth/v1/user',session.access_token,{method:'PUT',body:JSON.stringify({password:b.password})});
   if(!changed.ok)return json({error:'Não foi possível atualizar a senha. Solicite outro código.'},400);
  }
  // The OTP session is not used to unlock the app. Sign in with password afterwards.
  await sup(env,'/auth/v1/logout?scope='+(recovery?'global':'local'),session.access_token,{method:'POST'});
  return json({ok:true,message:recovery?'Senha alterada. Entre novamente.':'E-mail confirmado. Entre com sua senha.'});
 }
 return json({error:'Não encontrado'},404);
}
