-- Setup storage bucket for brief assets
-- Run this in Supabase SQL Editor

-- Create the brief-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brief-assets',
  'brief-assets',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
    'application/pdf', 'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Anyone can view brief assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brief-assets');

CREATE POLICY "Authenticated users can upload brief assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brief-assets' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own brief assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'brief-assets' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own brief assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'brief-assets' AND 
    auth.role() = 'authenticated'
  );
