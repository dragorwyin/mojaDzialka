create table public.garden_crops (
  garden_id uuid not null references public.gardens (id) on delete cascade,
  crop_id text not null check (char_length(btrim(crop_id)) > 0),
  proportion numeric not null check (proportion > 0 and proportion < 'Infinity'::numeric),
  created_at timestamptz not null default now(),
  primary key (garden_id, crop_id)
);

alter table public.garden_crops enable row level security;

revoke all on table public.garden_crops from public, anon, authenticated;
grant select, insert, update, delete on table public.garden_crops to authenticated;

create policy "Users can select their own garden crops"
  on public.garden_crops
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_crops.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can insert their own garden crops"
  on public.garden_crops
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_crops.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own garden crops"
  on public.garden_crops
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_crops.garden_id
        and gardens.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_crops.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own garden crops"
  on public.garden_crops
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.gardens
      where gardens.id = garden_crops.garden_id
        and gardens.user_id = (select auth.uid())
    )
  );

create or replace function public.save_garden_crops(p_crops jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, extensions, pg_temp
as $$
declare
  saved_garden_id uuid;
begin
  if auth.uid() is null then
    raise exception 'an authenticated user is required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_crops) is distinct from 'array' then
    raise exception 'garden crops must be a JSON array' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_crops) as crop(value)
    where jsonb_typeof(crop.value) is distinct from 'object'
      or jsonb_typeof(crop.value -> 'crop_id') is distinct from 'string'
      or nullif(btrim(crop.value ->> 'crop_id'), '') is null
      or jsonb_typeof(crop.value -> 'proportion') is distinct from 'number'
  ) then
    raise exception 'each garden crop must have a crop_id and numeric proportion' using errcode = '22023';
  end if;

  insert into public.gardens (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select id
  into saved_garden_id
  from public.gardens
  where user_id = auth.uid()
  for update;

  delete from public.garden_crops
  where garden_id = saved_garden_id;

  insert into public.garden_crops (garden_id, crop_id, proportion)
  select
    saved_garden_id,
    crop.value ->> 'crop_id',
    (crop.value ->> 'proportion')::numeric
  from jsonb_array_elements(p_crops) as crop(value);

  return saved_garden_id;
end;
$$;

revoke all on function public.save_garden_crops(jsonb) from public, anon;
grant execute on function public.save_garden_crops(jsonb) to authenticated;
