-- Harden function access after moving the public app to direct ride requests.
-- The admin-check helper runs as invoker and is executable only by signed-in users.
create index if not exists ride_requests_agent_id_idx on public.ride_requests(agent_id);

create or replace function public.is_book_vacation_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_book_vacation_admin() from public, anon, authenticated;
grant execute on function public.is_book_vacation_admin() to authenticated;

-- These old marketplace RPCs are no longer used by the private driver app.
-- The auth trigger continues to fire when an Auth user is created, but the
-- trigger function is not exposed as a callable public RPC.
revoke all on function public.promote_book_vacation_admin() from public, anon, authenticated;
revoke all on function public.create_booking_request(uuid,text,text,text,text,integer,date,date,text) from public, anon, authenticated;
