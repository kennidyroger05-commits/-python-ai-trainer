-- Optional staging-only schema, after schema.sql. Never expose trainer_private in Data API.
begin;
create schema if not exists trainer_private;
revoke all on schema trainer_private from public,anon,authenticated;
grant usage on schema trainer_private to authenticated;
create table trainer_private.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table trainer_private.admin_audit(id bigint generated always as identity primary key,actor uuid not null,target uuid not null,action text not null check(action in ('grant','revoke')),days integer,created_at timestamptz not null default now());
alter table trainer_private.admins enable row level security;
alter table trainer_private.admin_audit enable row level security;
revoke all on trainer_private.admins,trainer_private.admin_audit from public,anon,authenticated;
create function trainer_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from trainer_private.admins a join auth.users u on u.id=a.user_id where a.user_id=auth.uid() and u.email_confirmed_at is not null)
$$;
create function trainer_private.list_students(p_offset integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not trainer_private.is_admin() then raise exception 'access denied' using errcode='42501';end if;
 if p_offset is null or p_offset<0 or p_offset>100000 then raise exception 'invalid offset';end if;
 select jsonb_build_object('total',(select count(*) from auth.users),
 'active',(select count(distinct user_id) from public.trainer_entitlements where revoked_at is null and expires_at>now()),
 'backups',(select count(*) from public.trainer_progress),
 'students',coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb)) into result
 from (select u.id,u.email,u.email_confirmed_at is not null as confirmed,
 exists(select 1 from public.trainer_entitlements e where e.user_id=u.id and e.revoked_at is null and e.expires_at>now()) as active,
 (select max(expires_at) from public.trainer_entitlements e where e.user_id=u.id and e.source='pilot-admin' and e.revoked_at is null and e.expires_at>now()) as pilot_until,
 (select p.updated_at from public.trainer_progress p where p.user_id=u.id) as last_backup
 from auth.users u order by u.id limit 50 offset p_offset) s;
 return result;
end;$$;
create function trainer_private.change_pilot(p_user uuid,p_days integer,p_revoke boolean) returns text language plpgsql security definer set search_path='' as $$
begin
 if not trainer_private.is_admin() then raise exception 'access denied' using errcode='42501';end if;
 if p_user is null or p_user=auth.uid() or p_revoke is null then raise exception 'invalid student';end if;
 if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'unconfirmed student';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text,18));
 if not p_revoke and (p_days is null or p_days<1 or p_days>30) then raise exception 'invalid days';end if;
 update public.trainer_entitlements set revoked_at=now() where user_id=p_user and source='pilot-admin' and revoked_at is null;
 if not p_revoke then insert into public.trainer_entitlements(user_id,source,expires_at) values(p_user,'pilot-admin',now()+pg_catalog.make_interval(days=>p_days));end if;
 insert into trainer_private.admin_audit(actor,target,action,days) values(auth.uid(),p_user,case when p_revoke then 'revoke' else 'grant' end,case when p_revoke then null else p_days end);
 return case when p_revoke then 'revoked' else 'granted' end;
end;$$;
revoke all on function trainer_private.is_admin(),trainer_private.list_students(integer),trainer_private.change_pilot(uuid,integer,boolean) from public,anon,authenticated;
grant execute on function trainer_private.is_admin(),trainer_private.list_students(integer),trainer_private.change_pilot(uuid,integer,boolean) to authenticated;
-- Exposed wrappers execute as the caller; privileged implementation stays in private schema.
create function public.trainer_admin_check() returns boolean language sql stable security invoker set search_path='' as $$select trainer_private.is_admin()$$;
create function public.trainer_admin_list(p_offset integer) returns jsonb language sql security invoker set search_path='' as $$select trainer_private.list_students(p_offset)$$;
create function public.trainer_admin_grant(p_user uuid,p_days integer) returns text language sql security invoker set search_path='' as $$select trainer_private.change_pilot(p_user,p_days,false)$$;
create function public.trainer_admin_revoke(p_user uuid) returns text language sql security invoker set search_path='' as $$select trainer_private.change_pilot(p_user,null,true)$$;
revoke all on function public.trainer_admin_check(),public.trainer_admin_list(integer),public.trainer_admin_grant(uuid,integer),public.trainer_admin_revoke(uuid) from public,anon,authenticated;
grant execute on function public.trainer_admin_check(),public.trainer_admin_list(integer),public.trainer_admin_grant(uuid,integer),public.trainer_admin_revoke(uuid) to authenticated;
commit;
-- Bootstrap only in the SQL editor after checking the confirmed account UUID:
-- insert into trainer_private.admins(user_id) values ('<confirmed-owner-uuid>');
