create table public.gardens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.gardens enable row level security;

revoke all on table public.gardens from anon, authenticated;
grant select, insert, update on table public.gardens to authenticated;

create policy "Users can select their own garden"
  on public.gardens
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own garden"
  on public.gardens
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own garden"
  on public.gardens
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
