alter table if exists posts
  add column if not exists media_url text;

alter table if exists posts
  add column if not exists media_type text;

alter table if exists posts
  drop constraint if exists posts_media_type_check;

alter table if exists posts
  add constraint posts_media_type_check check (media_type is null or media_type in ('image', 'video'));

-- Ask PostgREST to refresh schema cache after manual SQL execution.
notify pgrst, 'reload schema';
