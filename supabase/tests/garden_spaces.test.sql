begin;

select plan(49);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '30000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'space-owner-one@example.test',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'space-owner-two@example.test',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-4000-8000-000000000003',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
select lives_ok(
  $$
    select public.save_garden_spaces(
      '[
        {"name":"Warzywnik A","space_type":"bed","width_cm":120,"length_cm":80},
        {"name":"Sektor B","space_type":"sector","width_cm":300,"length_cm":200}
      ]'::jsonb
    )
  $$,
  'the first user can save multiple garden spaces'
);
select is(
  (select count(*) from public.garden_spaces),
  2::bigint,
  'the first user can read both of their garden spaces'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000004',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000004","role":"authenticated"}',
  true
);
select lives_ok(
  $$
    select public.save_garden_spaces(
      '[{"name":"Sektor C","space_type":"sector","width_cm":250,"length_cm":150}]'::jsonb
    )
  $$,
  'the second user can save their garden space'
);
select is(
  (select count(*) from public.garden_spaces),
  1::bigint,
  'the second user can read only their garden space'
);

reset role;
select set_config(
  'test.second_garden_id',
  (select id::text from public.gardens where user_id = '40000000-0000-4000-8000-000000000004'),
  true
);
select set_config(
  'test.second_space_id',
  (select id::text from public.garden_spaces where garden_id = current_setting('test.second_garden_id')::uuid),
  true
);
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-4000-8000-000000000003',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.garden_spaces),
  2::bigint,
  'the first user cannot see the second user garden space'
);
select lives_ok(
  $$
    update public.garden_spaces
    set width_cm = 125
    where space_type = 'bed'
  $$,
  'the first user can update their own garden space'
);
select is(
  (select width_cm from public.garden_spaces where space_type = 'bed'),
  125,
  'the first user update is persisted'
);
select lives_ok(
  $$
    update public.garden_spaces
    set width_cm = 999
    where garden_id = current_setting('test.second_garden_id')::uuid
  $$,
  'the first user cannot update the second user space'
);
select lives_ok(
  $$
    delete from public.garden_spaces
    where garden_id = current_setting('test.second_garden_id')::uuid
  $$,
  'the first user cannot delete the second user space'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-4000-8000-000000000004',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000004","role":"authenticated"}',
  true
);
select is(
  (select width_cm from public.garden_spaces),
  250,
  'the second user space is unchanged after the first user update attempt'
);
select is(
  (select count(*) from public.garden_spaces),
  1::bigint,
  'the second user space remains after cross-user update and delete attempts'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-4000-8000-000000000003',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
select lives_ok(
  $$
    select public.save_garden_spaces(
      '[{"name":"Nowa skrzynia","space_type":"bed","width_cm":100,"length_cm":60}]'::jsonb
    )
  $$,
  'saving again replaces the previous space list'
);
select is(
  (select count(*) from public.garden_spaces),
  1::bigint,
  'saving again leaves one current garden space'
);
select is(
  (select count(*) from public.gardens),
  1::bigint,
  'one user still has only one garden'
);
select set_config(
  'test.first_garden_id',
  (select id::text from public.gardens where user_id = '30000000-0000-4000-8000-000000000003'),
  true
);
select set_config(
  'test.original_space_id',
  (select id::text from public.garden_spaces where garden_id = current_setting('test.first_garden_id')::uuid),
  true
);
select lives_ok(
  $$
    insert into public.garden_plans (garden_id, plan, input_snapshot, input_fingerprint)
    values (
      current_setting('test.first_garden_id')::uuid,
      '{"version":1,"positions":[]}'::jsonb,
      '{"version":1,"spaces":[],"crops":[]}'::jsonb,
      repeat('a', 64)
    )
  $$,
  'the first owner can create a plan before editing spaces'
);
select lives_ok(
  $$
    select public.save_garden_spaces(
      jsonb_build_array(jsonb_build_object(
        'id', current_setting('test.original_space_id'),
        'name', 'Nowa skrzynia',
        'space_type', 'bed',
        'width_cm', 101,
        'length_cm', 60
      ))
    )
  $$,
  'editing a space with its existing ID succeeds'
);
select is(
  (select count(*) from public.garden_plans where garden_id = current_setting('test.first_garden_id')::uuid),
  1::bigint,
  'editing a space without changing the ID set keeps the saved plan'
);
select is(
  (select id::text from public.garden_spaces where garden_id = current_setting('test.first_garden_id')::uuid),
  current_setting('test.original_space_id'),
  'editing a space preserves its ID'
);
select lives_ok(
  $$
    select public.save_garden_spaces(jsonb_build_array(
      jsonb_build_object(
        'id', current_setting('test.original_space_id'),
        'name', 'Nowa skrzynia',
        'space_type', 'bed',
        'width_cm', 101,
        'length_cm', 60
      ),
      jsonb_build_object(
        'name', 'Nowy sektor',
        'space_type', 'sector',
        'width_cm', 200,
        'length_cm', 120
      )
    ))
  $$,
  'adding a space preserves existing rows and adds a new row'
);
select is(
  (select count(*) from public.garden_plans where garden_id = current_setting('test.first_garden_id')::uuid),
  0::bigint,
  'adding a space clears the previous plan'
);
select is(
  (select id::text from public.garden_spaces where garden_id = current_setting('test.first_garden_id')::uuid and name = 'Nowa skrzynia'),
  current_setting('test.original_space_id'),
  'adding a space keeps IDs for retained spaces'
);
select set_config(
  'test.added_space_id',
  (select id::text from public.garden_spaces where garden_id = current_setting('test.first_garden_id')::uuid and name = 'Nowy sektor'),
  true
);
select lives_ok(
  $$
    insert into public.garden_plans (garden_id, plan, input_snapshot, input_fingerprint)
    values (
      current_setting('test.first_garden_id')::uuid,
      '{"version":1,"positions":[]}'::jsonb,
      '{"version":1,"spaces":[],"crops":[]}'::jsonb,
      repeat('b', 64)
    )
  $$,
  'the first owner can create a plan before removing a space'
);
select lives_ok(
  $$
    select public.save_garden_spaces(jsonb_build_array(jsonb_build_object(
      'id', current_setting('test.added_space_id'),
      'name', 'Nowy sektor',
      'space_type', 'sector',
      'width_cm', 200,
      'length_cm', 120
    )))
  $$,
  'removing a space while retaining one succeeds'
);
select is(
  (select count(*) from public.garden_plans where garden_id = current_setting('test.first_garden_id')::uuid),
  0::bigint,
  'removing a space clears the previous plan'
);
select is(
  (select count(*) from public.garden_spaces where garden_id = current_setting('test.first_garden_id')::uuid),
  1::bigint,
  'removing a space leaves the submitted space list'
);
select lives_ok(
  $$
    insert into public.garden_plans (garden_id, plan, input_snapshot, input_fingerprint)
    values (
      current_setting('test.first_garden_id')::uuid,
      '{"version":1,"positions":[]}'::jsonb,
      '{"version":1,"spaces":[],"crops":[]}'::jsonb,
      repeat('c', 64)
    )
  $$,
  'the first owner can create a plan before an invalid save'
);
select throws_ok(
  $$
    select public.save_garden_spaces(jsonb_build_array(
      jsonb_build_object(
        'id', current_setting('test.added_space_id'),
        'name', 'Nowy sektor',
        'space_type', 'sector',
        'width_cm', 200,
        'length_cm', 120
      ),
      jsonb_build_object(
        'id', current_setting('test.added_space_id'),
        'name', 'Duplikat',
        'space_type', 'bed',
        'width_cm', 100,
        'length_cm', 80
      )
    ))
  $$,
  '22023',
  null,
  'duplicate submitted space IDs are rejected'
);
select throws_ok(
  $$
    select public.save_garden_spaces(jsonb_build_array(jsonb_build_object(
      'id', current_setting('test.added_space_id'),
      'name', 'Nowy sektor',
      'space_type', 'sector',
      'width_cm', 0,
      'length_cm', 120
    )))
  $$,
  '23514',
  null,
  'an invalid edit is rejected'
);
select is(
  (select count(*) from public.garden_plans where garden_id = current_setting('test.first_garden_id')::uuid),
  1::bigint,
  'a failed space save preserves the saved plan'
);
select is(
  (select width_cm from public.garden_spaces where id = current_setting('test.added_space_id')::uuid),
  200,
  'a failed space save rolls back the space update'
);
select throws_ok(
  $$
    select public.save_garden_spaces(jsonb_build_array(jsonb_build_object(
      'id', current_setting('test.second_space_id'),
      'name', 'Cudza skrzynia',
      'space_type', 'bed',
      'width_cm', 100,
      'length_cm', 60
    )))
  $$,
  '42501',
  null,
  'a space ID from another owner is rejected'
);
select is(
  (select count(*) from public.garden_plans where garden_id = current_setting('test.first_garden_id')::uuid),
  1::bigint,
  'rejecting another owner space ID preserves the plan'
);
select is(
  (select count(*) from public.garden_spaces where garden_id = current_setting('test.first_garden_id')::uuid),
  1::bigint,
  'rejecting another owner space ID preserves the space list'
);
select throws_ok(
  $$
    select public.save_garden_spaces(
      '[{"name":"Błędna","space_type":"bed","width_cm":0,"length_cm":60}]'::jsonb
    )
  $$,
  '23514',
  null,
  'non-positive dimensions are rejected'
);
select throws_ok(
  $$
    select public.save_garden_spaces(
      '[{"name":"Błędna","space_type":"path","width_cm":100,"length_cm":60}]'::jsonb
    )
  $$,
  '23514',
  null,
  'unknown space types are rejected'
);
select throws_ok(
  $$
    select public.save_garden_spaces(
      '[{"name":"   ","space_type":"bed","width_cm":100,"length_cm":60}]'::jsonb
    )
  $$,
  '23514',
  null,
  'blank names are rejected'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.garden_spaces $$,
  '42501',
  null,
  'anon cannot read garden spaces'
);
select throws_ok(
  $$ select public.save_garden_spaces('[]'::jsonb) $$,
  '42501',
  null,
  'anon cannot call the save function'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select lives_ok(
  $$ select public.save_garden_spaces('[
    {"name":"Rollback bed","space_type":"bed","width_cm":120,"length_cm":80},
    {"name":"Rollback sector","space_type":"sector","width_cm":200,"length_cm":150}
  ]'::jsonb) $$,
  'rollback fixture contains multiple spaces with distinct ordering'
);
select lives_ok(
  $$ select public.save_garden_crops('[{"crop_id":"marchew","proportion":60},{"crop_id":"cebula","proportion":40}]'::jsonb) $$,
  'rollback fixture also contains a crop selection'
);
select is(
  public.save_garden_plan_if_current(
    (select input_revision from public.gardens),
    '{"version":1,"spaces":[{"id":"fixture","positions":[{"cropId":"marchew","x":20,"y":30}]}]}'::jsonb,
    '{"version":1,"spaces":[{"name":"Rollback bed"}],"crops":[{"cropId":"marchew","proportion":"60"}]}'::jsonb,
    repeat('d', 64), '2026-10-01 10:00:00+00'::timestamptz
  ), true,
  'rollback fixture contains a saved plan with explicit snapshot and generation time'
);
-- Capture every persisted field, including timestamps and input_revision.
select set_config('test.before_failed_space_save', jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
)::text, true);
select set_config('test.retained_space_id', (select id::text from public.garden_spaces where sort_order = 0), true);
select throws_ok(
  $$ select public.save_garden_spaces(jsonb_build_array(
    jsonb_build_object('id', current_setting('test.retained_space_id'), 'name', 'Changed before failure',
      'space_type', 'sector', 'width_cm', 333, 'length_cm', 444),
    jsonb_build_object('name', 'Invalid later row', 'space_type', 'bed', 'width_cm', 0, 'length_cm', 90)
  )) $$,
  '23514', null,
  'a later invalid space rejects a structural save after an earlier row update and deletion'
);
select is(jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
), current_setting('test.before_failed_space_save')::jsonb,
  'failed structural save restores full spaces, ordering, crops, garden revision and saved plan'
);
reset role;
select set_config('test.foreign_space_before_rpc', (
  select to_jsonb(s) from public.garden_spaces s where id = current_setting('test.second_space_id')::uuid
)::text, true);
set local role authenticated;
select throws_ok(
  $$ select public.save_garden_spaces(jsonb_build_array(jsonb_build_object(
    'id', current_setting('test.second_space_id'), 'name', 'Foreign space',
    'space_type', 'bed', 'width_cm', 100, 'length_cm', 60
  ))) $$,
  '42501', null,
  'foreign space ID cannot replace the owner rollback fixture'
);
select is(jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
), current_setting('test.before_failed_space_save')::jsonb,
  'foreign ID rejection preserves the complete owner state'
);
reset role;
select is(
  (select to_jsonb(s) from public.garden_spaces s where id = current_setting('test.second_space_id')::uuid),
  current_setting('test.foreign_space_before_rpc')::jsonb,
  'privileged read-back confirms the complete foreign space survives the RPC attack unchanged'
);
-- Privileged read-back checks both accounts; client mutations still run as anon.
select set_config('test.before_anon_space_mutation', (
  select jsonb_agg(to_jsonb(s) order by garden_id, sort_order) from public.garden_spaces s
)::text, true);
set local role anon;
select throws_ok($$ update public.garden_spaces set name = 'Anonymous edit' $$, '42501', null,
  'anon cannot update spaces');
select throws_ok($$ delete from public.garden_spaces $$, '42501', null,
  'anon cannot delete spaces');
reset role;
select is(
  (select jsonb_agg(to_jsonb(s) order by garden_id, sort_order) from public.garden_spaces s),
  current_setting('test.before_anon_space_mutation')::jsonb,
  'all owner spaces survive anonymous mutation attempts unchanged'
);

select * from finish();
rollback;
