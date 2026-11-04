-- Feedback sent from the in-app "Share Feedback" button.
-- Only the server (service role) reads or writes it, so no user policies are needed.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  type text not null default 'general',
  message text not null,
  page text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;
