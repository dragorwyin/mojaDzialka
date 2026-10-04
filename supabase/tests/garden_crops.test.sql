begin;

select plan(37);

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
    '50000000-0000-4000-8000-000000000005',
    'authenticated',
    'authenticated',
    'crop-owner-one@example.test',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  ),
  (
    '60000000-0000-4000-8000-000000000006',
    'authenticated',
    'authenticated',
    'crop-owner-two@example.test',
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
  '50000000-0000-4000-8000-000000000005',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-4000-8000-000000000005","role":"authenticated"}',
  true
);
select lives_ok(
  $$
    select public.save_garden_crops(
      '[{"crop_id":"pomidor","proportion":1.5},{"crop_id":"marchew","proportion":2}]'::jsonb
    )
  $$,
  'the first crop save creates a garden and stores the owner selection'
);
select is(
  (select count(*) from public.gardens),
  1::bigint,
  'the first crop save creates exactly one private garden'
);
select is(
  (select count(*) from public.garden_crops),
  2::bigint,
  'the owner can read both selected crops'
);
select is(
  (select proportion from public.garden_crops where crop_id = 'pomidor'),
  1.5::numeric,
  'decimal proportions are preserved'
);
select lives_ok(
  $$
    select public.save_garden_spaces(
      '[
        {"name":"Warzywnik A","space_type":"bed","width_cm":120,"length_cm":80},
        {"name":"Warzywnik B","space_type":"bed","width_cm":100,"length_cm":60}
      ]'::jsonb
    )
  $$,
  'garden spaces can be saved independently of the crop selection'
);
select lives_ok(
  $$
    select public.save_garden_spaces(
      '[{"name":"Nowa skrzynia","space_type":"bed","width_cm":140,"length_cm":70}]'::jsonb
    )
  $$,
  'replacing the garden space list succeeds'
);
select is(
  (select count(*) from public.garden_crops),
  2::bigint,
  'replacing garden spaces leaves the crop selection intact'
);
select is(
  (select proportion from public.garden_crops where crop_id = 'marchew'),
  2::numeric,
  'the stored crop proportion remains unchanged after replacing garden spaces'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '60000000-0000-4000-8000-000000000006',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-4000-8000-000000000006","role":"authenticated"}',
  true
);
select lives_ok(
  $$
    select public.save_garden_crops(
      '[{"crop_id":"ogorek","proportion":3}]'::jsonb
    )
  $$,
  'a second user can save their own crop selection'
);
select is(
  (select count(*) from public.garden_crops),
  1::bigint,
  'the second user can read only their selected crop'
);

reset role;
select set_config(
  'test.second_garden_id',
  (select id::text from public.gardens where user_id = '60000000-0000-4000-8000-000000000006'),
  true
);
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '50000000-0000-4000-8000-000000000005',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"50000000-0000-4000-8000-000000000005","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.garden_crops),
  2::bigint,
  'the first user cannot see the second user crop selection'
);
select throws_ok(
  $$
    insert into public.garden_crops (garden_id, crop_id, proportion)
    values (current_setting('test.second_garden_id')::uuid, 'burak', 1)
  $$,
  '42501',
  null,
  'the first user cannot write into the second user garden'
);
select throws_ok(
  $$
    select public.save_garden_crops(
      '[{"crop_id":"ogorek","proportion":1},{"crop_id":"ogorek","proportion":2}]'::jsonb
    )
  $$,
  '23505',
  null,
  'duplicate crop IDs are rejected by the unique constraint'
);
select is(
  (select count(*) from public.garden_crops),
  2::bigint,
  'a failed replacement leaves the previous owner selection intact'
);
select throws_ok(
  $$
    insert into public.garden_crops (garden_id, crop_id, proportion)
    values ((select id from public.gardens where user_id = auth.uid()), 'rzodkiewka', 0)
  $$,
  '23514',
  null,
  'zero proportions are rejected'
);
select throws_ok(
  $$
    insert into public.garden_crops (garden_id, crop_id, proportion)
    values ((select id from public.gardens where user_id = auth.uid()), 'rzodkiewka', -1)
  $$,
  '23514',
  null,
  'negative proportions are rejected'
);
select throws_ok(
  $$
    insert into public.garden_crops (garden_id, crop_id, proportion)
    values ((select id from public.gardens where user_id = auth.uid()), 'rzodkiewka', 'NaN'::numeric)
  $$,
  '23514',
  null,
  'NaN proportions are rejected'
);
select throws_ok(
  $$
    insert into public.garden_crops (garden_id, crop_id, proportion)
    values ((select id from public.gardens where user_id = auth.uid()), 'rzodkiewka', 'Infinity'::numeric)
  $$,
  '23514',
  null,
  'positive infinity proportions are rejected'
);
select throws_ok(
  $$
    insert into public.garden_crops (garden_id, crop_id, proportion)
    values ((select id from public.gardens where user_id = auth.uid()), 'rzodkiewka', '-Infinity'::numeric)
  $$,
  '23514',
  null,
  'negative infinity proportions are rejected'
);
select lives_ok(
  $$ select public.save_garden_crops('[]'::jsonb) $$,
  'the owner can clear the crop selection with an empty list'
);
select is(
  (select count(*) from public.garden_crops),
  0::bigint,
  'clearing removes the previous crop selection'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '60000000-0000-4000-8000-000000000006',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"60000000-0000-4000-8000-000000000006","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.garden_crops),
  1::bigint,
  'clearing the first user selection leaves the second user selection unchanged'
);
select is(
  (select proportion from public.garden_crops where crop_id = 'ogorek'),
  3::numeric,
  'the second user crop proportion remains unchanged'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.garden_crops $$,
  '42501',
  null,
  'anon cannot read garden crops'
);
select throws_ok(
  $$ select public.save_garden_crops('[]'::jsonb) $$,
  '42501',
  null,
  'anon cannot call the save function'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000005', true);
select set_config('request.jwt.claims', '{"sub":"50000000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select lives_ok(
  $$ select public.save_garden_crops('[{"crop_id":"marchew","proportion":60},{"crop_id":"cebula","proportion":40}]'::jsonb) $$,
  'crop rollback fixture has two existing selections'
);
select lives_ok(
  $$ select public.save_garden_spaces('[
    {"name":"Crop fixture bed","space_type":"bed","width_cm":120,"length_cm":80},
    {"name":"Crop fixture sector","space_type":"sector","width_cm":200,"length_cm":150}
  ]'::jsonb) $$,
  'crop rollback fixture has multiple spaces'
);
select is(public.save_garden_plan_if_current(
  (select input_revision from public.gardens),
  '{"version":1,"positions":[{"cropId":"marchew","x":20,"y":30}]}'::jsonb,
  '{"version":1,"spaces":[{"name":"Crop fixture bed"}],"crops":[{"cropId":"marchew","proportion":"60"}]}'::jsonb,
  repeat('a', 64), '2026-10-01 11:00:00+00'::timestamptz
), true, 'crop rollback fixture has a saved plan');
select set_config('test.before_failed_crop_save', jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
)::text, true);
select throws_ok(
  $$ select public.save_garden_crops('[{"crop_id":"pomidor","proportion":30},{"crop_id":"brokul","proportion":0}]'::jsonb) $$,
  '23514', null,
  'a valid first crop and invalid later crop reject replacement after deleting previous selections'
);
select is(jsonb_build_object(
  'garden', (select to_jsonb(g) from public.gardens g),
  'spaces', (select jsonb_agg(to_jsonb(s) order by sort_order) from public.garden_spaces s),
  'crops', (select jsonb_agg(to_jsonb(c) order by crop_id) from public.garden_crops c),
  'plan', (select to_jsonb(p) from public.garden_plans p)
), current_setting('test.before_failed_crop_save')::jsonb,
  'failed crop replacement preserves full crops, spaces, garden revision and saved plan'
);
reset role;
select set_config('test.before_crop_attacks', (
  select jsonb_agg(to_jsonb(c) order by garden_id, crop_id) from public.garden_crops c
)::text, true);
set local role authenticated;
with changed as (
    update public.garden_crops set proportion = 999
    where garden_id = current_setting('test.second_garden_id')::uuid returning *
)
select is((select count(*) from changed), 0::bigint, 'the first owner updates zero foreign crop rows');
with removed as (
    delete from public.garden_crops
    where garden_id = current_setting('test.second_garden_id')::uuid returning *
)
select is((select count(*) from removed), 0::bigint, 'the first owner deletes zero foreign crop rows');
select throws_ok(
  $$ update public.garden_crops set garden_id = current_setting('test.second_garden_id')::uuid
     where crop_id = 'marchew' $$,
  '42501', null,
  'WITH CHECK rejects moving an owned crop into another owner garden'
);
reset role;
select is(
  (select jsonb_agg(to_jsonb(c) order by garden_id, crop_id) from public.garden_crops c),
  current_setting('test.before_crop_attacks')::jsonb,
  'privileged read-back confirms both accounts crops are unchanged after owner attacks'
);
set local role anon;
select throws_ok($$ update public.garden_crops set proportion = 999 $$, '42501', null,
  'anon cannot update crops');
select throws_ok($$ delete from public.garden_crops $$, '42501', null,
  'anon cannot delete crops');
reset role;
select is(
  (select jsonb_agg(to_jsonb(c) order by garden_id, crop_id) from public.garden_crops c),
  current_setting('test.before_crop_attacks')::jsonb,
  'privileged read-back confirms both accounts crops survive anonymous attacks unchanged'
);

select * from finish();
rollback;
