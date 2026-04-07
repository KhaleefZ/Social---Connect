create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text not null unique,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  phone_number text,
  bio text,
  avatar_url text,
  website text,
  location text,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_username_format check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  constraint users_bio_length check (bio is null or char_length(bio) <= 160)
);

alter table if exists users
  add column if not exists phone_number text;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  content text not null,
  media_url text,
  media_type text,
  is_active boolean not null default true,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_content_length check (char_length(content) <= 280),
  constraint posts_like_count_nonnegative check (like_count >= 0),
  constraint posts_comment_count_nonnegative check (comment_count >= 0),
  constraint posts_media_type_check check (media_type is null or media_type in ('image', 'video'))
);

alter table if exists posts
  add column if not exists media_url text;

alter table if exists posts
  add column if not exists media_type text;

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_length check (char_length(content) <= 280)
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_unique_post_user unique (post_id, user_id)
);

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_unique_pair unique (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create table if not exists revoked_tokens (
  jti uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_author_id_created_at_idx on posts (author_id, created_at desc);
create index if not exists comments_post_id_created_at_idx on comments (post_id, created_at desc);
create index if not exists likes_post_id_user_id_idx on likes (post_id, user_id);
create index if not exists follows_follower_id_idx on follows (follower_id);
create index if not exists follows_following_id_idx on follows (following_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists posts_set_updated_at on posts;
create trigger posts_set_updated_at
before update on posts
for each row execute function set_updated_at();

drop trigger if exists comments_set_updated_at on comments;
create trigger comments_set_updated_at
before update on comments
for each row execute function set_updated_at();

create or replace function increment_post_like_count()
returns trigger as $$
begin
  update posts
  set like_count = like_count + 1
  where id = new.post_id;
  return new;
end;
$$ language plpgsql;

create or replace function decrement_post_like_count()
returns trigger as $$
begin
  update posts
  set like_count = greatest(like_count - 1, 0)
  where id = old.post_id;
  return old;
end;
$$ language plpgsql;

create or replace function increment_post_comment_count()
returns trigger as $$
begin
  if new.is_active then
    update posts
    set comment_count = comment_count + 1
    where id = new.post_id;
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function decrement_post_comment_count()
returns trigger as $$
begin
  if old.is_active then
    update posts
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.post_id;
  end if;
  return old;
end;
$$ language plpgsql;

create or replace function sync_post_comment_count_on_update()
returns trigger as $$
begin
  if old.is_active = true and new.is_active = false then
    update posts
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.post_id;
  elsif old.is_active = false and new.is_active = true then
    update posts
    set comment_count = comment_count + 1
    where id = new.post_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists likes_after_insert_trigger on likes;
create trigger likes_after_insert_trigger
after insert on likes
for each row execute function increment_post_like_count();

drop trigger if exists likes_after_delete_trigger on likes;
create trigger likes_after_delete_trigger
after delete on likes
for each row execute function decrement_post_like_count();

drop trigger if exists comments_after_insert_trigger on comments;
create trigger comments_after_insert_trigger
after insert on comments
for each row execute function increment_post_comment_count();

drop trigger if exists comments_after_update_trigger on comments;
create trigger comments_after_update_trigger
after update of is_active on comments
for each row
when (old.is_active is distinct from new.is_active)
execute function sync_post_comment_count_on_update();

drop trigger if exists comments_after_delete_trigger on comments;
create trigger comments_after_delete_trigger
after delete on comments
for each row execute function decrement_post_comment_count();