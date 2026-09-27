begin;

select plan(25);

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

select * from finish();
rollback;
