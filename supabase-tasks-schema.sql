-- Tasks table for AI-powered task generation
-- Run this in your Supabase SQL Editor

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  output TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can create their own tasks
CREATE POLICY "Users can create own tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);


