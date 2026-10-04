alter table public.gardens
  add column input_revision bigint not null default 0;

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

  update public.gardens
  set input_revision = input_revision + 1
  where id = saved_garden_id;

  return saved_garden_id;
end;
$$;

create or replace function public.save_garden_spaces(p_spaces jsonb)
returns uuid
language plpgsql
set search_path = public, extensions, pg_temp
as $$
declare
  saved_garden_id uuid;
  existing_space_ids uuid[];
  requested_space_ids uuid[];
  sort_order_offset integer;
  space_row record;
  space_id uuid;
  structure_changed boolean;
  provided_id_count integer;
  distinct_id_count integer;
begin
  if auth.uid() is null then
    raise exception 'an authenticated user is required' using errcode = '42501';
  end if;

  if p_spaces is null or jsonb_typeof(p_spaces) is distinct from 'array' or jsonb_array_length(p_spaces) = 0 then
    raise exception 'at least one garden space is required' using errcode = '22023';
  end if;

  insert into public.gardens (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select id
  into saved_garden_id
  from public.gardens
  where user_id = auth.uid()
  for update;

  select
    count(*) filter (where parsed.id is not null),
    count(distinct parsed.id),
    coalesce(array_agg(parsed.id order by parsed.id) filter (where parsed.id is not null), '{}'::uuid[])
  into provided_id_count, distinct_id_count, requested_space_ids
  from (
    select nullif(space.value ->> 'id', '')::uuid as id
    from jsonb_array_elements(p_spaces) as space(value)
  ) as parsed;

  if provided_id_count <> distinct_id_count then
    raise exception 'garden space IDs must be unique' using errcode = '22023';
  end if;

  select coalesce(array_agg(id order by id), '{}'::uuid[])
  into existing_space_ids
  from public.garden_spaces
  where garden_id = saved_garden_id;

  if exists (
    select 1
    from unnest(requested_space_ids) as requested(id)
    where not exists (
      select 1
      from public.garden_spaces as existing
      where existing.id = requested.id
        and existing.garden_id = saved_garden_id
    )
  ) then
    raise exception 'garden space does not belong to the caller' using errcode = '42501';
  end if;

  structure_changed :=
    existing_space_ids is distinct from requested_space_ids
    or provided_id_count <> jsonb_array_length(p_spaces);

  delete from public.garden_spaces
  where garden_id = saved_garden_id
    and not (id = any(requested_space_ids));

  select coalesce(max(sort_order), -1) + jsonb_array_length(p_spaces) + 1
  into sort_order_offset
  from public.garden_spaces
  where garden_id = saved_garden_id;

  update public.garden_spaces
  set sort_order = sort_order + sort_order_offset
  where garden_id = saved_garden_id;

  for space_row in
    select value, ordinality
    from jsonb_array_elements(p_spaces) with ordinality as space(value, ordinality)
  loop
    space_id := nullif(space_row.value ->> 'id', '')::uuid;

    if space_id is null then
      insert into public.garden_spaces (garden_id, name, space_type, width_cm, length_cm, sort_order)
      values (
        saved_garden_id,
        btrim(space_row.value ->> 'name'),
        space_row.value ->> 'space_type',
        (space_row.value ->> 'width_cm')::integer,
        (space_row.value ->> 'length_cm')::integer,
        (space_row.ordinality - 1)::integer
      );
    else
      update public.garden_spaces
      set name = btrim(space_row.value ->> 'name'),
          space_type = space_row.value ->> 'space_type',
          width_cm = (space_row.value ->> 'width_cm')::integer,
          length_cm = (space_row.value ->> 'length_cm')::integer,
          sort_order = (space_row.ordinality - 1)::integer
      where id = space_id
        and garden_id = saved_garden_id;
    end if;
  end loop;

  if structure_changed then
    delete from public.garden_plans
    where garden_id = saved_garden_id;
  end if;

  update public.gardens
  set input_revision = input_revision + 1
  where id = saved_garden_id;

  return saved_garden_id;
end;
$$;
create or replace function public.save_garden_plan_if_current(
  p_expected_input_revision bigint,
  p_plan jsonb,
  p_input_snapshot jsonb,
  p_input_fingerprint text,
  p_generated_at timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = public, extensions, pg_temp
as $$
declare
  saved_garden_id uuid;
  current_input_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'an authenticated user is required' using errcode = '42501';
  end if;

  if p_expected_input_revision is null
    or jsonb_typeof(p_plan) is distinct from 'object'
    or jsonb_typeof(p_input_snapshot) is distinct from 'object'
    or p_input_fingerprint is null
    or p_input_fingerprint !~ '^[0-9a-f]{64}$'
    or p_generated_at is null then
    raise exception 'invalid garden plan payload' using errcode = '22023';
  end if;

  select id, input_revision
  into saved_garden_id, current_input_revision
  from public.gardens
  where user_id = auth.uid()
  for update;

  if not found or current_input_revision <> p_expected_input_revision then
    return false;
  end if;

  insert into public.garden_plans (
    garden_id,
    plan,
    input_snapshot,
    input_fingerprint,
    generated_at
  )
  values (
    saved_garden_id,
    p_plan,
    p_input_snapshot,
    p_input_fingerprint,
    p_generated_at
  )
  on conflict (garden_id) do update
    set plan = excluded.plan,
        input_snapshot = excluded.input_snapshot,
        input_fingerprint = excluded.input_fingerprint,
        generated_at = excluded.generated_at;

  return true;
end;
$$;

revoke all on function public.save_garden_plan_if_current(bigint, jsonb, jsonb, text, timestamptz) from public, anon;
grant execute on function public.save_garden_plan_if_current(bigint, jsonb, jsonb, text, timestamptz) to authenticated;
