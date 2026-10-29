-- ============================================================
--  Maxim au Petit Paradis — Migration v2
--  Ajout des nouveaux champs enfant (identification + famille)
--
--  Copiez-collez dans : Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Identification ──────────────────────────────────────────
alter table children
  add column if not exists gender      text,
  add column if not exists nationality text,
  add column if not exists "group"     text;

-- ── Données mère ────────────────────────────────────────────
alter table children
  add column if not exists mother_name       text,
  add column if not exists mother_profession text,
  add column if not exists mother_phone      text;

-- ── Données père ────────────────────────────────────────────
alter table children
  add column if not exists father_name       text,
  add column if not exists father_profession text,
  add column if not exists father_phone      text;

-- ── Situation familiale ──────────────────────────────────────
alter table children
  add column if not exists siblings_count    integer not null default 0,
  add column if not exists family_situation  text;

-- ── Personnes autorisées (JSON) ─────────────────────────────
-- Format : [{"name":"Dupont","firstName":"Paul","phone":"06..."}]
alter table children
  add column if not exists authorized_persons jsonb not null default '[]';

-- ── Index utiles ─────────────────────────────────────────────
create index if not exists idx_children_group   on children("group");
create index if not exists idx_children_section on children(section);

-- ── Annonces : champ published ────────────────────────────────
alter table announcements
  add column if not exists published boolean not null default false;
