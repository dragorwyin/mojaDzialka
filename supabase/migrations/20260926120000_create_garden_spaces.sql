create table public.garden_spaces (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  space_type text not null check (space_type in ('bed', 'sector')),
  width_cm integer not null check (width_cm > 0),
  length_cm integer not null check (length_cm > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (garden_id, sort_order)
);

alter table public.garden_spaces enable row level security;

revoke all on table public.garden_spaces from anon, authenticated;
grant select, insert, update, delete on table public.garden_spaces to authenticated;

create policy "Users can select their own garden spaces"
  on public.garden_spaces
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_spaces.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can insert their own garden spaces"
  on public.garden_spaces
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_spaces.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own garden spaces"
  on public.garden_spaces
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_spaces.garden_id
        and gardens.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_spaces.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own garden spaces"
  on public.garden_spaces
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_spaces.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create or replace function public.save_garden_spaces(p_spaces jsonb)
returns uuid
language plpgsql
set search_path = public, extensions, pg_temp
as $$
declare
  saved_garden_id uuid;
begin
  if auth.uid() is null then
    raise exception 'an authenticated user is required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_spaces) <> 'array' or jsonb_array_length(p_spaces) = 0 then
    raise exception 'at least one garden space is required' using errcode = '22023';
  end if;

  insert into public.gardens (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select id
  into saved_garden_id
  from public.gardens
  where user_id = auth.uid();

  delete from public.garden_spaces
  where garden_id = saved_garden_id;

  insert into public.garden_spaces (garden_id, name, space_type, width_cm, length_cm, sort_order)
  select
    saved_garden_id,
    btrim(space.value ->> 'name'),
    space.value ->> 'space_type',
    (space.value ->> 'width_cm')::integer,
    (space.value ->> 'length_cm')::integer,
    (space.ordinality - 1)::integer
  from jsonb_array_elements(p_spaces) with ordinality as space(value, ordinality);

  return saved_garden_id;
end;
$$;

revoke all on function public.save_garden_spaces(jsonb) from public, anon;
grant execute on function public.save_garden_spaces(jsonb) to authenticated;
