-- ============================================================
--  Maxim au Petit Paradis — Migration v3
--  Copiez-collez dans : Supabase Dashboard → SQL Editor → Run
--
--  Ce script :
--    1. Supprime les tables menus et activities (devenues inutiles)
--    2. Crée les tables nanis, nani_presences, creche_sections,
--       finance_entries et s'assure que announcements est à jour
-- ============================================================


-- ============================================================
-- 0. SUPPRESSION des tables menus et activities
-- ============================================================
drop table if exists activities cascade;
drop table if exists menus      cascade;


-- ============================================================
-- 1. TABLE NANIS (personnel d'encadrement)
-- ============================================================
create table if not exists nanis (
  id          text primary key,
  first_name  text not null,
  last_name   text not null,
  phone       text,
  "group"     text,
  created_at  timestamptz default now()
);

-- ============================================================
-- 2. TABLE PRESENCES NANIS
--    Une ligne par nani x jour travaillé
--    status : 'present' | 'absent'
-- ============================================================
create table if not exists nani_presences (
  id         text primary key,
  nani_id    text not null references nanis(id) on delete cascade,
  date       text not null,     -- YYYY-MM-DD
  status     text not null check (status in ('present','absent')),
  created_at timestamptz default now(),
  unique (nani_id, date)
);

create index if not exists idx_nani_presences_nani_date
  on nani_presences(nani_id, date);


-- ============================================================
-- 3. TABLE SECTIONS & GROUPES
--    Une ligne par section ; les groupes sont un tableau JSON
--    Ex : [{"id":"g1","name":"Lapins"},{"id":"g2","name":"Poussins"}]
-- ============================================================
create table if not exists creche_sections (
  id         text primary key,
  name       text not null,
  groups     jsonb not null default '[]',
  created_at timestamptz default now()
);


-- ============================================================
-- 4. TABLE FINANCEMENT
--    Recettes, subventions et dépenses
-- ============================================================
create table if not exists finance_entries (
  id         text primary key,
  kind       text not null check (kind in ('recette','subvention','depense')),
  label      text not null,
  amount     numeric(12,2) not null default 0,
  date       text not null,     -- YYYY-MM-DD
  created_at timestamptz default now()
);


-- ============================================================
-- 5. TABLE ANNONCES (déjà existante — mise à jour sécurisée)
--    Ajoute la colonne published si absente
-- ============================================================
create table if not exists announcements (
  id         text primary key,
  title      text not null,
  body       text,
  date       text not null,
  published  boolean not null default false,
  created_at timestamptz default now()
);

alter table announcements
  add column if not exists published boolean not null default false;


-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
alter table nanis            enable row level security;
alter table nani_presences   enable row level security;
alter table creche_sections  enable row level security;
alter table finance_entries  enable row level security;
alter table announcements    enable row level security;

drop policy if exists "allow_all_nanis"           on nanis;
create policy "allow_all_nanis"           on nanis           for all using (true) with check (true);

drop policy if exists "allow_all_nani_presences"  on nani_presences;
create policy "allow_all_nani_presences"  on nani_presences  for all using (true) with check (true);

drop policy if exists "allow_all_creche_sections" on creche_sections;
create policy "allow_all_creche_sections" on creche_sections for all using (true) with check (true);

drop policy if exists "allow_all_finance_entries" on finance_entries;
create policy "allow_all_finance_entries" on finance_entries for all using (true) with check (true);

drop policy if exists "allow_all_announcements"   on announcements;
create policy "allow_all_announcements"   on announcements   for all using (true) with check (true);


-- ============================================================
-- 7. TABLE SETTINGS (parametres application, cle/valeur)
--    Exemples de cles :
--      parent_space_password_enabled  → "true" | "false"
--      parent_space_password          → le mot de passe en clair
-- ============================================================
create table if not exists settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz default now()
);

alter table settings enable row level security;

drop policy if exists "allow_all_settings" on settings;
create policy "allow_all_settings" on settings for all using (true) with check (true);

-- Valeurs initiales (mot de passe desactive par defaut)
insert into settings (key, value)
values
  ('parent_space_password_enabled', 'false'),
  ('parent_space_password',         '')
on conflict (key) do nothing;
