'use strict';
const $=id=>document.getElementById(id);let offset=0,account=null,busy=false,total=0;
async function request(path,method='GET',body){
 const r=await fetch(path,{method,headers:{'Content-Type':'application/json',...(account?{'X-Trainer-Account':account}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json();if(!r.ok)throw Error(data.error||'Falha de comunicação');return data;
}
const make=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
async function load(){
 if(busy)return;busy=true;$('refresh').disabled=true;$('prev').disabled=$('next').disabled=true;
 $('students').replaceChildren();$('metrics').textContent='Carregando…';
 try{
 const s=await request('/api/session');account=s.id;
 const result=await request('/api/admin/list?offset='+offset);total=result.total;
 $('metrics').textContent=result.total+' contas · '+result.active+' acessos ativos · '+result.backups+' contas com backup';
 for(const student of result.students){
  const item=document.createElement('article');item.append(make('h3',student.email||student.id),make('p',(student.confirmed?'E-mail confirmado':'E-mail não confirmado')+' · '+(student.active?'Acesso ativo':'Sem acesso ativo')),make('p','Piloto até: '+(student.pilot_until?new Date(student.pilot_until).toLocaleString('pt-BR'):'—')+' · Último backup: '+(student.last_backup?new Date(student.last_backup).toLocaleString('pt-BR'):'—')));
  if(student.confirmed&&student.id!==account){
   const days=document.createElement('input');days.type='number';days.min=1;days.max=30;days.value=7;days.setAttribute('aria-label','Dias de acesso');
   const grant=make('button','Conceder acesso piloto'),revoke=make('button','Revogar acesso piloto');revoke.disabled=!student.pilot_until;
   grant.onclick=()=>change(student,'grant',Number(days.value));revoke.onclick=()=>change(student,'revoke');item.append(days,grant,revoke);
  }
  $('students').append(item);
 }
 $('status').textContent='Dados atualizados. Vendas não habilitadas.';
 }catch(e){$('status').textContent=e.message;$('metrics').textContent='Sem dados disponíveis.';total=0;}
 finally{busy=false;$('refresh').disabled=false;$('prev').disabled=offset===0;$('next').disabled=offset+50>=total;}
}
async function change(student,action,days){
 if(busy)return;if(action==='grant'&&(!Number.isInteger(days)||days<1||days>30)){ $('status').textContent='Prazo inválido.';return;}
 if(!confirm((action==='grant'?'Conceder '+days+' dias de piloto a ':'Revogar apenas acesso piloto de ')+(student.email||student.id)+'?'))return;
 busy=true;
 try{await request('/api/admin/'+action,'POST',{userId:student.id,days,confirm:true});}
 catch(e){$('status').textContent=e.message;busy=false;return;}
 busy=false;await load();
}
$('refresh').onclick=load;$('prev').onclick=()=>{if(!busy){offset=Math.max(0,offset-50);load();}};$('next').onclick=()=>{if(!busy&&offset+50<total){offset+=50;load();}};
$('reports').onchange=async e=>{
 const files=Array.from(e.target.files).slice(0,100);let valid=0,complete=0,passed=0,seconds=0,rejected=0;
 for(const f of files){
  try{if(f.size>8192)throw Error();const x=JSON.parse(await f.text());if(x.version!==1||!Number.isInteger(x.missionsCompleted)||x.missionsCompleted<0||x.missionsCompleted>13||typeof x.pythonPassed!=='boolean'||!Number.isInteger(x.elapsedSeconds)||x.elapsedSeconds<0||x.elapsedSeconds>86400)throw Error();valid++;complete+=Number(x.missionsCompleted===13);passed+=Number(x.pythonPassed);seconds+=x.elapsedSeconds;}catch{rejected++;}
 }
 $('summary').textContent=valid+' sessões válidas · '+complete+' unidades concluídas · '+passed+' aprovações Python · '+(valid?Math.round(seconds/valid/60):0)+' min médios · '+rejected+' arquivos rejeitados. Dados autodeclarados; não deduplicados.';
};
load();