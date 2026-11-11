-- ============================================================
--  Maxim au Petit Paradis — Migration v6 (Correction Présences Nounous)
--  Copiez-collez dans : Supabase Dashboard → SQL Editor → Run
--
--  Ce script met à niveau la table nani_presences pour supporter
--  le format attendu par le code applicatif :
--  nani_id + month + days (jsonb stockant les présences de chaque jour)
-- ============================================================

-- 1. Si la table nani_presences existe avec l'ancien schéma (id, nani_id, date, status),
--    on la remplace par le schéma par mois (nani_id, month, days jsonb).
drop table if exists nani_presences cascade;

create table nani_presences (
  nani_id text  not null,
  month   text  not null,           -- format YYYY-MM (ex: 2026-11)
  days    jsonb not null default '{}',
  primary key (nani_id, month)
);

create index if not exists idx_nani_presences_month
  on nani_presences(month);

-- 2. Sécurité RLS
alter table nani_presences enable row level security;

drop policy if exists "allow_all_nani_presences" on nani_presences;
create policy "allow_all_nani_presences"
  on nani_presences
  for all
  using (true)
  with check (true);
