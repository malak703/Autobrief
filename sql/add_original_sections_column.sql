-- Add original_sections column to store the initial AI-generated content
-- This allows diffing against edits made by the employee or client
-- Run this in Supabase SQL Editor

ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS original_sections jsonb DEFAULT NULL;
