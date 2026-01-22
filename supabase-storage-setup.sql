-- =====================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- =====================================================
-- This script sets up storage buckets for file uploads
-- Run this in your Supabase SQL editor
-- =====================================================

-- Create storage bucket for general uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES - Allow authenticated users to upload
-- =====================================================

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public read access to all files in uploads bucket
CREATE POLICY "Public can read uploaded files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- NOTES:
-- - Files are organized by user ID in folders
-- - File path format: {user_id}/{category}/{filename}
-- - Categories: logos, listings, clients, documents
-- - 10MB file size limit per file
-- =====================================================


