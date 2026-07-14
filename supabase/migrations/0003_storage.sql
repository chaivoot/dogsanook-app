-- ============================================================================
-- dogsanook-app · Storage bucket for dog & session photos
--
-- NOTE: this bucket is created with public read so photo URLs can be rendered
-- directly in <img> tags. Anyone who knows a photo's URL can view it, but the
-- URLs are unguessable (uuid paths) and the images are not sensitive. To
-- harden later, set `public = false` and switch the app to signed URLs.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

-- Public read (anon + authenticated). --------------------------------------
create policy "dog-photos read"
  on storage.objects for select
  using (bucket_id = 'dog-photos');

-- Any approved user may upload. --------------------------------------------
create policy "dog-photos insert"
  on storage.objects for insert
  with check (bucket_id = 'dog-photos' and public.is_allowed());

-- Uploader or staff may modify / remove. -----------------------------------
create policy "dog-photos update"
  on storage.objects for update
  using (bucket_id = 'dog-photos' and (owner = auth.uid() or public.is_staff()));

create policy "dog-photos delete"
  on storage.objects for delete
  using (bucket_id = 'dog-photos' and (owner = auth.uid() or public.is_staff()));
