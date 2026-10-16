create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique,
  role text not null check (role in ('donor', 'volunteer')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select, insert on public.profiles to authenticated;
grant update (details) on public.profiles to authenticated;

create policy "Profiles are readable by their owner"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are created by their owner"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Profiles are updated by their owner"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
