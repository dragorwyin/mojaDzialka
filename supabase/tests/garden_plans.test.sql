begin;

select plan(23);

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

reset role;
select set_config('test.before_plan_attacks', (
  select jsonb_agg(to_jsonb(p) order by garden_id) from public.garden_plans p
)::text, true);
select set_config('test.second_plan_before_owner_save', (
  select to_jsonb(p) from public.garden_plans p where garden_id = current_setting('test.second_garden_id')::uuid
)::text, true);
set local role authenticated;
with changed as (
    update public.garden_plans set plan = '{"corrupted":true}'::jsonb
    where garden_id = current_setting('test.second_garden_id')::uuid returning *
)
select is((select count(*) from changed), 0::bigint, 'the first owner updates zero foreign plan rows');
with removed as (
    delete from public.garden_plans
    where garden_id = current_setting('test.second_garden_id')::uuid returning *
)
select is((select count(*) from removed), 0::bigint, 'the first owner deletes zero foreign plan rows');
select throws_ok(
  $$ update public.garden_plans set garden_id = current_setting('test.second_garden_id')::uuid
     where garden_id = current_setting('test.first_garden_id')::uuid $$,
  '42501', null,
  'WITH CHECK rejects moving an owned plan into another owner garden'
);
reset role;
select is(
  (select jsonb_agg(to_jsonb(p) order by garden_id) from public.garden_plans p),
  current_setting('test.before_plan_attacks')::jsonb,
  'privileged read-back confirms both complete plans are unchanged after owner attacks'
);
set local role authenticated;
select is(public.save_garden_plan_if_current(
  (select input_revision from public.gardens),
  '{"version":1,"positions":[{"cropId":"cebula"}]}'::jsonb,
  '{"version":1,"spaces":[],"crops":[{"cropId":"cebula","proportion":"100"}]}'::jsonb,
  repeat('f', 64), '2026-10-02 12:00:00+00'::timestamptz
), true, 'the first owner can use guarded RPC while another owner has a saved plan');
reset role;
select is(
  (select to_jsonb(p) from public.garden_plans p where garden_id = current_setting('test.second_garden_id')::uuid),
  current_setting('test.second_plan_before_owner_save')::jsonb,
  'saving through owner RPC leaves the complete second owner plan unchanged'
);
select set_config('test.before_anon_plan_attacks', (
  select jsonb_agg(to_jsonb(p) order by garden_id) from public.garden_plans p
)::text, true);
set local role anon;
select throws_ok($$ update public.garden_plans set input_fingerprint = repeat('0', 64) $$,
  '42501', null, 'anon cannot update plans');
select throws_ok($$ delete from public.garden_plans $$,
  '42501', null, 'anon cannot delete plans');
select throws_ok(
  $$ select public.save_garden_plan_if_current(0, '{"version":1}'::jsonb,
     '{"version":1}'::jsonb, repeat('0', 64), '2026-10-02 13:00:00+00'::timestamptz) $$,
  '42501', null, 'anon cannot execute guarded generation RPC'
);
reset role;
select is(
  (select jsonb_agg(to_jsonb(p) order by garden_id) from public.garden_plans p),
  current_setting('test.before_anon_plan_attacks')::jsonb,
  'privileged read-back confirms both complete plans survive anonymous attacks unchanged'
);

select * from finish();
rollback;
