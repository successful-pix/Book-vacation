-- Private driver trip requests, agent directory, and manually recorded payments.
-- This schema was applied directly to the selected Supabase project; statements are
-- intentionally idempotent so this file can also be used for environment setup.
create table if not exists public.driver_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  phone text not null check (char_length(phone) between 5 and 40),
  company text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique default ('RIDE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  customer_name text not null check (char_length(customer_name) between 2 and 160),
  customer_phone text not null check (char_length(customer_phone) between 5 and 40),
  customer_email text not null default '',
  pickup_location text not null check (char_length(pickup_location) between 2 and 300),
  destination text not null check (char_length(destination) between 2 and 300),
  pickup_date date not null,
  pickup_time time not null,
  return_trip boolean not null default false,
  return_date date,
  passengers integer not null default 1 check (passengers between 1 and 8),
  luggage text not null default '',
  agent_id uuid references public.driver_agents(id) on delete set null,
  fare_amount numeric(12,2) not null default 0 check (fare_amount >= 0),
  currency text not null default 'NGN' check (currency in ('NGN','USD','GBP','EUR')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','deposit_paid','paid','refunded')),
  payment_method text not null default '',
  payment_reference text not null default '',
  status text not null default 'requested' check (status in ('requested','quoted','assigned','driver_enroute','picked_up','completed','cancelled')),
  customer_notes text not null default '',
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ride_requests_created_at_idx on public.ride_requests(created_at desc);
create index if not exists ride_requests_pickup_date_idx on public.ride_requests(pickup_date);
alter table public.driver_agents enable row level security;
alter table public.ride_requests enable row level security;
revoke all on public.driver_agents from anon, authenticated;
revoke all on public.ride_requests from anon, authenticated;
grant select, insert, update, delete on public.driver_agents to authenticated;
grant select, insert, update on public.ride_requests to anon, authenticated;
drop policy if exists "Admins manage driver agents" on public.driver_agents;
create policy "Admins manage driver agents" on public.driver_agents for all to authenticated using (public.is_book_vacation_admin()) with check (public.is_book_vacation_admin());
drop policy if exists "Admins view ride requests" on public.ride_requests;
create policy "Admins view ride requests" on public.ride_requests for select to authenticated using (public.is_book_vacation_admin());
drop policy if exists "Admins update ride requests" on public.ride_requests;
create policy "Admins update ride requests" on public.ride_requests for update to authenticated using (public.is_book_vacation_admin()) with check (public.is_book_vacation_admin());
drop policy if exists "Public can submit ride requests" on public.ride_requests;
create policy "Public can submit ride requests" on public.ride_requests for insert to anon, authenticated with check (
  char_length(customer_name) between 2 and 160
  and char_length(customer_phone) between 5 and 40
  and char_length(pickup_location) between 2 and 300
  and char_length(destination) between 2 and 300
  and pickup_date >= current_date
  and passengers between 1 and 8
);
