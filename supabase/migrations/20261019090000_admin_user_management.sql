-- Allow existing administrators to list registered Auth users and change admin roles.
-- Both functions verify auth.uid() against public.admin_users before reading or changing roles.
create or replace function public.admin_list_registered_users()
returns table (
  id uuid,
  email text,
  name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  is_admin boolean,
  admin_since timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  ) then
    raise exception 'Only an authorised administrator can list users.';
  end if;

  return query
    select u.id,
           coalesce(u.email, ''),
           coalesce(u.raw_user_meta_data ->> 'full_name',
                    u.raw_user_meta_data ->> 'name',
                    u.raw_user_meta_data ->> 'display_name',
                    ''),
           u.created_at,
           u.last_sign_in_at,
           (u.email_confirmed_at is not null),
           (au.user_id is not null),
           au.created_at
      from auth.users u
      left join public.admin_users au on au.user_id = u.id
     order by lower(coalesce(u.email, ''));
end;
$function$;

create or replace function public.admin_set_user_role(p_user_id uuid, p_make_admin boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  admin_count integer;
  target_email text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  ) then
    raise exception 'Only an authorised administrator can change admin access.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('book_vacation_admin_users_guard'));

  select u.email into target_email from auth.users u where u.id = p_user_id;
  if not found then
    raise exception 'Registered user not found.';
  end if;

  if p_make_admin then
    insert into public.admin_users(user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;
    return 'Admin access granted to ' || coalesce(target_email, 'the selected user') || '.';
  end if;

  if exists (select 1 from public.admin_users au where au.user_id = p_user_id) then
    select count(*) into admin_count from public.admin_users;
    if admin_count <= 1 then
      raise exception 'You cannot remove the last administrator.';
    end if;
    delete from public.admin_users au where au.user_id = p_user_id;
  end if;

  return 'Admin access removed from ' || coalesce(target_email, 'the selected user') || '.';
end;
$function$;

revoke all on function public.admin_list_registered_users() from public, anon;
revoke all on function public.admin_set_user_role(uuid, boolean) from public, anon;
grant execute on function public.admin_list_registered_users() to authenticated;
grant execute on function public.admin_set_user_role(uuid, boolean) to authenticated;
