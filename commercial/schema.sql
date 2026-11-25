-- Apply only to a NEW staging Supabase project. Never reuse operational databases.
begin;
create table public.trainer_entitlements (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source text not null check (length(source) between 1 and 120),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create index trainer_entitlements_user_idx on public.trainer_entitlements(user_id);
alter table public.trainer_entitlements enable row level security;
revoke all on public.trainer_entitlements from public, anon, authenticated;
grant select on public.trainer_entitlements to authenticated;
create policy trainer_own_grants on public.trainer_entitlements for select to authenticated using (auth.uid()=user_id);
create table public.trainer_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null check (revision>0),
 snapshot jsonb not null check (jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=262144),
 updated_at timestamptz not null default now()
);
alter table public.trainer_progress enable row level security;
revoke all on public.trainer_progress from public,anon,authenticated;
grant select on public.trainer_progress to authenticated;
create policy trainer_own_progress on public.trainer_progress for select to authenticated using (auth.uid()=user_id);
create function public.trainer_save_progress(expected_revision bigint,new_snapshot jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result bigint;
begin
 if uid is null or expected_revision is null or expected_revision<0 or new_snapshot is null or jsonb_typeof(new_snapshot)<>'object' or octet_length(new_snapshot::text)>262144 then raise exception 'invalid snapshot'; end if;
 if (select count(*) from jsonb_each(new_snapshot))>100 or exists(select 1 from jsonb_each(new_snapshot) as e(key,value) where e.key !~ '^[A-Za-z0-9_.-]{1,120}$' or jsonb_typeof(e.value)<>'string') then raise exception 'invalid snapshot';end if;
 if not exists(select 1 from public.trainer_entitlements where user_id=uid and revoked_at is null and expires_at>now()) then raise exception 'access denied'; end if;
 if expected_revision=0 then
  insert into public.trainer_progress(user_id,revision,snapshot) values(uid,1,new_snapshot) on conflict do nothing returning revision into result;
 else
  update public.trainer_progress set revision=revision+1,snapshot=new_snapshot,updated_at=now() where user_id=uid and revision=expected_revision returning revision into result;
 end if;
 return result;
end; $$;
revoke all on function public.trainer_save_progress(bigint,jsonb) from public,anon,authenticated;
grant execute on function public.trainer_save_progress(bigint,jsonb) to authenticated;
commit;
-- Manual staging grants: use verified auth.users UUID, never a client-provided email.
-- insert into public.trainer_entitlements(user_id,source,expires_at) values ('<uuid>','staging-test',now()+interval '7 days');
-- update public.trainer_entitlements set revoked_at=now() where id='<grant uuid>';
