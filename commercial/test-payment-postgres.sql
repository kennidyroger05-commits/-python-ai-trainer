-- Disposable PostgreSQL only. Never execute against a hosted project.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
\ir schema.sql
\ir payment-schema.sql
begin;
insert into auth.users values
 ('11111111-1111-4111-8111-111111111111','a@example.test',now()),
 ('22222222-2222-4222-8222-222222222222','b@example.test',now()),
 ('33333333-3333-4333-8333-333333333333','c@example.test',null);
insert into public.trainer_payment_products values ('trainer-test',true);
create function pg_temp.check_eq(actual text,expected text,label text) returns void language plpgsql as $$begin if actual is distinct from expected then raise exception 'FAIL %: got %, expected %',label,actual,expected;end if;raise notice 'PASS %',label;end$$;
-- Trusted reconciliation writes, never client.
set local role service_role;
select pg_temp.check_eq(public.trainer_record_verified_order('one','trainer-test','a@example.test','paid',now()),'granted','paid grants access');
select pg_temp.check_eq(public.trainer_record_verified_order('one','trainer-test','a@example.test','paid',now()),'duplicate','duplicate delivery');
select pg_temp.check_eq(public.trainer_record_verified_order('two','trainer-test','a@example.test','paid',now()),'granted','second independent purchase');
select pg_temp.check_eq(public.trainer_record_verified_order('three','trainer-test','b@example.test','refunded',null),'terminal','refund before approval');
select pg_temp.check_eq(public.trainer_record_verified_order('three','trainer-test','b@example.test','paid',now()),'terminal','late approval cannot reactivate');
select pg_temp.check_eq(public.trainer_record_verified_order('four','trainer-test','c@example.test','paid',now()),'awaiting_account','unconfirmed email cannot grant');
select pg_temp.check_eq(public.trainer_record_verified_order('five','trainer-test','d@example.test','paid',now()-interval '400 days'),'expired','expired approval does not create grant');
reset role;
select pg_temp.check_eq(count(*)::text,'2','exactly two grants before refund') from public.trainer_entitlements;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select pg_temp.check_eq(count(*)::text,'2','A sees own grants') from public.trainer_entitlements;
select pg_temp.check_eq(public.trainer_save_progress(0,'{"mission":"one"}')::text,'1','A creates own progress');
select pg_temp.check_eq(public.trainer_save_progress(0,'{"mission":"stale"}')::text,null,'stale revision rejected');
select pg_temp.check_eq(public.trainer_save_progress(1,'{"mission":"two"}')::text,'2','A advances revision');
do $$begin
 begin perform public.trainer_save_progress(2,'{"bad":12}');raise exception 'unsafe value accepted';exception when raise_exception then if sqlerrm<>'invalid snapshot' then raise;end if;end;
 begin perform public.trainer_save_progress(2,'{"invalid key":"x"}');raise exception 'unsafe key accepted';exception when raise_exception then if sqlerrm<>'invalid snapshot' then raise;end if;end;
 begin perform public.trainer_save_progress(null,'{}');raise exception 'null revision accepted';exception when raise_exception then if sqlerrm<>'invalid snapshot' then raise;end if;end;
 begin perform public.trainer_record_verified_order('fake','trainer-test','a@example.test','paid',now());raise exception 'client can grant access';exception when insufficient_privilege then null;end;
 begin insert into public.trainer_entitlements(user_id,source,expires_at) values(auth.uid(),'fake',now());raise exception 'client can insert grant';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select pg_temp.check_eq(count(*)::text,'0','B cannot read A progress') from public.trainer_progress;
select pg_temp.check_eq(count(*)::text,'0','B cannot read A grants') from public.trainer_entitlements;
do $$begin
 begin perform public.trainer_save_progress(0,'{}');raise exception 'no-grant user can save';exception when raise_exception then if sqlerrm<>'access denied' then raise;end if;end;
end$$;
reset role;
set local role service_role;
select pg_temp.check_eq(public.trainer_record_verified_order('one','trainer-test','a@example.test','chargeback',null),'revoked','chargeback revokes one order');
select pg_temp.check_eq(public.trainer_record_verified_order('one','trainer-test','a@example.test','paid',now()),'terminal','replay after chargeback');
reset role;
select pg_temp.check_eq(count(*)::text,'1','independent purchase remains active') from public.trainer_entitlements where revoked_at is null;
update auth.users set email_confirmed_at=now() where email='c@example.test';
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select pg_temp.check_eq(public.trainer_claim_paid_orders()::text,'1','confirmed account claims order');
select pg_temp.check_eq(public.trainer_claim_paid_orders()::text,'0','claim idempotency');
reset role;
delete from auth.users where email='c@example.test';
insert into auth.users values('44444444-4444-4444-8444-444444444444','c@example.test',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select pg_temp.check_eq(public.trainer_claim_paid_orders()::text,'0','deleted account order cannot auto-transfer');
reset role;
select pg_temp.check_eq(has_table_privilege('anon','public.trainer_orders','SELECT')::text,'false','anon has no order read');
select pg_temp.check_eq(has_table_privilege('authenticated','public.trainer_orders','SELECT')::text,'false','client has no order read');
rollback;
\echo 'PostgreSQL isolated checks passed; hosted Supabase not tested.'
