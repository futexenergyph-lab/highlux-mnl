-- HIGHLUX MNL — Phase 1: catalog, site content, profiles & roles.
-- Orders/payments/layaway (Phase 3) and consignments (Phase 5) ship as later migrations.

create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────
create type public.product_category as enum ('bags', 'watches', 'jewelry', 'accessories');
create type public.condition_grade  as enum ('brand_new', 'pristine', 'excellent', 'very_good', 'good');
create type public.product_status   as enum ('available', 'reserved', 'sold', 'hidden');
create type public.user_role        as enum ('customer', 'staff', 'admin');

-- ─── Profiles (1:1 with auth.users) ──────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role lookups go through security-definer functions so profile policies don't recurse.
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'));
$$;

-- ─── Brands ──────────────────────────────────────────────────────────────
create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  categories  public.product_category[] not null default '{}',
  logo_url    text,
  sort_order  int not null default 0
);

-- ─── Products ────────────────────────────────────────────────────────────
create table public.products (
  id                          uuid primary key default gen_random_uuid(),
  slug                        text not null unique,
  brand_id                    uuid not null references public.brands (id),
  model                       text not null,
  title                       text not null,
  category                    public.product_category not null,
  sub_category                text not null,
  price                       numeric(12, 2) not null check (price >= 0),
  compare_at_price            numeric(12, 2) check (compare_at_price is null or compare_at_price >= 0),
  condition                   public.condition_grade not null,
  condition_notes             text,
  inclusions                  text[] not null default '{}',
  authenticity_method         text,
  authenticity_certificate_url text,
  specs                       jsonb not null default '{}'::jsonb,
  color                       text,
  video_url                   text,
  status                      public.product_status not null default 'available',
  -- Single-unit stock: an item in checkout is held until reserved_until.
  reserved_until              timestamptz,
  reserved_by                 uuid references auth.users (id) on delete set null,
  featured                    boolean not null default false,
  description                 text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  sold_at                     timestamptz
);

create index products_category_idx on public.products (category, status);
create index products_brand_idx    on public.products (brand_id);
create index products_created_idx  on public.products (created_at desc);
create index products_search_idx   on public.products
  using gin (to_tsvector('simple', title || ' ' || model || ' ' || coalesce(color, '')));

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text not null default '',
  position    int  not null default 0
);
create index product_images_product_idx on public.product_images (product_id, position);

-- Max 15 photos per product.
create or replace function public.enforce_image_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.product_images where product_id = new.product_id) >= 15 then
    raise exception 'A product can have at most 15 photos';
  end if;
  return new;
end $$;
create trigger product_images_limit before insert on public.product_images
  for each row execute function public.enforce_image_limit();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ─── Site content (homepage editor, shipping rates, etc.) ────────────────
create table public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  location    text,
  rating      int not null check (rating between 1 and 5),
  body        text not null,
  item        text,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- ─── Row Level Security ──────────────────────────────────────────────────
alter table public.profiles               enable row level security;
alter table public.brands                 enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.site_settings          enable row level security;
alter table public.reviews                enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "own profile read"   on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "own profile update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_user_role());  -- customers can't self-promote
create policy "staff manage profiles" on public.profiles for all using (public.is_staff()) with check (public.is_staff());

create policy "public read brands" on public.brands for select using (true);
create policy "staff write brands" on public.brands for all using (public.is_staff()) with check (public.is_staff());

-- Sold items stay visible as social proof; only 'hidden' is private.
create policy "public read products" on public.products for select using (status <> 'hidden' or public.is_staff());
create policy "staff write products" on public.products for all using (public.is_staff()) with check (public.is_staff());

create policy "public read images" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.status <> 'hidden' or public.is_staff()))
);
create policy "staff write images" on public.product_images for all using (public.is_staff()) with check (public.is_staff());

create policy "public read settings" on public.site_settings for select using (true);
create policy "staff write settings" on public.site_settings for all using (public.is_staff()) with check (public.is_staff());

create policy "public read reviews" on public.reviews for select using (published or public.is_staff());
create policy "staff write reviews" on public.reviews for all using (public.is_staff()) with check (public.is_staff());

create policy "anyone subscribes" on public.newsletter_subscribers for insert with check (true);
create policy "staff read subscribers" on public.newsletter_subscribers for select using (public.is_staff());

-- ─── Storage ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('product-media', 'product-media', true),
  ('site-assets',   'site-assets',   true)
on conflict (id) do nothing;

create policy "public read product media" on storage.objects for select
  using (bucket_id in ('product-media', 'site-assets'));
create policy "staff upload media" on storage.objects for insert
  with check (bucket_id in ('product-media', 'site-assets') and public.is_staff());
create policy "staff update media" on storage.objects for update
  using (bucket_id in ('product-media', 'site-assets') and public.is_staff());
create policy "staff delete media" on storage.objects for delete
  using (bucket_id in ('product-media', 'site-assets') and public.is_staff());
