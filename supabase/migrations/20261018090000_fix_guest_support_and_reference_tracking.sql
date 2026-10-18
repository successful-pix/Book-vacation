-- Fix guest access policies without invoking authenticated-only admin checks for anon.
drop policy if exists "Support conversations owner or guest token reads" on public.support_conversations;
create policy "Support conversations guest token reads" on public.support_conversations
for select to anon
using (guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), ''));
create policy "Support conversations owner or admin reads" on public.support_conversations
for select to authenticated
using (public.is_book_vacation_admin() or (customer_user_id is not null and customer_user_id = (select auth.uid())) or guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), ''));

drop policy if exists "Support messages owner or guest token reads" on public.support_messages;
create policy "Support messages guest token reads" on public.support_messages
for select to anon
using (exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and c.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), '')));
create policy "Support messages owner or admin reads" on public.support_messages
for select to authenticated
using (public.is_book_vacation_admin() or exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and ((c.customer_user_id is not null and c.customer_user_id = (select auth.uid())) or c.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), ''))));

drop policy if exists "Support messages customer or agent insert" on public.support_messages;
create policy "Support messages guest customer insert" on public.support_messages
for insert to anon
with check (sender_type = 'customer' and sender_user_id is null and exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and c.customer_user_id is null and c.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), '')));
create policy "Support messages authenticated customer or agent insert" on public.support_messages
for insert to authenticated
with check (
 (sender_type = 'agent' and sender_user_id = (select auth.uid()) and public.is_book_vacation_admin())
 or (sender_type = 'customer' and (
   (sender_user_id is null and exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and c.customer_user_id is null and c.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-support-access-token'), '')))
   or (sender_user_id = (select auth.uid()) and exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and c.customer_user_id = (select auth.uid())))
 ))
);

drop policy if exists "Ticket request owner or guest reads" on public.ticket_requests;
create policy "Ticket request guest token reads" on public.ticket_requests
for select to anon
using (guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-ticket-access-token'), ''));
create policy "Ticket request owner or admin reads" on public.ticket_requests
for select to authenticated
using (public.is_book_vacation_admin() or (customer_user_id is not null and customer_user_id = (select auth.uid())) or guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-ticket-access-token'), ''));

drop policy if exists "Ticket receipt owner or authorised reads" on public.ticket_payment_receipts;
create policy "Ticket receipt guest token reads" on public.ticket_payment_receipts
for select to anon
using (exists (select 1 from public.ticket_requests t where t.id = ticket_payment_receipts.request_id and t.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-ticket-access-token'), '')));
create policy "Ticket receipt owner or admin reads" on public.ticket_payment_receipts
for select to authenticated
using (public.is_book_vacation_admin() or exists (select 1 from public.ticket_requests t where t.id = ticket_payment_receipts.request_id and ((t.customer_user_id is not null and t.customer_user_id = (select auth.uid())) or t.guest_access_token::text = nullif((current_setting('request.headers', true)::jsonb ->> 'x-ticket-access-token'), ''))));

-- Public reference lookup returns itinerary/status only, never PII or the private guest token.
create or replace function public.lookup_ticket_request_by_reference(p_reference text)
returns jsonb language sql stable security definer set search_path = public
as $function$
 select jsonb_build_object(
  'id',t.id,'booking_reference',t.booking_reference,'country_code',t.country_code,'country_name',t.country_name,
  'origin',t.origin,'destination',t.destination,'trip_type',t.trip_type,'departure_date',t.departure_date,
  'return_date',t.return_date,'travellers_count',t.travellers_count,'cabin_class',t.cabin_class,
  'ticket_amount',t.ticket_amount,'currency',t.currency,'status',t.status,'payment_status',t.payment_status,
  'payment_account_name',t.payment_account_name,'payment_bank',t.payment_bank,'payment_account_number',t.payment_account_number,
  'payment_instructions',t.payment_instructions,'payment_deadline_at',t.payment_deadline_at,
  'ticket_number',t.ticket_number,'ticket_details',t.ticket_details,'created_at',t.created_at)
 from public.ticket_requests t where t.booking_reference = upper(trim(p_reference)) limit 1;
$function$;
revoke all on function public.lookup_ticket_request_by_reference(text) from public;
grant execute on function public.lookup_ticket_request_by_reference(text) to anon, authenticated;
