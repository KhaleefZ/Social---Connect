create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint messages_content_length check (char_length(content) <= 2000),
  constraint messages_no_self_send check (sender_id <> recipient_id)
);

create index if not exists messages_sender_created_at_idx on messages (sender_id, created_at desc);
create index if not exists messages_recipient_created_at_idx on messages (recipient_id, created_at desc);

notify pgrst, 'reload schema';
