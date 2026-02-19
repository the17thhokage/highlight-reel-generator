-- Migration 002: Create uploads table with RLS policies

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text unique not null,
  original_filename text not null,
  file_size_bytes bigint not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed')),
  push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.uploads enable row level security;

-- Users can read their own uploads
create policy "Users can select own uploads"
  on public.uploads for select
  using (auth.uid() = user_id);

-- Users can insert their own uploads
create policy "Users can insert own uploads"
  on public.uploads for insert
  with check (auth.uid() = user_id);

-- Only service role can update uploads (for processing pipeline)
-- No user-facing update policy needed

create trigger on_uploads_updated
  before update on public.uploads
  for each row execute function public.handle_updated_at();
