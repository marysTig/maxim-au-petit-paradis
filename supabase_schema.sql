-- ============================================================
--  Maxim au Petit Paradis — Supabase Schema (v2)
--  Copiez-collez ce script dans l'éditeur SQL de Supabase
--  Dashboard → SQL Editor → New query → Run
--
--  ⚠️  Si la base existe déjà, exécutez migration_v2.sql
--      à la place pour ne pas écraser les données.
-- ============================================================

-- 1. TABLE ENFANTS
create table if not exists children (
  id          text primary key,

  -- Identification
  first_name  text not null,
  last_name   text not null,
  birth_date  date,
  gender      text,                        -- 'Garçon' | 'Fille'
  nationality text,
  section     text not null default 'Non défini',
  "group"     text,

  -- Données famille — Mère
  mother_name       text,
  mother_profession text,
  mother_phone      text,

  -- Données famille — Père
  father_name       text,
  father_profession text,
  father_phone      text,

  -- Situation familiale
  siblings_count   integer not null default 0,
  family_situation text,                   -- 'Marié(e)' | 'Divorcé(e)' | 'Veuf(ve)'

  -- Personnes autorisées à récupérer l'enfant
  -- Format JSON : [{"name":"Dupont","firstName":"Paul","phone":"06..."}]
  authorized_persons jsonb not null default '[]',

  -- Extra
  parent_ids  text[] not null default '{}',
  allergies   text,
  notes       text,

  created_at  timestamptz default now()
);

-- 2. TABLE PARENTS
create table if not exists parents (
  id         text primary key,
  name       text not null,
  phone      text,
  email      text,
  child_ids  text[] not null default '{}',
  created_at timestamptz default now()
);

-- Index utiles
create index if not exists idx_children_section on children(section);
create index if not exists idx_children_group   on children("group");

-- Row Level Security
alter table children enable row level security;
alter table parents  enable row level security;

-- Policies open pour la clé anon (à sécuriser avec auth si besoin)
create policy "allow_all_children" on children for all using (true) with check (true);
create policy "allow_all_parents"  on parents  for all using (true) with check (true);
