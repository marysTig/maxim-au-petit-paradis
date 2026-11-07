-- ============================================================
--  Maxim au Petit Paradis — Migration v5
--  Copiez-collez dans : Supabase Dashboard → SQL Editor → Run
--
--  Ce script crée la table nani_payments pour suivre les
--  paiements versés aux nounous (montant, période, statut,
--  montant versé, remarque et date de paiement).
-- ============================================================


-- ============================================================
-- 1. TABLE NANI_PAYMENTS
-- ============================================================
create table if not exists nani_payments (
  id              text primary key,
  nani_id         text not null,                 -- référence à nanis.id

  -- Période concernée
  periode_type    text not null default 'mois',  -- 'jour' | 'semaine' | 'mois'
  periode_ref     text not null,                 -- ex. "2026-11" (mois), "2026-11-03" (jour/semaine)

  -- Montants
  montant_du      numeric(12,2) not null default 0,   -- montant à payer
  montant_verse   numeric(12,2) not null default 0,   -- montant réellement versé

  -- Statut
  statut          text not null default 'non_paye',   -- 'non_paye' | 'partiel' | 'paye'

  -- Méta
  remarque        text,                          -- remarque facultative
  date_paiement   text,                          -- YYYY-MM-DD, date du versement

  created_at      timestamptz default now()
);


-- ============================================================
-- 2. INDEX
-- ============================================================
create index if not exists idx_nani_payments_nani_id
  on nani_payments(nani_id);

create index if not exists idx_nani_payments_periode_ref
  on nani_payments(periode_ref);


-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
alter table nani_payments enable row level security;

drop policy if exists "allow_all_nani_payments" on nani_payments;
create policy "allow_all_nani_payments"
  on nani_payments
  for all
  using (true)
  with check (true);


-- ============================================================
-- 4. COLONNE ACTIVE SUR CHILDREN (STATUT ACTIF / INACTIF)
-- ============================================================
alter table children
  add column if not exists active boolean not null default true;


