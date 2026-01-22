# Supabase Storage Setup for Property Images

## Overview
Your app now uses Supabase Storage to store property images instead of base64 encoding them in the database. This fixes the "Save failed" error and allows images to persist properly.

## What Changed

### Before (Problem):
- Images were converted to base64 strings (very large)
- Stored directly in the database JSON field
- Caused 520 errors due to payload size
- Were excluded from saves, so never persisted

### After (Solution):
- Images uploaded directly to Supabase Storage
- Only URL strings stored in database
- Much smaller payload, no more errors
- Images persist and load fast

## Setup Required

You need to create a Storage bucket in Supabase:

### Step 1: Create the Storage Bucket

1. Go to **https://supabase.com** → Your project
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `property-images`
   - **Public**: ✅ **YES** (check the box)
   - **File size limit**: 5 MB (default is fine)
   - **Allowed MIME types**: Leave empty (allows all image types)
5. Click **Create bucket**

### Step 2: Set Bucket Permissions (IMPORTANT!)

By default, the bucket will have no access policies. You need to add policies so users can upload and read their own images:

1. After creating the bucket, click on it
2. Go to the **Policies** tab
3. Click **New Policy**

#### Policy 1: Allow Users to Upload Their Own Images

Click **"Create policy from scratch"** and configure:
- **Policy Name**: `Allow authenticated users to upload images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'property-images'::text)
  ```

Or use this SQL in the SQL Editor:
```sql
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');
```

#### Policy 2: Allow Users to Read All Images

Click **New Policy** again:
- **Policy Name**: `Allow public read access to images`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`, `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'property-images'::text)
  ```

Or use this SQL:
```sql
CREATE POLICY "Allow public read access to images"
ON storage.objects
FOR SELECT
TO public, authenticated
USING (bucket_id = 'property-images');
```

#### Policy 3: Allow Users to Delete Their Own Images

Click **New Policy** again:
- **Policy Name**: `Allow users to delete their own images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'property-images'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
  ```

Or use this SQL:
```sql
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Verify Setup

1. Refresh your app (http://localhost:3000)
2. Go to a project
3. Try uploading an image
4. If successful, the image should:
   - Upload instantly
   - Display in the project
   - Still be there after refreshing the page
   - Show on the projects list page as a thumbnail

## Quick SQL Setup (All-in-One)

If you prefer, you can run all the policies at once in the Supabase SQL Editor:

```sql
-- Create storage bucket (if not created via UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Allow public read access
CREATE POLICY "Allow public read access to images"
ON storage.objects
FOR SELECT
TO public, authenticated
USING (bucket_id = 'property-images');

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## How It Works Now

1. **Upload Process**:
   - User selects image(s)
   - Image uploaded to `/api/upload` endpoint
   - API uploads to Supabase Storage at path: `{user_id}/{project_id}/{timestamp}.{ext}`
   - Returns public URL
   - URL saved to database in `projects.images` array

2. **Display Process**:
   - Images array contains URL strings
   - Project card shows first image as thumbnail
   - Project detail page shows all images in gallery
   - Zillow preview shows images in carousel

3. **Delete Process**:
   - User clicks delete button
   - Image URL removed from database array
   - (Storage file remains, but is unreferenced - can clean up later with cron job)

## Troubleshooting

### "Failed to upload image to storage"
- Make sure the bucket is created
- Make sure the bucket name is exactly `property-images`
- Check that upload policies are in place

### "403 Forbidden" on image URLs
- Make sure the bucket is set to **public**
- Check that read policies are in place

### Images don't show after refresh
- Make sure the SQL indexes from `performance-indexes.sql` are applied
- Check that images are being saved to the database (not excluded from payload)

## Cleanup Old Projects

If you have projects from before this update, they may have images in the old format (objects with `id`, `url`, `caption`). The code handles both formats gracefully, but you can clean them up:

```sql
-- Find projects with old image format
SELECT id, title, images FROM projects WHERE images::text LIKE '%"id":%';

-- If you want to clean them up (removes all images from old projects)
UPDATE projects 
SET images = '[]'::jsonb 
WHERE images::text LIKE '%"id":%';
```

## Next Steps

After setting up the storage bucket, your images will:
- ✅ Upload and save correctly
- ✅ Display on project cards
- ✅ Persist after page refresh
- ✅ Load fast (served from Supabase CDN)
- ✅ No more "Save failed" errors



