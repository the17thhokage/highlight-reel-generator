-- Migration 003: Create raw-uploads storage bucket with RLS policies

insert into storage.buckets (id, name, public)
values ('raw-uploads', 'raw-uploads', false);

-- Users can upload to their own folder
create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'raw-uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files
create policy "Users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'raw-uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
