// Default disabled. The database checks administrator membership for EVERY operation.
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
export async function adminRoute(r,env,who,{sup,boundedJSON,json,asset}){
 const path=new URL(r.url).pathname;
 if(!path.startsWith('/admin/')&&!path.startsWith('/api/admin/'))return null;
 if(env.ADMIN_ENABLED!=='true')return json({error:'Administração indisponível'},403);
 const rpc=async(name,body={})=>sup(env,'/rest/v1/rpc/'+name,who.token,{method:'POST',body:JSON.stringify(body)});
 const allowed=await rpc('trainer_admin_check');
 if(!allowed.ok)return json({error:'Administração indisponível'},503);
 const isAdmin=(await allowed.json())===true;
 if(path==='/api/admin/status'&&r.method==='GET')return json({admin:isAdmin});
 if(!isAdmin)return json({error:'Acesso administrativo negado'},403);
 if(r.method==='GET'&&['/admin/index.html','/admin/admin.js'].includes(path))return asset(env,r,path);
 if(path==='/api/admin/list'&&r.method==='GET'){
  const raw=new URL(r.url).searchParams.get('offset')||'0';
  const offset=Number(raw);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return json({error:'Página inválida'},400);
  const result=await rpc('trainer_admin_list',{p_offset:offset});
  return result.ok?json(await result.json()):json({error:'Não foi possível consultar os alunos'},503);
 }
 if(r.method==='POST'&&['/api/admin/grant','/api/admin/revoke'].includes(path)){
  if(r.headers.get('X-Trainer-Account')!==who.id)return json({error:'Conta alterada'},409);
  const b=await boundedJSON(r,2048);
  if(!uuid(b.userId)||b.confirm!==true)return json({error:'Confirmação ou aluno inválido'},400);
  if(path.endsWith('/grant')&&(!Number.isInteger(b.days)||b.days<1||b.days>30))return json({error:'Prazo deve ser de 1 a 30 dias'},400);
  const result=await rpc(path.endsWith('/grant')?'trainer_admin_grant':'trainer_admin_revoke',path.endsWith('/grant')?{p_user:b.userId,p_days:b.days}:{p_user:b.userId});
  return result.ok?json({result:await result.json()}):json({error:'Operação não autorizada ou indisponível'},403);
 }
 return json({error:'Não encontrado'},404);
}
