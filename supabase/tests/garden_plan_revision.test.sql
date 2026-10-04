begin;

select plan(8);

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
values (
  '90000000-0000-4000-8000-000000000009',
  'authenticated',
  'authenticated',
  'plan-revision-owner@example.test',
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
  '90000000-0000-4000-8000-000000000009',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"90000000-0000-4000-8000-000000000009","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    select public.save_garden_spaces(jsonb_build_array(jsonb_build_object(
      'name', 'Skrzynia testowa',
      'space_type', 'bed',
      'width_cm', 100,
      'length_cm', 60
    )))
  $$,
  'saving spaces creates the garden and input revision'
);
select is(
  (select input_revision from public.gardens where user_id = auth.uid()),
  1::bigint,
  'a successful space save advances the input revision'
);
select lives_ok(
  $$ select public.save_garden_crops('[{"crop_id":"marchew","proportion":1}]'::jsonb) $$,
  'saving crops advances the input revision'
);
select is(
  (select input_revision from public.gardens where user_id = auth.uid()),
  2::bigint,
  'space and crop saves each advance the input revision'
);
select is(
  public.save_garden_plan_if_current(
    (select input_revision from public.gardens where user_id = auth.uid()),
    '{"version":1,"positions":[]}'::jsonb,
    '{"version":1,"spaces":[],"crops":[]}'::jsonb,
    repeat('a', 64),
    now()
  ),
  true,
  'a plan is saved when its expected input revision is current'
);
select set_config(
  'test.space_id',
  (select id::text from public.garden_spaces where garden_id = (select id from public.gardens where user_id = auth.uid())),
  true
);
select set_config(
  'test.expected_revision',
  (select input_revision::text from public.gardens where user_id = auth.uid()),
  true
);
select lives_ok(
  $$
    select public.save_garden_spaces(jsonb_build_array(jsonb_build_object(
      'id', current_setting('test.space_id'),
      'name', 'Skrzynia testowa',
      'space_type', 'bed',
      'width_cm', 110,
      'length_cm', 60
    )))
  $$,
  'editing a space advances the revision without clearing the saved plan'
);
select is(
  public.save_garden_plan_if_current(
    current_setting('test.expected_revision')::bigint,
    '{"version":1,"positions":[{"cropId":"marchew"}]}'::jsonb,
    '{"version":1,"spaces":[],"crops":[]}'::jsonb,
    repeat('b', 64),
    now()
  ),
  false,
  'a plan generated before an input edit is rejected'
);
select is(
  (select input_fingerprint from public.garden_plans),
  repeat('a', 64),
  'a rejected stale generation does not replace the saved plan'
);

select * from finish();
rollback;
