\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
\ir schema.sql
\ir admin-schema.sql
begin;
insert into auth.users values ('11111111-1111-4111-8111-111111111111','owner@example.test',now()),('22222222-2222-4222-8222-222222222222','student@example.test',now()),('33333333-3333-4333-8333-333333333333','pending@example.test',null);
insert into trainer_private.admins values ('11111111-1111-4111-8111-111111111111');
insert into public.trainer_entitlements(user_id,source,expires_at) values('22222222-2222-4222-8222-222222222222','kiwify:test',now()+interval '1 year');
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$begin
 if public.trainer_admin_check() then raise exception 'student is admin';end if;
 begin perform public.trainer_admin_list(0);raise exception 'student listed accounts';exception when insufficient_privilege then null;end;
 begin perform public.trainer_admin_grant(auth.uid(),7);raise exception 'student granted access';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$begin
 if not public.trainer_admin_check() then raise exception 'owner denied';end if;
 if public.trainer_admin_list(0)->>'total'<>'3' then raise exception 'invalid total';end if;
 if public.trainer_admin_grant('22222222-2222-4222-8222-222222222222',7)<>'granted' then raise exception 'grant failed';end if;
 if public.trainer_admin_revoke('22222222-2222-4222-8222-222222222222')<>'revoked' then raise exception 'revoke failed';end if;
 begin perform public.trainer_admin_grant('33333333-3333-4333-8333-333333333333',7);raise exception 'unconfirmed accepted';exception when raise_exception then if sqlerrm<>'unconfirmed student' then raise;end if;end;
end$$;
reset role;
do $$begin
 if (select count(*) from public.trainer_entitlements where revoked_at is null)<>1 then raise exception 'paid grant affected';end if;
 if (select count(*) from trainer_private.admin_audit)<>2 then raise exception 'audit missing';end if;
end$$;
rollback;
\echo 'Admin SQL checks passed; mocked auth schema only.'
