-- Jetpack Nano schema
create table if not exists public.users (
  id text primary key,
  name text not null,
  handle text not null,
  followers integer not null default 0,
  verified boolean not null default false,
  joined_days_ago integer not null default 0
);

create table if not exists public.posts (
  id text primary key,
  creator_id text not null references public.users(id),
  topic text not null,
  kind text not null default 'image',
  image_url text,
  bg_from text,
  bg_to text,
  caption text not null,
  likes bigint not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  age_hours double precision not null default 0,
  created_at timestamp with time zone not null default now()
);

-- read-only access for the anon key (web client)
alter table public.users enable row level security;
alter table public.posts enable row level security;
create policy "public read users" on public.users for select using (true);
create policy "public read posts" on public.posts for select using (true);
