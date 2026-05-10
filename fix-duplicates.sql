-- Run these SQL commands in your Supabase SQL Editor to fix duplicate business owners

-- First, check for duplicates
SELECT user_id, COUNT(*) as count 
FROM business_owners 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Keep only the latest business owner record for each user
DELETE FROM business_owners 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM business_owners 
    ORDER BY user_id, created_at DESC
);

-- Verify no more duplicates
SELECT user_id, COUNT(*) as count 
FROM business_owners 
GROUP BY user_id 
HAVING COUNT(*) > 1;
