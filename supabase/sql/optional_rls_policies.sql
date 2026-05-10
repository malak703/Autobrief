-- Run in Supabase → SQL Editor if `clients` / `business_owners` queries return empty or errors under RLS.
-- Adjust names only if your schema differs.

-- Example: business_owners — one row per auth user
-- alter table business_owners enable row level security;

-- create policy "business_owners_select_own"
-- on business_owners for select
-- using (user_id = auth.uid());

-- create policy "business_owners_insert_own"
-- on business_owners for insert
-- with check (user_id = auth.uid());

-- create policy "business_owners_update_own"
-- on business_owners for update
-- using (user_id = auth.uid());

-- Example: clients — scoped to owner_id → business_owners.id for this user
-- alter table clients enable row level security;

-- create policy "clients_select_own"
-- on clients for select
-- using (
--   owner_id = (select id from business_owners where user_id = auth.uid())
-- );

-- create policy "clients_insert_own"
-- on clients for insert
-- with check (
--   owner_id = (select id from business_owners where user_id = auth.uid())
-- );

-- create policy "clients_update_own"
-- on clients for update
-- using (
--   owner_id = (select id from business_owners where user_id = auth.uid())
-- );

-- create policy "clients_delete_own"
-- on clients for delete
-- using (
--   owner_id = (select id from business_owners where user_id = auth.uid())
-- );
