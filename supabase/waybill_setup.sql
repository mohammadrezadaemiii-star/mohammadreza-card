-- اجرای این فایل در Supabase SQL Editor، جداول مرکزی حواله را می‌سازد.
create table if not exists public.waybill_drivers (
  id uuid primary key default gen_random_uuid(),
  national text not null unique,
  name text not null,
  license text,
  mobile text,
  card text,
  plate text,
  vehicle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waybills (
  id uuid primary key default gen_random_uuid(),
  no integer not null unique,
  issue_date date not null default current_date,
  national text not null,
  name text not null,
  license text,
  mobile text,
  plate text,
  vehicle text,
  cargo text not null,
  origin text not null default 'تهران',
  dest text not null,
  dest_phone text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_waybill_drivers_national on public.waybill_drivers(national);
create index if not exists idx_waybill_drivers_plate on public.waybill_drivers(plate);
create index if not exists idx_waybills_national on public.waybills(national);
create index if not exists idx_waybills_plate on public.waybills(plate);
create index if not exists idx_waybills_no on public.waybills(no);

alter table public.waybill_drivers enable row level security;
alter table public.waybills enable row level security;

drop policy if exists "waybill drivers authenticated select" on public.waybill_drivers;
drop policy if exists "waybill drivers authenticated insert" on public.waybill_drivers;
drop policy if exists "waybill drivers authenticated update" on public.waybill_drivers;
drop policy if exists "waybill drivers authenticated delete" on public.waybill_drivers;
drop policy if exists "waybills authenticated select" on public.waybills;
drop policy if exists "waybills authenticated insert" on public.waybills;
drop policy if exists "waybills authenticated update" on public.waybills;
drop policy if exists "waybills authenticated delete" on public.waybills;

create policy "waybill drivers authenticated select" on public.waybill_drivers for select to authenticated using (true);
create policy "waybill drivers authenticated insert" on public.waybill_drivers for insert to authenticated with check (true);
create policy "waybill drivers authenticated update" on public.waybill_drivers for update to authenticated using (true) with check (true);
create policy "waybill drivers authenticated delete" on public.waybill_drivers for delete to authenticated using (true);

create policy "waybills authenticated select" on public.waybills for select to authenticated using (true);
create policy "waybills authenticated insert" on public.waybills for insert to authenticated with check (true);
create policy "waybills authenticated update" on public.waybills for update to authenticated using (true) with check (true);
create policy "waybills authenticated delete" on public.waybills for delete to authenticated using (true);

grant select, insert, update, delete on public.waybill_drivers to authenticated;
grant select, insert, update, delete on public.waybills to authenticated;
