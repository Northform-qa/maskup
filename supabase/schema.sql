-- Maskup — Supabase schema v2
-- Run this in the Supabase SQL editor

-- Enums
create type user_role as enum ('player', 'owner', 'admin');
create type weather_status as enum ('open', 'rain_delay', 'closed');
create type listing_status as enum ('pending', 'published', 'rejected');
create type event_type as enum ('big_game', 'league', 'tournament', 'walk_on');
create type player_count_range as enum ('under_25', '25_to_50', '50_to_100', 'over_100');

-- Users (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'player',
  display_name text,
  created_at timestamptz not null default now()
);

-- Fields
create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text not null,
  province text not null default 'ON',
  lat numeric(9,6),
  lng numeric(9,6),
  phone text,
  website text,
  description text,
  field_types text[] not null default '{}',
  num_fields integer,
  -- Crowd capacity fields
  typical_capacity integer,
  active_players_now integer,                          -- null = no data yet today
  crowd_report_count integer not null default 0,
  crowd_report_last_updated timestamptz,
  -- Pricing
  rentals_available boolean not null default false,
  rental_pricing text,
  pricing text,
  -- Hours & season
  hours jsonb not null default '{}',
  seasonal_start date,
  seasonal_end date,
  -- Status
  weather_status weather_status not null default 'open',
  listing_status listing_status not null default 'pending',
  owner_id uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  title text not null,
  event_type event_type not null,
  date date not null,
  start_time time,
  end_time time,
  price numeric(6,2),
  capacity integer,
  spots_remaining integer,
  created_at timestamptz not null default now()
);

-- Crowd reports
-- lat/lng stored server-side only — proximity check, never exposed to other users
create table if not exists public.crowd_reports (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,  -- nullable = anonymous
  player_count_range player_count_range not null,
  submitted_at timestamptz not null default now(),
  lat numeric(9,6),   -- submitter location, server-side proximity check only
  lng numeric(9,6)
);

-- Index for efficient crowd aggregation queries
create index if not exists crowd_reports_field_time_idx
  on public.crowd_reports (field_id, submitted_at desc);

-- Favourites
create table if not exists public.favourites (
  user_id  uuid not null references public.users(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, field_id)
);

-- ─────────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.fields enable row level security;
alter table public.reviews enable row level security;
alter table public.events enable row level security;
alter table public.crowd_reports enable row level security;

create policy "Published fields are public"
  on public.fields for select
  using (listing_status = 'published');

create policy "Admins can read all fields"
  on public.fields for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update fields"
  on public.fields for update
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Events on published fields are public"
  on public.events for select
  using (
    exists (
      select 1 from public.fields
      where fields.id = events.field_id
        and fields.listing_status = 'published'
    )
  );

create policy "Reviews on published fields are public"
  on public.reviews for select
  using (
    exists (
      select 1 from public.fields
      where fields.id = reviews.field_id
        and fields.listing_status = 'published'
    )
  );

-- Anyone can insert a crowd report (anonymous allowed — abuse handled in Edge Function)
create policy "Anyone can submit crowd reports"
  on public.crowd_reports for insert
  with check (true);

-- crowd_reports are write-only from the client — never readable by other users
-- (the aggregated result is read from the fields table instead)

alter table public.favourites enable row level security;

create policy "Users can read their own favourites"
  on public.favourites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favourites"
  on public.favourites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favourites"
  on public.favourites for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- pg_cron jobs are in supabase/cron.sql
-- Run that file separately AFTER enabling the pg_cron extension:
--   Supabase dashboard → Database → Extensions → pg_cron → Enable
-- ─────────────────────────────────────────────
