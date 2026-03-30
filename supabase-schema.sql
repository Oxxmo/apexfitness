-- APEX — Schéma Supabase
-- Exécute ce script dans l'éditeur SQL de Supabase

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES — Profils utilisateurs
-- ============================================
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  pseudo text unique not null,
  age integer,
  weight numeric(5,1),
  height integer,
  goal text default 'recomposition',
  sessions_per_week integer default 3,
  week_number integer default 1,
  total_sessions integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- PROGRAMS — Programmes hebdomadaires
-- ============================================
create table if not exists programs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  week_number integer default 1,
  sessions_count integer,
  split_name text,
  sessions_data jsonb default '[]',
  diet_data jsonb default '{}',
  active boolean default true,
  created_at timestamptz default now()
);

-- Index pour récupérer le programme actif d'un user
create index if not exists idx_programs_user_active on programs(user_id, active);

-- ============================================
-- SESSION_LOGS — Séances complétées
-- ============================================
create table if not exists session_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  session_name text,
  exercises_data jsonb default '[]',
  week_number integer default 1,
  duration_minutes integer,
  completed_at timestamptz default now()
);

create index if not exists idx_session_logs_user on session_logs(user_id, completed_at desc);

-- ============================================
-- MEAL_SCANS — Analyses de repas IA
-- ============================================
create table if not exists meal_scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  plat_nom text,
  calories integer,
  proteins_g integer,
  carbs_g integer,
  fats_g integer,
  confidence text,
  details text,
  conseil text,
  scanned_at timestamptz default now()
);

create index if not exists idx_meal_scans_user on meal_scans(user_id, scanned_at desc);

-- ============================================
-- CHAT_HISTORY — Historique coach IA
-- ============================================
create table if not exists chat_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references profiles(id) on delete cascade,
  messages jsonb default '[]',
  updated_at timestamptz default now()
);

-- ============================================
-- DÉSACTIVER RLS (auth par pseudo, pas Supabase Auth)
-- ============================================
alter table profiles disable row level security;
alter table programs disable row level security;
alter table session_logs disable row level security;
alter table meal_scans disable row level security;
alter table chat_history disable row level security;

-- ============================================
-- FONCTION auto-update updated_at
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger chat_history_updated_at
  before update on chat_history
  for each row execute function update_updated_at();
