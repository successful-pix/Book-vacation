-- Support chat attachments are private and tied to the conversation's private access code.
alter table public.support_messages
  add column if not exists attachment_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-chat-attachments',
  'support-chat-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Support chat customers upload attachments" on storage.objects;
create policy "Support chat customers upload attachments"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'support-chat-attachments'
  and array_length(storage.foldername(name), 1) >= 2
  and exists (
    select 1 from public.support_conversations c
    where c.id::text = (storage.foldername(name))[1]
      and c.guest_access_token::text = (storage.foldername(name))[2]
      and (c.customer_user_id is null or c.customer_user_id = (select auth.uid()))
  )
);

drop policy if exists "Support chat customers and staff view attachments" on storage.objects;
drop policy if exists "Support chat guest customer view attachments" on storage.objects;
drop policy if exists "Support chat authenticated customer and staff view attachments" on storage.objects;
create policy "Support chat guest customer view attachments"
on storage.objects for select to anon
using (
  bucket_id = 'support-chat-attachments'
  and exists (
    select 1 from public.support_conversations c
    where c.id::text = (storage.foldername(name))[1]
      and c.guest_access_token::text = (storage.foldername(name))[2]
      and c.customer_user_id is null
  )
);

create policy "Support chat authenticated customer and staff view attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'support-chat-attachments'
  and (
    public.is_book_vacation_admin()
    or exists (
      select 1 from public.support_conversations c
      where c.id::text = (storage.foldername(name))[1]
        and c.guest_access_token::text = (storage.foldername(name))[2]
        and (c.customer_user_id is null or c.customer_user_id = (select auth.uid()))
    )
  )
);

drop policy if exists "Support messages guest customer insert" on public.support_messages;
create policy "Support messages guest customer insert" on public.support_messages
for insert to anon
with check (
  sender_type = 'customer'
  and sender_user_id is null
  and exists (
    select 1 from public.support_conversations c
    where c.id = support_messages.conversation_id
      and c.customer_user_id is null
      and c.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), '')
      and (
        support_messages.attachment_path is null
        or (
          (storage.foldername(support_messages.attachment_path))[1] = c.id::text
          and (storage.foldername(support_messages.attachment_path))[2] = c.guest_access_token::text
        )
      )
  )
);

drop policy if exists "Support messages authenticated customer or agent insert" on public.support_messages;
create policy "Support messages authenticated customer or agent insert" on public.support_messages
for insert to authenticated
with check (
  (
    sender_type = 'agent'
    and sender_user_id = (select auth.uid())
    and public.is_book_vacation_admin()
  )
  or (
    sender_type = 'customer'
    and (
      (
        sender_user_id is null
        and exists (
          select 1 from public.support_conversations c
          where c.id = support_messages.conversation_id
            and c.customer_user_id is null
            and c.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), '')
            and (
              support_messages.attachment_path is null
              or (
                (storage.foldername(support_messages.attachment_path))[1] = c.id::text
                and (storage.foldername(support_messages.attachment_path))[2] = c.guest_access_token::text
              )
            )
        )
      )
      or (
        sender_user_id = (select auth.uid())
        and exists (
          select 1 from public.support_conversations c
          where c.id = support_messages.conversation_id
            and c.customer_user_id = (select auth.uid())
            and (
              support_messages.attachment_path is null
              or (
                (storage.foldername(support_messages.attachment_path))[1] = c.id::text
                and (storage.foldername(support_messages.attachment_path))[2] = c.guest_access_token::text
              )
            )
        )
      )
    )
  )
);
