-- EHS Management Studio: gemeinsames Benutzer-/Mandantenmodell und Online-Gefahrstoffkataster
-- Im Supabase SQL Editor einmal vollständig ausführen.
-- Die Migration ist mit dem Benutzer-/Mandantenmodell von BA Studio kompatibel.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations add column if not exists updated_at timestamptz not null default now();

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('owner','admin','ersteller','pruefer','freigeber','leser')),
  status text not null default 'active' check(status in ('active','invited','disabled')),
  created_at timestamptz not null default now(),
  primary key(organization_id,user_id)
);

create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id=org and m.user_id=auth.uid() and m.status='active'
  );
$$;

create or replace function public.has_org_role(org uuid,roles text[])
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id=org and m.user_id=auth.uid() and m.status='active' and m.role=any(roles)
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare org_id uuid; company text;
begin
  insert into public.profiles(id,full_name)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict(id) do nothing;

  company:=nullif(trim(coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    ''
  )), '');
  if company is null then company:='Meine Organisation'; end if;

  insert into public.organizations(name,created_by)
  values(company,new.id)
  returning id into org_id;

  insert into public.organization_members(organization_id,user_id,role,status)
  values(org_id,new.id,'owner','active');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists profiles_self_or_same_org on public.profiles;
create policy profiles_self_or_same_org on public.profiles for select to authenticated using(
  id=auth.uid() or exists(
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id=mine.organization_id
    where mine.user_id=auth.uid() and mine.status='active'
      and theirs.user_id=profiles.id and theirs.status='active'
  )
);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
using(id=auth.uid()) with check(id=auth.uid());

drop policy if exists organizations_member_select on public.organizations;
create policy organizations_member_select on public.organizations for select to authenticated
using(public.is_org_member(id));
drop policy if exists organizations_admin_update on public.organizations;
create policy organizations_admin_update on public.organizations for update to authenticated
using(public.has_org_role(id,array['owner','admin']))
with check(public.has_org_role(id,array['owner','admin']));

drop policy if exists organization_members_member_select on public.organization_members;
create policy organization_members_member_select on public.organization_members for select to authenticated
using(public.is_org_member(organization_id));
drop policy if exists organization_members_admin_manage on public.organization_members;
create policy organization_members_admin_manage on public.organization_members for all to authenticated
using(public.has_org_role(organization_id,array['owner','admin']))
with check(public.has_org_role(organization_id,array['owner','admin']));

create table if not exists public.hazardous_substances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_number text not null,
  product_name text not null,
  manufacturer text not null default '',
  product_code text not null default '',
  intended_use text not null default '',
  work_area_description text not null,
  classification text not null,
  dangerous_properties text not null default '',
  signal_word text not null default '' check(signal_word in ('','Gefahr','Achtung')),
  pictograms text[] not null default '{}',
  h_statements text[] not null default '{}',
  euh_statements text[] not null default '{}',
  quantity_range text not null,
  storage_quantity text not null default '',
  sds_reference text not null,
  sds_date date,
  sds_language text not null default 'Deutsch',
  sds_verified_at date,
  sds_review_months integer not null default 24 check(sds_review_months between 1 and 120),
  risk_assessment_status text not null default 'offen' check(risk_assessment_status in ('offen','in Bearbeitung','aktuell','Überarbeitung fällig')),
  operating_instruction_status text not null default 'offen' check(operating_instruction_status in ('offen','Entwurf','in Prüfung','freigegeben','nicht erforderlich')),
  substitution_status text not null default 'offen' check(substitution_status in ('offen','in Prüfung','Ersatz möglich','kein geeigneter Ersatz','nicht erforderlich')),
  substitution_review_date date,
  cmr_category text not null default '',
  exposure_register_required boolean not null default false,
  authorization_status text not null default 'nicht relevant' check(authorization_status in ('nicht relevant','zu prüfen','zulassungspflichtig','beschränkt','Verwendung untersagt')),
  status text not null default 'active' check(status in ('active','blocked','archived')),
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,inventory_number)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
drop trigger if exists hazardous_substances_updated_at on public.hazardous_substances;
create trigger hazardous_substances_updated_at before update on public.hazardous_substances
for each row execute function public.set_updated_at();

alter table public.hazardous_substances enable row level security;
drop policy if exists substances_select_member on public.hazardous_substances;
create policy substances_select_member on public.hazardous_substances for select to authenticated
using(public.is_org_member(organization_id));
drop policy if exists substances_insert_editor on public.hazardous_substances;
create policy substances_insert_editor on public.hazardous_substances for insert to authenticated
with check(public.has_org_role(organization_id,array['owner','admin','ersteller']));
drop policy if exists substances_update_editor on public.hazardous_substances;
create policy substances_update_editor on public.hazardous_substances for update to authenticated
using(public.has_org_role(organization_id,array['owner','admin','ersteller','pruefer']))
with check(public.has_org_role(organization_id,array['owner','admin','ersteller','pruefer']));
drop policy if exists substances_delete_admin on public.hazardous_substances;
create policy substances_delete_admin on public.hazardous_substances for delete to authenticated
using(public.has_org_role(organization_id,array['owner','admin']));

grant usage on schema public to authenticated;
grant select,update on public.profiles to authenticated;
grant select,update on public.organizations to authenticated;
grant select,insert,update,delete on public.organization_members to authenticated;
grant select,insert,update,delete on public.hazardous_substances to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid,text[]) to authenticated;
