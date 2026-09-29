begin;

select plan(13);

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
    '70000000-0000-4000-8000-000000000007',
    'authenticated',
    'authenticated',
    'plan-owner-one@example.test',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  ),
  (
    '80000000-0000-4000-8000-000000000008',
    'authenticated',
    'authenticated',
    'plan-owner-two@example.test',
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
  '70000000-0000-4000-8000-000000000007',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000007","role":"authenticated"}',
  true
);
select lives_ok(
  $$ insert into public.gardens (user_id) values (auth.uid()) $$,
  'the first owner can create a garden'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '80000000-0000-4000-8000-000000000008',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-4000-8000-000000000008","role":"authenticated"}',
  true
);
select lives_ok(
  $$ insert into public.gardens (user_id) values (auth.uid()) $$,
  'the second owner can create a garden'
);

reset role;
select set_config(
  'test.first_garden_id',
  (select id::text from public.gardens where user_id = '70000000-0000-4000-8000-000000000007'),
  true
);
select set_config(
  'test.second_garden_id',
  (select id::text from public.gardens where user_id = '80000000-0000-4000-8000-000000000008'),
  true
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '70000000-0000-4000-8000-000000000007',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000007","role":"authenticated"}',
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
  'the first owner can create a current garden plan'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '80000000-0000-4000-8000-000000000008',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-4000-8000-000000000008","role":"authenticated"}',
  true
);
select lives_ok(
  $$
    insert into public.garden_plans (garden_id, plan, input_snapshot, input_fingerprint)
    values (
      current_setting('test.second_garden_id')::uuid,
      '{"version":1,"positions":[]}'::jsonb,
      '{"version":1,"spaces":[],"crops":[]}'::jsonb,
      repeat('b', 64)
    )
  $$,
  'the second owner can create a current garden plan'
);
select is(
  (select count(*) from public.garden_plans),
  1::bigint,
  'the second owner can read only their current plan'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '70000000-0000-4000-8000-000000000007',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000007","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.garden_plans),
  1::bigint,
  'the first owner can read only their current plan'
);
select is(
  (select count(*) from public.garden_plans where garden_id = current_setting('test.second_garden_id')::uuid),
  0::bigint,
  'the first owner cannot see the second owner plan'
);
select lives_ok(
  $$
    insert into public.garden_plans (garden_id, plan, input_snapshot, input_fingerprint)
    values (
      current_setting('test.first_garden_id')::uuid,
      '{"version":1,"positions":[{"cropId":"marchew"}]}'::jsonb,
      '{"version":1,"spaces":[{"id":"space"}],"crops":[{"cropId":"marchew"}]}'::jsonb,
      repeat('c', 64)
    )
    on conflict (garden_id) do update
      set plan = excluded.plan,
          input_snapshot = excluded.input_snapshot,
          input_fingerprint = excluded.input_fingerprint
  $$,
  'regenerating replaces the owner current plan atomically'
);
select is(
  (select count(*) from public.garden_plans),
  1::bigint,
  'regenerating does not create a second current plan'
);
select is(
  (select input_fingerprint from public.garden_plans),
  repeat('c', 64),
  'regenerating stores the newest input fingerprint'
);
select throws_ok(
  $$
    insert into public.garden_plans (garden_id, plan, input_snapshot, input_fingerprint)
    values (
      current_setting('test.second_garden_id')::uuid,
      '{"version":1}'::jsonb,
      '{"version":1}'::jsonb,
      repeat('d', 64)
    )
  $$,
  '42501',
  null,
  'the first owner cannot write the second owner plan'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.garden_plans $$,
  '42501',
  null,
  'anon cannot read garden plans'
);
select throws_ok(
  $$
    insert into public.garden_plans (garden_id, plan, input_snapshot, input_fingerprint)
    values (
      current_setting('test.first_garden_id')::uuid,
      '{"version":1}'::jsonb,
      '{"version":1}'::jsonb,
      repeat('e', 64)
    )
  $$,
  '42501',
  null,
  'anon cannot write garden plans'
);

select * from finish();
rollback;
