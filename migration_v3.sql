-- ============================================================
--  Maxim au Petit Paradis — Migration v3
--  Menus, Activités et Annonces (Espace Parent)
--
--  Copiez-collez dans : Supabase Dashboard → SQL Editor → Run
--  Peut être exécuté plusieurs fois sans erreur.
-- ============================================================

-- ── Menus de la semaine ─────────────────────────────────────
create table if not exists menus (
  id          text primary key,            -- "<lundi>_<jour>"
  week_start  date not null,               -- lundi de la semaine
  day         integer not null check (day between 0 and 4),  -- 0 = lundi … 4 = vendredi
  breakfast   text,
  lunch       text,
  snack       text,
  created_at  timestamptz default now(),
  unique (week_start, day)
);

-- ── Activités / planning ────────────────────────────────────
create table if not exists activities (
  id          text primary key,
  day         integer not null check (day between 0 and 4),
  start_time  text,
  end_time    text,
  title       text not null,
  section     text default 'Toutes',
  notes       text,
  created_at  timestamptz default now()
);

-- ── Annonces visibles dans l'Espace Parent (sans connexion) ─
create table if not exists announcements (
  id          text primary key,
  title       text not null,
  body        text,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

create index if not exists idx_menus_week on menus(week_start);
create index if not exists idx_announcements_date on announcements(date);

-- ── Row Level Security (même politique ouverte que le reste) ─
alter table menus         enable row level security;
alter table activities    enable row level security;
alter table announcements enable row level security;

drop policy if exists "allow_all_menus"         on menus;
drop policy if exists "allow_all_activities"    on activities;
drop policy if exists "allow_all_announcements" on announcements;

create policy "allow_all_menus"         on menus         for all using (true) with check (true);
create policy "allow_all_activities"    on activities    for all using (true) with check (true);
create policy "allow_all_announcements" on announcements for all using (true) with check (true);
