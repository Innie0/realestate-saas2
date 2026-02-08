-- Add image support to tasks table
-- Run this in your Supabase SQL Editor

-- Add image columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT FALSE;

-- Create index for filtering tasks with images
CREATE INDEX IF NOT EXISTS idx_tasks_has_image ON tasks(has_image) WHERE has_image = TRUE;
