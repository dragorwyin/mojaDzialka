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

  return saved_garden_id;
end;
$$;

revoke all on function public.save_garden_spaces(jsonb) from public, anon;
grant execute on function public.save_garden_spaces(jsonb) to authenticated;
