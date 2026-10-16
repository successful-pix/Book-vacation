-- Harden public API access for the private driver application.
-- The admin helper is an invoker function; callers can only see their own admin_users row.
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

-- The trigger remains installed, but its function must not be callable as a public RPC.
revoke all on function public.promote_book_vacation_admin() from public, anon, authenticated;

-- Disable the legacy public holiday-booking RPC if it exists in this project.
do $$
begin
  if to_regprocedure('public.create_booking_request(uuid,text,text,text,text,integer,date,date,text)') is not null then
    execute 'revoke all on function public.create_booking_request(uuid,text,text,text,text,integer,date,date,text) from public, anon, authenticated';
  end if;
end;
$$;

create index if not exists ride_requests_agent_id_idx on public.ride_requests(agent_id);
