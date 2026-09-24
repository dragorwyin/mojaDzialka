begin;

select plan(18);

-- Fixture creation is privileged setup; every assertion about client access
-- below runs as anon or authenticated with the corresponding JWT identity.
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
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'garden-owner-one@example.test',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'garden-owner-two@example.test',
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
select throws_ok(
  $$
    insert into public.gardens (user_id)
    values ('90000000-0000-4000-8000-000000000009')
  $$,
  '23503',
  null,
  'a garden cannot reference a missing auth user'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select lives_ok(
  $$ insert into public.gardens (user_id) values (auth.uid()) $$,
  'the first user can create their own garden'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000002',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select lives_ok(
  $$ insert into public.gardens (user_id, created_at)
     values (auth.uid(), '2000-01-02 00:00:00+00') $$,
  'the second user can create their own garden'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.gardens),
  1::bigint,
  'the first user can read their own garden'
);
select lives_ok(
  $$
    update public.gardens
    set created_at = '2000-01-01 00:00:01+00'
    where user_id = auth.uid()
  $$,
  'the first user can update their own garden'
);
select ok(
  (select created_at = '2000-01-01 00:00:01+00'::timestamptz
   from public.gardens),
  'the first user update is persisted'
);
select is(
  (select count(*) from public.gardens
   where user_id = '20000000-0000-4000-8000-000000000002'),
  0::bigint,
  'the first user cannot see the second user garden'
);
update public.gardens
set created_at = '2000-01-03 00:00:00+00'
where user_id = '20000000-0000-4000-8000-000000000002';
select throws_ok(
  $$
    update public.gardens
    set user_id = '20000000-0000-4000-8000-000000000002'
    where user_id = auth.uid()
  $$,
  '42501',
  null,
  'the first user cannot reassign their garden to another owner'
);
select throws_ok(
  $$ insert into public.gardens (user_id) values (auth.uid()) $$,
  '23505',
  null,
  'the first user cannot create a second garden'
);
select throws_ok(
  $$ delete from public.gardens where user_id = auth.uid() $$,
  '42501',
  null,
  'the owner cannot delete their garden through the client role'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000002',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select is(
  (select count(*) from public.gardens),
  1::bigint,
  'the second user can read their own garden'
);
select is(
  (select created_at from public.gardens),
  '2000-01-02 00:00:00+00'::timestamptz,
  'the second user garden is unchanged after the first user update attempt'
);
select is(
  (select count(*) from public.gardens
   where user_id = '10000000-0000-4000-8000-000000000001'),
  0::bigint,
  'the second user cannot see the first user garden'
);
update public.gardens
set created_at = '2000-01-04 00:00:00+00'
where user_id = '10000000-0000-4000-8000-000000000001';

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select is(
  (select created_at from public.gardens),
  '2000-01-01 00:00:01+00'::timestamptz,
  'the first user garden is unchanged after the second user update attempt'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.gardens $$,
  '42501',
  null,
  'anon cannot read gardens'
);
select throws_ok(
  $$
    insert into public.gardens (user_id)
    values ('10000000-0000-4000-8000-000000000001')
  $$,
  '42501',
  null,
  'anon cannot create gardens'
);
select throws_ok(
  $$ update public.gardens set created_at = now() $$,
  '42501',
  null,
  'anon cannot update gardens'
);
select throws_ok(
  $$ delete from public.gardens $$,
  '42501',
  null,
  'anon cannot delete gardens'
);

select * from finish();
rollback;
