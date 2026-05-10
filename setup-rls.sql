-- Run these SQL commands in your Supabase SQL Editor to enable Row Level Security
-- This will ensure users can only see their own clients

-- Enable RLS on business_owners table
alter table business_owners enable row level security;

-- Create policies for business_owners
create policy "business_owners_select_own"
on business_owners for select
using (user_id = auth.uid());

create policy "business_owners_insert_own"
on business_owners for insert
with check (user_id = auth.uid());

create policy "business_owners_update_own"
on business_owners for update
using (user_id = auth.uid());

-- Enable RLS on clients table
alter table clients enable row level security;

-- Create policies for clients (safer version that handles duplicates)
create policy "clients_select_own"
on clients for select
using (
  owner_id IN (select id from business_owners where user_id = auth.uid())
);

create policy "clients_insert_own"
on clients for insert
with check (
  owner_id IN (select id from business_owners where user_id = auth.uid())
);

create policy "clients_update_own"
on clients for update
using (
  owner_id IN (select id from business_owners where user_id = auth.uid())
);

create policy "clients_delete_own"
on clients for delete
using (
  owner_id IN (select id from business_owners where user_id = auth.uid())
);
