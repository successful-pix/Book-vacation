ALTER TABLE public.ticket_requests
  ADD COLUMN IF NOT EXISTS booking_ticket_number text,
  ADD COLUMN IF NOT EXISTS departure_time text,
  ADD COLUMN IF NOT EXISTS arrival_time text,
  ADD COLUMN IF NOT EXISTS return_departure_time text,
  ADD COLUMN IF NOT EXISTS return_arrival_time text;

CREATE UNIQUE INDEX IF NOT EXISTS ticket_requests_booking_ticket_number_unique
  ON public.ticket_requests (booking_ticket_number)
  WHERE booking_ticket_number IS NOT NULL;

UPDATE public.ticket_requests
SET booking_ticket_number = 'BV-TKT-' || to_char(COALESCE(updated_at, created_at, now()), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE (status = 'paid' OR payment_status = 'paid' OR status = 'confirmed')
  AND booking_ticket_number IS NULL;
