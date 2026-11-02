-- ============================================================
--  Maxim au Petit Paradis — Migration v4
--  Copiez-collez dans : Supabase Dashboard → SQL Editor → Run
--
--  Ce script crée la table pre_inscriptions pour gérer les
--  enfants pré-inscrits séparément de la liste "Enfants".
--  Ces données sont isolées : elles n'apparaissent pas dans
--  les pages Paiements, Financement ni Rapports.
-- ============================================================


-- ============================================================
-- 1. TABLE PRE_INSCRIPTIONS
-- ============================================================
create table if not exists pre_inscriptions (
  id              text primary key,
  last_name       text not null,
  first_name      text not null,
  birth_date      text,                    -- YYYY-MM-DD, nullable
  annee_scolaire  text not null,           -- ex. "2026-2027"
  montant         numeric(12,2) not null default 0,
  date_paiement   text not null,           -- YYYY-MM-DD
  created_at      timestamptz default now()
);


-- ============================================================
-- 2. INDEX pour accélérer les filtres par année scolaire
-- ============================================================
create index if not exists idx_pre_inscriptions_annee
  on pre_inscriptions(annee_scolaire);


-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
alter table pre_inscriptions enable row level security;

drop policy if exists "allow_all_pre_inscriptions" on pre_inscriptions;
create policy "allow_all_pre_inscriptions"
  on pre_inscriptions
  for all
  using (true)
  with check (true);
