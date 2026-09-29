create table public.garden_plans (
  garden_id uuid primary key references public.gardens (id) on delete cascade,
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  input_fingerprint text not null check (char_length(input_fingerprint) = 64),
  generated_at timestamptz not null default now()
);

alter table public.garden_plans enable row level security;

revoke all on table public.garden_plans from public, anon, authenticated;
grant select, insert, update, delete on table public.garden_plans to authenticated;

create policy "Users can select their own garden plan"
  on public.garden_plans
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_plans.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can insert their own garden plan"
  on public.garden_plans
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_plans.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own garden plan"
  on public.garden_plans
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_plans.garden_id
        and gardens.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_plans.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own garden plan"
  on public.garden_plans
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_plans.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );
