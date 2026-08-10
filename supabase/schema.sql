-- ============================================================
-- Mad Mojo — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL).
-- Then run seed.sql to load the starting catalog.
-- ============================================================

-- ---------- profiles (mirrors auth.users, holds the role) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own (not role)" on public.profiles;
create policy "profiles: update own (not role)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- Auto-create a profile whenever someone signs up (any provider).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by RLS policies below.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_es text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read"
  on public.categories for select
  using (true);

drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid references public.categories (id) on delete set null,
  name_en text not null,
  name_es text,
  description_en text,
  description_es text,
  details_en text,
  details_es text,
  price_cents int not null check (price_cents >= 0),
  compare_at_cents int,
  badge text check (badge in ('new', 'bestseller', 'restocked')),
  images jsonb not null default '[]'::jsonb,
  sizes jsonb,
  stock int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (is_active);

alter table public.products enable row level security;

drop policy if exists "products: public read active" on public.products;
create policy "products: public read active"
  on public.products for select
  using (is_active = true or public.is_admin());

drop policy if exists "products: admin write" on public.products;
create policy "products: admin write"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- orders (written by the Stripe webhook, service role) ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  email text,
  amount_total int not null default 0,
  currency text not null default 'usd',
  status text not null default 'paid',
  shipping jsonb,
  items jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);

alter table public.orders enable row level security;

drop policy if exists "orders: own or admin read" on public.orders;
create policy "orders: own or admin read"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

-- No insert/update policies: only the service-role key (webhook) writes orders.

-- ---------- stock decrement helper (called by the webhook) ----------
create or replace function public.decrement_stock(p_product_id uuid, p_qty int)
returns void
language sql
security definer set search_path = public
as $$
  update public.products
  set stock = greatest(stock - p_qty, 0)
  where id = p_product_id;
$$;

-- ---------- storage bucket for product images ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product-images: public read" on storage.objects;
create policy "product-images: public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product-images: admin write" on storage.objects;
create policy "product-images: admin write"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images: admin delete" on storage.objects;
create policy "product-images: admin delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ============================================================
-- After running this file:
-- 1. Run seed.sql to load categories + products.
-- 2. Sign in to the site once (Google/Microsoft/GitHub/email),
--    then promote yourself to admin:
--      update public.profiles set role = 'admin'
--      where email = 'you@example.com';
-- ============================================================
