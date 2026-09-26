begin;

select plan(19);

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

select * from finish();
rollback;
