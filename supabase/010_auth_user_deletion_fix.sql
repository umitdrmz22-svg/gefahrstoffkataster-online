-- EHS Management Studio: Benutzerlöschung ohne Verlust betrieblicher Daten
-- Diese Migration einmal nach den Modul-Migrationen ausführen.
-- Benutzerbezogene Urheberfelder werden bei einer Auth-Benutzerlöschung auf NULL gesetzt.
-- Firmen, Gefahrstoffe, Dokumente und Betriebsanweisungen bleiben erhalten.

begin;

alter table if exists public.organizations
  alter column created_by drop not null;
alter table if exists public.organizations
  drop constraint if exists organizations_created_by_fkey;
alter table if exists public.organizations
  add constraint organizations_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table if exists public.hazardous_substances
  alter column created_by drop not null,
  alter column updated_by drop not null;
alter table if exists public.hazardous_substances
  drop constraint if exists hazardous_substances_created_by_fkey;
alter table if exists public.hazardous_substances
  add constraint hazardous_substances_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;
alter table if exists public.hazardous_substances
  drop constraint if exists hazardous_substances_updated_by_fkey;
alter table if exists public.hazardous_substances
  add constraint hazardous_substances_updated_by_fkey
  foreign key (updated_by) references auth.users(id) on delete set null;

alter table if exists public.documents
  alter column creator_user_id drop not null;
alter table if exists public.documents
  drop constraint if exists documents_document_owner_fkey;
alter table if exists public.documents
  add constraint documents_document_owner_fkey
  foreign key (document_owner) references auth.users(id) on delete set null;
alter table if exists public.documents
  drop constraint if exists documents_creator_user_id_fkey;
alter table if exists public.documents
  add constraint documents_creator_user_id_fkey
  foreign key (creator_user_id) references auth.users(id) on delete set null;
alter table if exists public.documents
  drop constraint if exists documents_reviewer_user_id_fkey;
alter table if exists public.documents
  add constraint documents_reviewer_user_id_fkey
  foreign key (reviewer_user_id) references auth.users(id) on delete set null;
alter table if exists public.documents
  drop constraint if exists documents_approver_user_id_fkey;
alter table if exists public.documents
  add constraint documents_approver_user_id_fkey
  foreign key (approver_user_id) references auth.users(id) on delete set null;

alter table if exists public.document_versions
  alter column created_by drop not null;
alter table if exists public.document_versions
  drop constraint if exists document_versions_created_by_fkey;
alter table if exists public.document_versions
  add constraint document_versions_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table if exists public.document_events
  drop constraint if exists document_events_actor_user_id_fkey;
alter table if exists public.document_events
  add constraint document_events_actor_user_id_fkey
  foreign key (actor_user_id) references auth.users(id) on delete set null;

alter table if exists public.operating_instructions
  alter column created_by drop not null,
  alter column updated_by drop not null;
alter table if exists public.operating_instructions
  drop constraint if exists operating_instructions_created_by_fkey;
alter table if exists public.operating_instructions
  add constraint operating_instructions_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;
alter table if exists public.operating_instructions
  drop constraint if exists operating_instructions_updated_by_fkey;
alter table if exists public.operating_instructions
  add constraint operating_instructions_updated_by_fkey
  foreign key (updated_by) references auth.users(id) on delete set null;

commit;
