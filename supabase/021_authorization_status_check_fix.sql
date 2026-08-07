-- Gefahrstoffkataster: authorization_status-Werte mit der produktiven UI synchronisieren.
-- Bestehende historische/englische Werte werden konservativ auf die deutschen Produktivwerte abgebildet.

begin;

alter table public.hazardous_substances
  drop constraint if exists hazardous_substances_authorization_status_check;

update public.hazardous_substances
set authorization_status = case lower(trim(authorization_status))
  when 'nicht relevant' then 'nicht relevant'
  when 'not relevant' then 'nicht relevant'
  when 'not_relevant' then 'nicht relevant'
  when 'not applicable' then 'nicht relevant'
  when 'not_applicable' then 'nicht relevant'

  when 'zu prüfen' then 'zu prüfen'
  when 'zu pruefen' then 'zu prüfen'
  when 'to review' then 'zu prüfen'
  when 'review' then 'zu prüfen'
  when 'check' then 'zu prüfen'

  when 'zulassungspflichtig' then 'zulassungspflichtig'
  when 'authorization required' then 'zulassungspflichtig'
  when 'authorisation required' then 'zulassungspflichtig'
  when 'requires authorization' then 'zulassungspflichtig'
  when 'requires authorisation' then 'zulassungspflichtig'

  when 'beschränkt' then 'beschränkt'
  when 'beschraenkt' then 'beschränkt'
  when 'restricted' then 'beschränkt'

  when 'verwendung untersagt' then 'Verwendung untersagt'
  when 'prohibited' then 'Verwendung untersagt'
  when 'use prohibited' then 'Verwendung untersagt'
  when 'banned' then 'Verwendung untersagt'

  else 'zu prüfen'
end;

alter table public.hazardous_substances
  add constraint hazardous_substances_authorization_status_check
  check (authorization_status in (
    'nicht relevant',
    'zu prüfen',
    'zulassungspflichtig',
    'beschränkt',
    'Verwendung untersagt'
  ));

commit;
