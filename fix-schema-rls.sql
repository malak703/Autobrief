-- Updated RLS policies for your schema using IN operator to handle duplicates
-- Run this in Supabase SQL Editor to replace the problematic policies

-- Drop existing policies
drop policy if exists "owner: select own clients" on public.clients;
drop policy if exists "owner: insert own clients" on public.clients;
drop policy if exists "owner: update own clients" on public.clients;
drop policy if exists "owner: delete own clients" on public.clients;

drop policy if exists "owner: select own briefs" on public.briefs;
drop policy if exists "owner: insert own briefs" on public.briefs;
drop policy if exists "owner: update own briefs" on public.briefs;
drop policy if exists "owner: delete own briefs" on public.briefs;

drop policy if exists "owner: select own feedback" on public.feedback;

-- Create updated policies for clients (using IN to handle duplicates)
create policy "owner: select own clients"
  on public.clients for select
  using (
    owner_id IN (select id from public.business_owners where user_id = auth.uid())
  );

create policy "owner: insert own clients"
  on public.clients for insert
  with check (
    owner_id IN (select id from public.business_owners where user_id = auth.uid())
  );

create policy "owner: update own clients"
  on public.clients for update
  using (
    owner_id IN (select id from public.business_owners where user_id = auth.uid())
  );

create policy "owner: delete own clients"
  on public.clients for delete
  using (
    owner_id IN (select id from public.business_owners where user_id = auth.uid())
  );

-- Create updated policies for briefs (using IN to handle duplicates)
create policy "owner: select own briefs"
  on public.briefs for select
  using (
    owner_id IN (select id from public.business_owners where user_id = auth.uid())
  );

create policy "owner: insert own briefs"
  on public.briefs for insert
  with check (
    owner_id IN (select id from public.business_owners where user_id = auth.uid())
  );

create policy "owner: update own briefs"
  on public.briefs for update
  using (
    owner_id IN (select id from public.business_owners where user_id = auth.uid())
  );

create policy "owner: delete own briefs"
  on public.briefs for delete
  using (
    owner_id IN (select id from public.business_owners where user_id = auth.uid())
  );

-- Create updated policy for feedback (using IN to handle duplicates)
create policy "owner: select own feedback"
  on public.feedback for select
  using (
    brief_id IN (
      select b.id from public.briefs b
      where b.owner_id IN (select id from public.business_owners where user_id = auth.uid())
    )
  );
