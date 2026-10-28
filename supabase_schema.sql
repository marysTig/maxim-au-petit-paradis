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

-- ============================================================
-- MODULES PERSONNEL / MENUS / ACTIVITES
-- A executer dans le SQL Editor de Supabase
-- ============================================================

-- 5. TABLE PERSONNEL
create table if not exists staff (
  id         text primary key,
  name       text not null,
  role       text,
  phone      text,
  email      text,
  section    text default 'Toutes',
  hire_date  text,
  notes      text,
  created_at timestamptz default now()
);

-- 6. TABLE POINTAGE PERSONNEL
create table if not exists staff_attendance (
  id         text primary key,
  staff_id   text not null references staff(id) on delete cascade,
  date       text not null,
  arrival    text,
  departure  text,
  created_at timestamptz default now(),
  unique (staff_id, date)
);

-- 7. TABLE MENUS (un enregistrement par semaine et par jour, 0 = lundi ... 4 = vendredi)
create table if not exists menus (
  id         text primary key,
  week_start text not null,
  day        smallint not null check (day between 0 and 4),
  breakfast  text,
  lunch      text,
  snack      text,
  created_at timestamptz default now(),
  unique (week_start, day)
);

-- 8. TABLE ACTIVITES (planning hebdomadaire, 0 = lundi ... 4 = vendredi)
create table if not exists activities (
  id         text primary key,
  day        smallint not null check (day between 0 and 4),
  start_time text,
  end_time   text,
  title      text not null,
  section    text default 'Toutes',
  notes      text,
  created_at timestamptz default now()
);

create index if not exists idx_staff_attendance_staff_date on staff_attendance(staff_id, date);

alter table staff            enable row level security;
alter table staff_attendance enable row level security;
alter table menus            enable row level security;
alter table activities       enable row level security;

create policy "allow_all_staff"            on staff            for all using (true) with check (true);
create policy "allow_all_staff_attendance" on staff_attendance for all using (true) with check (true);
create policy "allow_all_menus"            on menus            for all using (true) with check (true);
create policy "allow_all_activities"       on activities       for all using (true) with check (true);
