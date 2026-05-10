-- Emergency fix for "JSON object requested, multiple rows returned" error
-- Run this in Supabase SQL Editor immediately

-- Step 1: Check current duplicates
SELECT 'Checking for duplicate business_owners:' as status;
SELECT user_id, COUNT(*) as count, array_agg(id order by created_at desc) as ids
FROM public.business_owners 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 2: Safely remove duplicates - keep only the newest for each user
SELECT 'Removing duplicate business_owners...' as status;
DELETE FROM public.business_owners 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM public.business_owners 
    ORDER BY user_id, created_at DESC
);

-- Step 3: Verify no more duplicates
SELECT 'Verifying duplicates removed:' as status;
SELECT user_id, COUNT(*) as count
FROM public.business_owners 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 4: Drop and recreate all RLS policies with proper IN operator
SELECT 'Recreating RLS policies...' as status;

-- Drop existing policies
DROP POLICY IF EXISTS "owner: select own clients" ON public.clients;
DROP POLICY IF EXISTS "owner: insert own clients" ON public.clients;
DROP POLICY IF EXISTS "owner: update own clients" ON public.clients;
DROP POLICY IF EXISTS "owner: delete own clients" ON public.clients;

DROP POLICY IF EXISTS "owner: select own briefs" ON public.briefs;
DROP POLICY IF EXISTS "owner: insert own briefs" ON public.briefs;
DROP POLICY IF EXISTS "owner: update own briefs" ON public.briefs;
DROP POLICY IF EXISTS "owner: delete own briefs" ON public.briefs;

DROP POLICY IF EXISTS "owner: select own feedback" ON public.feedback;

-- Recreate policies with IN operator
CREATE POLICY "owner: select own clients"
  ON public.clients FOR SELECT
  USING (
    owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
  );

CREATE POLICY "owner: insert own clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
  );

CREATE POLICY "owner: update own clients"
  ON public.clients FOR UPDATE
  USING (
    owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
  );

CREATE POLICY "owner: delete own clients"
  ON public.clients FOR DELETE
  USING (
    owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
  );

CREATE POLICY "owner: select own briefs"
  ON public.briefs FOR SELECT
  USING (
    owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
  );

CREATE POLICY "owner: insert own briefs"
  ON public.briefs FOR INSERT
  WITH CHECK (
    owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
  );

CREATE POLICY "owner: update own briefs"
  ON public.briefs FOR UPDATE
  USING (
    owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
  );

CREATE POLICY "owner: delete own briefs"
  ON public.briefs FOR DELETE
  USING (
    owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
  );

CREATE POLICY "owner: select own feedback"
  ON public.feedback FOR SELECT
  USING (
    brief_id IN (
      SELECT b.id FROM public.briefs b
      WHERE b.owner_id IN (SELECT id FROM public.business_owners WHERE user_id = auth.uid())
    )
  );

SELECT 'Emergency fix completed!' as status;
