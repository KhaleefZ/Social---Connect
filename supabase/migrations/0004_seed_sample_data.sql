-- Demo seed data for local/testing environments.
-- Passwords:
-- demo_alex / Password@123
-- demo_priya / Welcome@123
-- demo_harish / Social@123

insert into users (
  id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  bio,
  avatar_url,
  location,
  website
)
values
  (
    'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c01',
    'alex.demo@socialconnect.app',
    'demo_alex',
    '$2a$10$BnzRNWBHTPMl/GhsGsxjEOMvrVJUA4ZdRb7JzQWO7mfvJwr/lJG/O',
    'Alex',
    'Morgan',
    'Street and travel photography.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    'Chennai',
    'https://example.com/alex'
  ),
  (
    'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c02',
    'priya.demo@socialconnect.app',
    'demo_priya',
    '$2a$10$U1f4gHGePROKmzCq8tIi7u5tLGf129Uap9AxNsvOEbT3v5FldYgye',
    'Priya',
    'Raman',
    'Coffee spots, coding, and city lights.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'Coimbatore',
    'https://example.com/priya'
  ),
  (
    'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c03',
    'harish.demo@socialconnect.app',
    'demo_harish',
    '$2a$10$Rw2WcXMhz08rrgRjFU9ML.sLbVaQcKX3wNXlDK1iq9VHFIYQKFwau',
    'Harish',
    'K',
    'Video snippets and weekend rides.',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    'Bengaluru',
    'https://example.com/harish'
  )
on conflict (id) do update set
  email = excluded.email,
  username = excluded.username,
  password_hash = excluded.password_hash,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  location = excluded.location,
  website = excluded.website;

insert into posts (
  id,
  author_id,
  content,
  media_url,
  media_type,
  is_active
)
values
  (
    'b8c5bbf1-f26b-44cd-94a8-324c8f230101',
    'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c01',
    'Golden hour from Marina beach today.',
    'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80',
    'image',
    true
  ),
  (
    'b8c5bbf1-f26b-44cd-94a8-324c8f230102',
    'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c02',
    'Late evening code + coffee setup.',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    'image',
    true
  ),
  (
    'b8c5bbf1-f26b-44cd-94a8-324c8f230103',
    'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c03',
    'Weekend ride recap reel.',
    'https://file-examples.com/storage/fe7b5f7f3f1f9f2ca4f9f5e/2017/04/file_example_MP4_480_1_5MG.mp4',
    'video',
    true
  )
on conflict (id) do update set
  content = excluded.content,
  media_url = excluded.media_url,
  media_type = excluded.media_type,
  is_active = excluded.is_active;

insert into follows (id, follower_id, following_id)
values
  ('c1f5ac5f-6a84-4a0a-9d09-8d0dc3d18011', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c01', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c02'),
  ('c1f5ac5f-6a84-4a0a-9d09-8d0dc3d18012', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c02', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c03'),
  ('c1f5ac5f-6a84-4a0a-9d09-8d0dc3d18013', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c03', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c01')
on conflict do nothing;

insert into messages (id, sender_id, recipient_id, content)
values
  ('d5f5c5ff-4cb9-4f8a-8f7a-4de9f5dc1001', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c01', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c02', 'Hey Priya, did you check today''s feed design?'),
  ('d5f5c5ff-4cb9-4f8a-8f7a-4de9f5dc1002', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c02', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c01', 'Yes, the spacing is much cleaner now.'),
  ('d5f5c5ff-4cb9-4f8a-8f7a-4de9f5dc1003', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c03', 'a6f5ad65-6ec4-47f0-b401-a4c9ac5d4c02', 'Let us post one short video for testing.')
on conflict do nothing;

notify pgrst, 'reload schema';
