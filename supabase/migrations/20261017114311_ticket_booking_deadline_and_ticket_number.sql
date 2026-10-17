alter table public.ticket_requests
  add column if not exists payment_deadline_at timestamptz,
  add column if not exists ticket_number text;

update public.ticket_requests
set payment_deadline_at = coalesce(payment_deadline_at, updated_at + interval '30 minutes')
where status = 'awaiting_payment' and payment_deadline_at is null;

update public.ticket_requests
set ticket_number = 'BVT-TKT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
where status = 'confirmed' and payment_status = 'paid' and ticket_number is null;

create unique index if not exists ticket_requests_ticket_number_uidx
  on public.ticket_requests(ticket_number) where ticket_number is not null;

create or replace function public.apply_ticket_booking_lifecycle()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'awaiting_payment'
     and new.payment_deadline_at is null
     and (tg_op = 'INSERT' or old.status is distinct from 'awaiting_payment') then
    new.payment_deadline_at := now() + interval '30 minutes';
  end if;

  if new.status = 'confirmed'
     and new.payment_status = 'paid'
     and nullif(trim(coalesce(new.ticket_number, '')), '') is null then
    new.ticket_number := 'BVT-TKT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ticket_booking_lifecycle_before_write on public.ticket_requests;
create trigger ticket_booking_lifecycle_before_write
before insert or update on public.ticket_requests
for each row execute function public.apply_ticket_booking_lifecycle();
