alter table public.ticket_requests
  add column if not exists airline_company text not null default '';
