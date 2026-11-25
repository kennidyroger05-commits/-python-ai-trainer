import {createHmac,timingSafeEqual} from 'node:crypto';
// Isolated adapter; not mounted on any HTTP route. No writes or credentials here.
const uuid = x => typeof x==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const statuses = {paid:'paid',refunded:'refunded',chargedback:'chargeback'};
const accepted = {order_approved:'paid',order_refunded:'refunded',chargeback:'chargedback'};
const email = x => typeof x==='string' && x.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
export function authenticate(raw,signature,token){
 if(!Buffer.isBuffer(raw)||raw.length===0||raw.length>131072||typeof token!=='string'||token.length<20||typeof signature!=='string'||!/^[0-9a-f]{40}$/.test(signature))return false;
 return timingSafeEqual(createHmac('sha1',token).update(raw).digest(),Buffer.from(signature,'hex'));
}
export async function reconcile({raw,signature,token,products,readSale,now=Date.now()}){
 if(!authenticate(raw,signature,token))return {kind:'rejected',status:401};
 let event;try{event=JSON.parse(raw.toString('utf8'));}catch{return {kind:'rejected',status:400};}
 if(!event||typeof event!=='object'||!uuid(event.order_id))return {kind:'rejected',status:400};
 if(!Object.hasOwn(accepted,event.webhook_event_type))return {kind:'ignored'};
 if(event.order_status!==accepted[event.webhook_event_type])return {kind:'rejected',status:400};
 // Signed payload is only a trigger: never trust its customer/product/approval fields.
 let sale;try{sale=await readSale(event.order_id);}catch{return {kind:'retry',status:503};}
 if(!sale||sale.id!==event.order_id||!uuid(sale.product?.id)||!(products instanceof Set)||!products.has(sale.product.id)||sale.sale_type!=='producer'||sale.type!=='product'||sale.scheduled_installment||!email(sale.customer?.email))return {kind:'review'};
 if(!Object.hasOwn(statuses,sale.status))return {kind:'retry',status:503};
 // A refund notification with a not-yet-updated sale must never reactivate access.
 if(event.webhook_event_type!=='order_approved'&&sale.status==='paid')return {kind:'retry',status:503};
 const paidAt=sale.approved_date; const ms=Date.parse(paidAt);
 if(sale.status==='paid'&&(!Number.isFinite(ms)||ms>now+300000))return {kind:'review'};
 return {kind:'verified',order:{p_order:sale.id,p_product:sale.product.id,p_email:sale.customer.email.trim().toLowerCase(),p_status:statuses[sale.status],p_paid_at:Number.isFinite(ms)?new Date(ms).toISOString():null}};
}
export function saleReader({accessToken,accountId,fetchImpl=fetch}){
 if(!accessToken||!accountId)throw Error('Missing credentials');
 return async id=>{
  if(!uuid(id))throw Error('Invalid order id');
  const res=await fetchImpl('https://public-api.kiwify.com/v1/sales/'+encodeURIComponent(id),{method:'GET',redirect:'error',signal:AbortSignal.timeout(8000),headers:{Authorization:'Bearer '+accessToken,'x-kiwify-account-id':accountId,Accept:'application/json'}});
  if(!res.ok)throw Error('Sale lookup failed');return res.json();
 };
}
