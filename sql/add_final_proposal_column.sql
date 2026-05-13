-- Add final_proposal column to briefs table
-- Run this in Supabase SQL Editor

ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS final_proposal text DEFAULT NULL;
