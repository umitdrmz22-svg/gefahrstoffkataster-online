-- EHS Management Studio: gemeinsame, organisationsbezogene Projektspeicherung
-- Voraussetzung: 001_core_and_kataster.sql wurde im gemeinsamen Supabase-Projekt ausgeführt.

begin;

create table if not exists public.app_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  app_key text not null,
  record_key text not null default 'current',
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,app_key,owner_user_id,record_key)
);

create index if not exists app_records_org_app_idx
  on public.app_records(organization_id,app_key,updated_at desc);
create index if not exists app_records_owner_idx
  on public.app_records(owner_user_id,updated_at desc);

create or replace function public.app_records_set_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin
  new.updated_at=now();
  new.updated_by=auth.uid();
  return new;
end; $$;

drop trigger if exists app_records_updated_at on public.app_records;
create trigger app_records_updated_at
before update on public.app_records
for each row execute function public.app_records_set_updated_at();

alter table public.app_records enable row level security;

drop policy if exists app_records_select_member on public.app_records;
create policy app_records_select_member on public.app_records
for select to authenticated
using(public.is_org_member(organization_id));

drop policy if exists app_records_insert_owner on public.app_records;
create policy app_records_insert_owner on public.app_records
for insert to authenticated
with check(
  owner_user_id=auth.uid()
  and updated_by=auth.uid()
  and public.is_org_member(organization_id)
);

drop policy if exists app_records_update_owner_or_admin on public.app_records;
create policy app_records_update_owner_or_admin on public.app_records
for update to authenticated
using(
  owner_user_id=auth.uid()
  or public.has_org_role(organization_id,array['owner','admin'])
)
with check(
  public.is_org_member(organization_id)
  and (
    owner_user_id=auth.uid()
    or public.has_org_role(organization_id,array['owner','admin'])
  )
);

drop policy if exists app_records_delete_owner_or_admin on public.app_records;
create policy app_records_delete_owner_or_admin on public.app_records
for delete to authenticated
using(
  owner_user_id=auth.uid()
  or public.has_org_role(organization_id,array['owner','admin'])
);

revoke all on public.app_records from anon;
grant select,insert,update,delete on public.app_records to authenticated;

commit;
