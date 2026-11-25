-- Optional staging migration, after schema.sql. No live webhook is exposed.
-- Only a trusted reconciliation process may call trainer_record_verified_order.
-- Do not use the service-role key in a browser or the learning Worker.
begin;
create table public.trainer_payment_products (
 product_id text primary key check(length(product_id) between 1 and 100),
 enabled boolean not null default false
);
create table public.trainer_orders (
 order_id text primary key check(length(order_id) between 1 and 100),
 product_id text not null references public.trainer_payment_products(product_id),
 customer_email text not null check(customer_email=lower(btrim(customer_email)) and length(customer_email) between 3 and 254),
 status text not null check(status in ('paid','refunded','chargeback')),
 paid_at timestamptz,
 user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(status<>'paid' or paid_at is not null)
);
alter table public.trainer_orders enable row level security;
alter table public.trainer_payment_products enable row level security;
revoke all on public.trainer_orders,public.trainer_payment_products from public,anon,authenticated;
create unique index trainer_order_grant_unique on public.trainer_entitlements(source) where source like 'kiwify:%';
create function public.trainer_record_verified_order(p_order text,p_product text,p_email text,p_status text,p_paid_at timestamptz)
returns text language plpgsql security definer set search_path='' as $$
declare prior public.trainer_orders%rowtype;
 mail text:=lower(btrim(p_email)); uid uuid;
begin
 if p_order is null or length(p_order) not between 1 and 100 or p_product is null or mail is null or length(mail) not between 3 and 254 or position('@' in mail)<2 or p_status is null or p_status not in ('paid','refunded','chargeback') then raise exception 'invalid order';end if;
 if p_status='paid' and (p_paid_at is null or p_paid_at>now()+interval '5 minutes') then raise exception 'invalid approval date';end if;
 -- Serialize all deliveries for the same order, including refund arriving first.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_order,0));
 select * into prior from public.trainer_orders where order_id=p_order for update;
 if found then
  if prior.product_id<>p_product or prior.customer_email<>mail then raise exception 'order identity mismatch';end if;
  if prior.status in ('refunded','chargeback') then return 'terminal';end if;
  if p_status='paid' then return 'duplicate';end if;
  update public.trainer_orders set status=p_status,updated_at=now() where order_id=p_order;
  update public.trainer_entitlements set revoked_at=coalesce(revoked_at,now()) where source='kiwify:'||p_order;
  return 'revoked';
 end if;
 if not exists(select 1 from public.trainer_payment_products where product_id=p_product and enabled) then raise exception 'unknown product';end if;
 insert into public.trainer_orders(order_id,product_id,customer_email,status,paid_at)
 values(p_order,p_product,mail,p_status,p_paid_at);
 if p_status<>'paid' then return 'terminal';end if;
 -- Grant only after binding to a confirmed email account. Avoid a grant to an ambiguous identity.
 select case when count(*)=1 then min(id::text)::uuid else null end into uid
 from auth.users where lower(email)=mail and email_confirmed_at is not null;
 if uid is null then return 'awaiting_account';end if;
 update public.trainer_orders set user_id=uid where order_id=p_order;
 insert into public.trainer_entitlements(user_id,source,expires_at)
 values(uid,'kiwify:'||p_order,p_paid_at+interval '365 days');
 return 'granted';
end; $$;
revoke all on function public.trainer_record_verified_order(text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.trainer_record_verified_order(text,text,text,text,timestamptz) to service_role;
-- Confirmed customers may claim only their own paid, unbound orders.
create function public.trainer_claim_paid_orders()
returns integer language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();mail text;rec public.trainer_orders%rowtype;n integer:=0;
begin
 select lower(email) into mail from auth.users where id=uid and email_confirmed_at is not null;
 if mail is null then return 0;end if;
 if (select count(*) from auth.users where lower(email)=mail and email_confirmed_at is not null)<>1 then return 0;end if;
 for rec in select * from public.trainer_orders where customer_email=mail and user_id is null and status='paid' and paid_at+interval '365 days'>now() for update loop
  update public.trainer_orders set user_id=uid,updated_at=now() where order_id=rec.order_id;
  insert into public.trainer_entitlements(user_id,source,expires_at) values(uid,'kiwify:'||rec.order_id,rec.paid_at+interval '365 days');
  n:=n+1;
 end loop;
 return n;
end; $$;
revoke all on function public.trainer_claim_paid_orders() from public,anon,authenticated;
grant execute on function public.trainer_claim_paid_orders() to authenticated;
commit;
-- Important: this schema alone does not validate a Kiwify signature or authorize sales.
