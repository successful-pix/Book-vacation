# Book Vacation

A curated holiday booking platform for customers arranging a getaway for themselves or someone they love.

## Stack
- Next.js App Router and TypeScript
- Supabase Postgres with Row Level Security
- Responsive custom CSS

## Supabase project
This application is configured for **Book vacation**: `sakvxjyemhvzetlxhucd` at `https://sakvxjyemhvzetlxhucd.supabase.co`.

Optional Vercel environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The browser key is publishable; database access is controlled by RLS. Never expose a Supabase service-role key in browser code.

## Booking flow
Customers submit a booking request. The database generates a booking reference and calculates the estimated package total from the selected published package. The team must confirm package availability, final price and payment before the trip is considered confirmed. No online payment is taken yet.

## Admin dashboard
Visit `/admin` and sign in with a Supabase Auth user that has been explicitly added to `public.admin_users`. To authorise an admin after creating their Auth account, run this in the Supabase SQL editor, replacing the UUID with that user's actual Auth user ID:

```sql
insert into public.admin_users (user_id)
values ('REPLACE-WITH-AUTH-USER-UUID')
on conflict (user_id) do nothing;
```

Only authorised admins can view customer booking requests or manage package visibility. Keep customer contact information confidential.
