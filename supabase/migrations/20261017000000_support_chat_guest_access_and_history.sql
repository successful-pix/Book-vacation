create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_reference text not null unique default ('BVH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_user_id uuid null references auth.users(id) on delete set null,
  guest_access_token uuid not null default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 160),
  customer_email text not null check (char_length(customer_email) between 5 and 320),
  subject text not null check (char_length(subject) between 3 and 180),
  status text not null default 'open' check (status in ('open','waiting_customer','waiting_support','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_user_id uuid null references auth.users(id) on delete set null,
  sender_type text not null check (sender_type in ('customer','agent')),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists support_conversations_customer_user_id_idx on public.support_conversations(customer_user_id);
create index if not exists support_conversations_created_at_idx on public.support_conversations(created_at desc);
create index if not exists support_messages_conversation_created_idx on public.support_messages(conversation_id, created_at);
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
grant select, insert, update on public.support_conversations to anon, authenticated;
grant select, insert on public.support_messages to anon, authenticated;
drop policy if exists "Support conversations owner or guest token reads" on public.support_conversations;
create policy "Support conversations owner or guest token reads" on public.support_conversations for select to anon, authenticated using (
  public.is_book_vacation_admin()
  or (customer_user_id is not null and customer_user_id = (select auth.uid()))
  or guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), '')
);
drop policy if exists "Support conversations secure customer insert" on public.support_conversations;
create policy "Support conversations secure customer insert" on public.support_conversations for insert to anon, authenticated with check (
  (customer_user_id is null or customer_user_id = (select auth.uid()))
  and guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), '')
);
drop policy if exists "Support conversations admin update" on public.support_conversations;
create policy "Support conversations admin update" on public.support_conversations for update to authenticated using (public.is_book_vacation_admin()) with check (public.is_book_vacation_admin());
drop policy if exists "Support messages owner or guest token reads" on public.support_messages;
create policy "Support messages owner or guest token reads" on public.support_messages for select to anon, authenticated using (
  public.is_book_vacation_admin()
  or exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and (
    (c.customer_user_id is not null and c.customer_user_id = (select auth.uid()))
    or c.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), '')
  ))
);
drop policy if exists "Support messages customer or agent insert" on public.support_messages;
create policy "Support messages customer or agent insert" on public.support_messages for insert to anon, authenticated with check (
  (sender_type = 'agent' and sender_user_id = (select auth.uid()) and public.is_book_vacation_admin())
  or (sender_type = 'customer' and (
    (sender_user_id is null and exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and c.customer_user_id is null and c.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), ''))
    or (sender_user_id = (select auth.uid()) and exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and c.customer_user_id = (select auth.uid())))
  ))
);
