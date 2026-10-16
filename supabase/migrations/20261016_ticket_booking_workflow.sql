-- Ticket request workflow, localized display prices, private receipt storage and RLS.
create table if not exists public.ticket_requests (
 id uuid primary key default gen_random_uuid(),
 booking_reference text not null unique default ('BVT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
 guest_access_token uuid not null default gen_random_uuid(),
 customer_user_id uuid references auth.users(id) on delete set null,
 customer_name text not null check (char_length(customer_name) between 2 and 160),
 customer_email text not null check (char_length(customer_email) between 5 and 320),
 customer_phone text not null check (char_length(customer_phone) between 5 and 40),
 country_code text not null check (char_length(country_code)=2),
 country_name text not null,
 origin text not null check (char_length(origin) between 2 and 160),
 destination text not null check (char_length(destination) between 2 and 160),
 trip_type text not null check (trip_type in ('oneway','roundtrip')),
 departure_date date not null,
 return_date date,
 travellers_count integer not null default 1 check (travellers_count between 1 and 9),
 cabin_class text not null default 'economy' check (cabin_class in ('economy','premium','business','first')),
 ticket_amount numeric(12,2) not null default 3500 check (ticket_amount >= 0),
 currency text not null default 'USD',
 status text not null default 'pending' check (status in ('pending','awaiting_payment','receipt_submitted','paid','rejected','confirmed','cancelled')),
 payment_status text not null default 'unpaid' check (payment_status in ('unpaid','submitted','paid','rejected')),
 payment_account_name text not null default '',
 payment_bank text not null default '',
 payment_account_number text not null default '',
 payment_instructions text not null default '',
 ticket_details text not null default '',
 operations_note text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint ticket_return_date_check check ((trip_type='oneway' and return_date is null) or (trip_type='roundtrip' and return_date is not null and return_date >= departure_date))
);
create index if not exists ticket_requests_created_at_idx on public.ticket_requests(created_at desc);
create index if not exists ticket_requests_booking_reference_idx on public.ticket_requests(booking_reference);
create or replace function public.set_ticket_request_price()
returns trigger language plpgsql set search_path=public as $$
begin
 new.currency := case upper(new.country_code)
  when 'BR' then 'BRL' when 'GB' then 'GBP' when 'VN' then 'VND' when 'MX' then 'MXN'
  when 'NG' then 'NGN' when 'CA' then 'CAD' when 'AU' then 'AUD' when 'NZ' then 'NZD'
  when 'JP' then 'JPY' when 'IN' then 'INR' when 'ZA' then 'ZAR' when 'AE' then 'AED'
  when 'SG' then 'SGD' when 'CN' then 'CNY' when 'TH' then 'THB' when 'ID' then 'IDR'
  when 'KR' then 'KRW' when 'KE' then 'KES' when 'GH' then 'GHS' when 'TR' then 'TRY'
  when 'PH' then 'PHP' when 'MY' then 'MYR' when 'PK' then 'PKR' when 'EG' then 'EGP'
  when 'SA' then 'SAR' when 'CH' then 'CHF' when 'NO' then 'NOK' when 'SE' then 'SEK'
  when 'DK' then 'DKK' when 'PL' then 'PLN' when 'CZ' then 'CZK' when 'HU' then 'HUF'
  when 'RU' then 'RUB' when 'UA' then 'UAH' when 'IL' then 'ILS' when 'AR' then 'ARS'
  when 'CL' then 'CLP' when 'CO' then 'COP' when 'PE' then 'PEN' when 'HK' then 'HKD'
  when 'TW' then 'TWD' when 'BD' then 'BDT' when 'LK' then 'LKR' when 'NP' then 'NPR'
  when 'MA' then 'MAD' when 'TN' then 'TND' when 'QA' then 'QAR' when 'KW' then 'KWD'
  when 'BH' then 'BHD' when 'OM' then 'OMR' when 'IS' then 'ISK' when 'IE' then 'EUR'
  when 'FR' then 'EUR' when 'DE' then 'EUR' when 'IT' then 'EUR' when 'ES' then 'EUR'
  when 'PT' then 'EUR' when 'NL' then 'EUR' when 'BE' then 'EUR' when 'AT' then 'EUR'
  when 'GR' then 'EUR' when 'FI' then 'EUR' when 'LU' then 'EUR' when 'CY' then 'EUR'
  when 'EE' then 'EUR' when 'LV' then 'EUR' when 'LT' then 'EUR' when 'SK' then 'EUR'
  when 'SI' then 'EUR' when 'HR' then 'EUR' when 'MT' then 'EUR' when 'RO' then 'RON'
  when 'BG' then 'BGN' when 'RS' then 'RSD' when 'AL' then 'ALL' when 'BA' then 'BAM'
  when 'MK' then 'MKD' when 'GE' then 'GEL' when 'AM' then 'AMD' when 'AZ' then 'AZN'
  else 'USD' end;
 new.ticket_amount := case when new.trip_type='roundtrip' then 2300 else 3500 end;
 new.updated_at := now();
 return new;
end $$;
drop trigger if exists ticket_request_price_before_insert on public.ticket_requests;
create trigger ticket_request_price_before_insert before insert on public.ticket_requests for each row execute function public.set_ticket_request_price();

create table if not exists public.ticket_payment_receipts (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.ticket_requests(id) on delete cascade,
 booking_reference text not null,
 receipt_path text not null,
 payment_reference text not null default '',
 status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
 operations_note text not null default '',
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index if not exists ticket_payment_receipts_request_idx on public.ticket_payment_receipts(request_id,created_at desc);
alter table public.ticket_requests enable row level security;
alter table public.ticket_payment_receipts enable row level security;
drop policy if exists "Ticket request insert" on public.ticket_requests;
create policy "Ticket request insert" on public.ticket_requests for insert to anon, authenticated
 with check ((customer_user_id is null or customer_user_id=(select auth.uid())) and guest_access_token is not null);
drop policy if exists "Ticket request owner or guest reads" on public.ticket_requests;
create policy "Ticket request owner or guest reads" on public.ticket_requests for select to anon, authenticated
 using (public.is_book_vacation_admin() or (customer_user_id is not null and customer_user_id=(select auth.uid())) or guest_access_token::text=nullif((current_setting('request.headers',true)::jsonb ->> 'x-ticket-access-token'),''));
drop policy if exists "Ticket request authorised updates" on public.ticket_requests;
create policy "Ticket request authorised updates" on public.ticket_requests for update to authenticated using (public.is_book_vacation_admin()) with check (public.is_book_vacation_admin());
drop policy if exists "Ticket receipt insert with guest token" on public.ticket_payment_receipts;
create policy "Ticket receipt insert with guest token" on public.ticket_payment_receipts for insert to anon, authenticated
 with check (exists(select 1 from public.ticket_requests t where t.id=request_id and t.booking_reference=public.ticket_payment_receipts.booking_reference and t.guest_access_token::text=nullif((current_setting('request.headers',true)::jsonb ->> 'x-ticket-access-token'),'')));
drop policy if exists "Ticket receipt owner or authorised reads" on public.ticket_payment_receipts;
create policy "Ticket receipt owner or authorised reads" on public.ticket_payment_receipts for select to anon, authenticated
 using (public.is_book_vacation_admin() or exists(select 1 from public.ticket_requests t where t.id=request_id and ((t.customer_user_id is not null and t.customer_user_id=(select auth.uid())) or t.guest_access_token::text=nullif((current_setting('request.headers',true)::jsonb ->> 'x-ticket-access-token'),''))));
drop policy if exists "Ticket receipt authorised updates" on public.ticket_payment_receipts;
create policy "Ticket receipt authorised updates" on public.ticket_payment_receipts for update to authenticated using (public.is_book_vacation_admin()) with check (public.is_book_vacation_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('ticket-payment-receipts','ticket-payment-receipts',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];
drop policy if exists "Ticket guests upload own receipt" on storage.objects;
create policy "Ticket guests upload own receipt" on storage.objects for insert to anon, authenticated
 with check (bucket_id='ticket-payment-receipts' and exists(select 1 from public.ticket_requests t where t.id::text=(storage.foldername(name))[1] and t.guest_access_token::text=nullif((current_setting('request.headers',true)::jsonb ->> 'x-ticket-access-token'),'')));
drop policy if exists "Ticket authorised view receipts" on storage.objects;
create policy "Ticket authorised view receipts" on storage.objects for select to authenticated using (bucket_id='ticket-payment-receipts' and public.is_book_vacation_admin());
