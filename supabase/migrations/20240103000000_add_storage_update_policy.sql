-- Add UPDATE policy for storage.objects so that upsert works on home-media bucket
create policy "home_media_update" on storage.objects
  for update using (
    bucket_id = 'home-media'
    and auth.uid() is not null
  )
  with check (
    bucket_id = 'home-media'
    and auth.uid() is not null
  );
