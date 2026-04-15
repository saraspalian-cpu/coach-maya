-- Coach Maya — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database.

-- ─── Parents (auth users) ───
create table if not exists parents (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

-- ─── Children ───
create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  name text not null,
  age int default 12,
  avatar_url text,
  created_at timestamptz default now()
);

create index idx_children_parent on children(parent_id);

-- ─── Profiles (per child) ───
create table if not exists profiles (
  child_id uuid primary key references children(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- ─── Daily State (per child, per day) ───
create table if not exists daily_state (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  date date not null default current_date,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(child_id, date)
);

create index idx_daily_state_child_date on daily_state(child_id, date);

-- ─── Schedules (per child) ───
create table if not exists schedules (
  child_id uuid primary key references children(id) on delete cascade,
  tasks jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- ─── Data Store (generic key-value per child — replaces all localStorage keys) ───
create table if not exists data_store (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  key text not null,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(child_id, key)
);

create index idx_data_store_child_key on data_store(child_id, key);

-- ─── Push Subscriptions ───
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade,
  child_id uuid references children(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz default now(),
  unique(endpoint)
);

-- ─── Row Level Security ───
alter table parents enable row level security;
alter table children enable row level security;
alter table profiles enable row level security;
alter table daily_state enable row level security;
alter table schedules enable row level security;
alter table data_store enable row level security;
alter table push_subscriptions enable row level security;

-- Parents can only see their own data
create policy "parents_own" on parents for all using (id = auth.uid());

-- Children belong to parent
create policy "children_own" on children for all using (parent_id = auth.uid());

-- Profiles accessible via parent's children
create policy "profiles_own" on profiles for all
  using (child_id in (select id from children where parent_id = auth.uid()));

-- Daily state accessible via parent's children
create policy "daily_state_own" on daily_state for all
  using (child_id in (select id from children where parent_id = auth.uid()));

-- Schedules accessible via parent's children
create policy "schedules_own" on schedules for all
  using (child_id in (select id from children where parent_id = auth.uid()));

-- Data store accessible via parent's children
create policy "data_store_own" on data_store for all
  using (child_id in (select id from children where parent_id = auth.uid()));

-- Push subs accessible by parent
create policy "push_subs_own" on push_subscriptions for all
  using (parent_id = auth.uid());
