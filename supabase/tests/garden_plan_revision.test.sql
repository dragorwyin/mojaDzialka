begin;

select plan(24);

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
select set_config('test.plan_before_space_edit', (select to_jsonb(p)::text from public.garden_plans p), true);
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
select set_config('test.garden_after_space_edit', (select to_jsonb(g)::text from public.gardens g), true);
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
select is(
  (select to_jsonb(p) from public.garden_plans p),
  current_setting('test.plan_before_space_edit')::jsonb,
  'space edit and rejected stale generation preserve every saved plan field'
);
select is(
  (select to_jsonb(g) from public.gardens g),
  current_setting('test.garden_after_space_edit')::jsonb,
  'rejected stale generation does not alter the edited garden revision'
);
select set_config('test.revision_before_crop_edit', (select input_revision::text from public.gardens), true);
select lives_ok(
  $$ select public.save_garden_crops('[{"crop_id":"marchew","proportion":60},{"crop_id":"cebula","proportion":40}]'::jsonb) $$,
  'a crop and proportion edit advances inputs while retaining the saved plan'
);
select is(
  (select input_revision from public.gardens),
  current_setting('test.revision_before_crop_edit')::bigint + 1,
  'crop edit advances input revision exactly once'
);
select set_config('test.before_stale_crop_generation', jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
)::text, true);
select is(public.save_garden_plan_if_current(
  current_setting('test.revision_before_crop_edit')::bigint,
  '{"version":1,"positions":[{"cropId":"outdated"}]}'::jsonb,
  '{"version":1,"crops":[{"cropId":"outdated"}]}'::jsonb,
  repeat('c', 64), '2026-10-02 10:00:00+00'::timestamptz
), false, 'generation started before a crop edit is rejected');
select is(jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
), current_setting('test.before_stale_crop_generation')::jsonb,
  'rejected crop generation preserves all persisted input and plan fields'
);
select is(public.save_garden_plan_if_current(
  (select input_revision from public.gardens),
  '{"version":1,"positions":[{"cropId":"cebula","x":50,"y":25}]}'::jsonb,
  '{"version":1,"spaces":[{"name":"Updated space"}],"crops":[{"cropId":"cebula","proportion":"40"}]}'::jsonb,
  repeat('d', 64), '2026-10-03 15:30:00+00'::timestamptz
), true, 'current revision replaces the saved plan');
select is((select count(*) from public.garden_plans), 1::bigint,
  'guarded replacement leaves exactly one saved plan');
select is(
  (select to_jsonb(p) from public.garden_plans p),
  jsonb_build_object(
    'garden_id', (select id from public.gardens),
    'plan', '{"version":1,"positions":[{"cropId":"cebula","x":50,"y":25}]}'::jsonb,
    'input_snapshot', '{"version":1,"spaces":[{"name":"Updated space"}],"crops":[{"cropId":"cebula","proportion":"40"}]}'::jsonb,
    'input_fingerprint', repeat('d', 64),
    'generated_at', '2026-10-03 15:30:00+00'::timestamptz
  ),
  'guarded replacement persists every new payload field including its explicit generation time'
);
select is((select input_revision from public.gardens),
  current_setting('test.revision_before_crop_edit')::bigint + 1,
  'saving the generated plan does not advance input revision');
select set_config('test.before_invalid_generation', jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
)::text, true);
select throws_ok(
  $$ select public.save_garden_plan_if_current((select input_revision from public.gardens),
     '[]'::jsonb, '{"version":1}'::jsonb, repeat('e', 64), now()) $$,
  '22023', null, 'non-object plan JSON is rejected before replacement'
);
select throws_ok(
  $$ select public.save_garden_plan_if_current((select input_revision from public.gardens),
     '{"version":1}'::jsonb, '[]'::jsonb, repeat('e', 64), now()) $$,
  '22023', null, 'non-object snapshot JSON is rejected before replacement'
);
select throws_ok(
  $$ select public.save_garden_plan_if_current((select input_revision from public.gardens),
     '{"version":1}'::jsonb, '{"version":1}'::jsonb, repeat('z', 64), now()) $$,
  '22023', null, 'a 64-character non-hex fingerprint is rejected before replacement'
);
select throws_ok(
  $$ select public.save_garden_plan_if_current((select input_revision from public.gardens),
     '{"version":1}'::jsonb, '{"version":1}'::jsonb, repeat('e', 64), null) $$,
  '22023', null, 'missing generation time is rejected before replacement'
);
select throws_ok(
  $$ select public.save_garden_plan_if_current(null,
     '{"version":1}'::jsonb, '{"version":1}'::jsonb, repeat('e', 64), now()) $$,
  '22023', null, 'missing expected revision is rejected before replacement'
);
select is(jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
), current_setting('test.before_invalid_generation')::jsonb,
  'invalid generation payloads leave the complete garden, inputs and previous plan unchanged'
);

select * from finish();
rollback;
