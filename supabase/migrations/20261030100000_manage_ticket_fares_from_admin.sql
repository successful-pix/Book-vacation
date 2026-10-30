create table if not exists public.ticket_fares (
  country_code text primary key check (country_code ~ '^[A-Z]{2}$'),
  country_name text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  one_way numeric(14,2) not null default 0 check (one_way >= 0),
  return_trip numeric(14,2) not null default 0 check (return_trip >= 0),
  updated_at timestamptz not null default now()
);
alter table public.ticket_fares enable row level security;
drop policy if exists "Ticket fares are publicly readable" on public.ticket_fares;
create policy "Ticket fares are publicly readable" on public.ticket_fares for select to anon, authenticated using (true);
drop policy if exists "Admins manage ticket fares" on public.ticket_fares;
create policy "Admins manage ticket fares" on public.ticket_fares for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
grant select on public.ticket_fares to anon, authenticated;
grant insert, update, delete on public.ticket_fares to authenticated;
insert into public.ticket_fares(country_code,country_name,currency,one_way,return_trip) values
('BR','Brazil','BRL',3500,2300),('GB','United Kingdom','GBP',250,400),('VN','Vietnam','VND',10000000,16000000),('US','United States','USD',3500,2300),('MX','Mexico','MXN',3500,5500),('NG','Nigeria','NGN',250000,400000),('CA','Canada','CAD',450,700),('AU','Australia','AUD',500,800),('NZ','New Zealand','NZD',550,850),('JP','Japan','JPY',35000,55000),('IN','India','INR',25000,40000),('ZA','South Africa','ZAR',5000,8000),('AE','United Arab Emirates','AED',900,1400),('SG','Singapore','SGD',450,700),('CN','China','CNY',2500,4000),('TH','Thailand','THB',9000,14000),('ID','Indonesia','IDR',3000000,4800000),('KR','South Korea','KRW',450000,700000),('KE','Kenya','KES',40000,65000),('GH','Ghana','GHS',4000,6500),('TR','Türkiye','TRY',6000,9500),('PH','Philippines','PHP',18000,28000),('MY','Malaysia','MYR',700,1100),('PK','Pakistan','PKR',75000,120000),('EG','Egypt','EGP',10000,16000),('SA','Saudi Arabia','SAR',950,1500),('CH','Switzerland','CHF',300,480),('NO','Norway','NOK',3200,5000),('SE','Sweden','SEK',3200,5000),('DK','Denmark','DKK',2200,3500),('FR','France','EUR',280,450),('GR','Greece','EUR',280,450),('DE','Germany','EUR',280,450),('IT','Italy','EUR',280,450),('ES','Spain','EUR',280,450),('PT','Portugal','EUR',280,450),('NL','Netherlands','EUR',280,450),('IE','Ireland','EUR',280,450),('PL','Poland','PLN',1200,1900),('AR','Argentina','ARS',400000,650000),('CL','Chile','CLP',250000,400000),('CO','Colombia','COP',900000,1400000),('PE','Peru','PEN',900,1400),('HK','Hong Kong','HKD',2500,4000),('TW','Taiwan','TWD',9000,14000),('BD','Bangladesh','BDT',30000,48000),('LK','Sri Lanka','LKR',80000,130000),('NP','Nepal','NPR',40000,65000),('MA','Morocco','MAD',3000,4800),('QA','Qatar','QAR',900,1400),('KW','Kuwait','KWD',75,120)
on conflict (country_code) do nothing;
