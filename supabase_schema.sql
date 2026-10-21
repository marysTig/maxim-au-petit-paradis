-- ============================================================
--  Maxim au Petit Paradis — Supabase Schema
--  Copiez-collez ce script dans l'éditeur SQL de Supabase
--  Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. TABLE ENFANTS
create table if not exists children (
  id          text primary key,
  first_name  text not null,
  last_name   text not null,
  birth_date  date,
  section     text not null default 'Non défini',
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

-- 3. TABLE POINTAGE (PRÉSENCES)
create table if not exists attendance (
  id         text primary key,
  child_id   text not null references children(id) on delete cascade,
  date       date not null,
  arrival    text,
  departure  text,
  created_at timestamptz default now(),
  unique (child_id, date)
);

-- 4. TABLE PAIEMENTS
create table if not exists payments (
  id         text primary key,
  child_id   text not null references children(id) on delete cascade,
  month      text not null,
  amount     numeric(10,2) not null default 0,
  status     text not null default 'pending' check (status in ('paid','pending','late')),
  paid_at    text,
  created_at timestamptz default now()
);

-- Index utiles
create index if not exists idx_attendance_child_date on attendance(child_id, date);
create index if not exists idx_payments_child_month  on payments(child_id, month);

-- Row Level Security
alter table children   enable row level security;
alter table parents    enable row level security;
alter table attendance enable row level security;
alter table payments   enable row level security;

-- Policies open pour la cle anon (a securiser avec auth si besoin)
create policy "allow_all_children"   on children   for all using (true) with check (true);
create policy "allow_all_parents"    on parents     for all using (true) with check (true);
create policy "allow_all_attendance" on attendance  for all using (true) with check (true);
create policy "allow_all_payments"   on payments    for all using (true) with check (true);
