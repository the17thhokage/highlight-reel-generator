-- Migration 004: Create database webhook trigger for upload status changes
-- This trigger calls the notify-on-status-change Edge Function
-- when the uploads.status column is updated

create or replace function public.notify_upload_status_change()
returns trigger as $$
declare
  payload json;
  edge_function_url text;
begin
  -- Only fire when status actually changes
  if old.status = new.status then
    return new;
  end if;

  -- Only notify for terminal statuses
  if new.status not in ('ready', 'failed') then
    return new;
  end if;

  payload := json_build_object(
    'type', 'UPDATE',
    'table', 'uploads',
    'schema', 'public',
    'record', json_build_object(
      'id', new.id,
      'status', new.status,
      'push_token', new.push_token,
      'original_filename', new.original_filename
    ),
    'old_record', json_build_object(
      'id', old.id,
      'status', old.status
    )
  );

  -- Use pg_net to call the Edge Function asynchronously
  -- The Edge Function URL should be configured as a database secret
  -- For now, use Supabase's built-in webhook support
  perform pg_notify('upload_status_change', payload::text);

  return new;
end;
$$ language plpgsql;

create trigger on_upload_status_change
  after update of status on public.uploads
  for each row execute function public.notify_upload_status_change();
