-- HIGHLUX MNL — Phase 4: customer accounts (saved addresses, synced wishlist).
-- Auth itself is Supabase Auth (email + Google). profiles rows are created by
-- the on_auth_user_created trigger from Phase 1.

create table public.customer_addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  label       text not null default 'Home',
  full_name   text not null,
  phone       text not null,
  line1       text not null,
  barangay    text not null,
  city        text not null,
  province    text not null,
  zip         text not null check (zip ~ '^\d{4}$'),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index customer_addresses_user_idx on public.customer_addresses (user_id, created_at);
-- At most one default address per customer.
create unique index customer_addresses_one_default on public.customer_addresses (user_id) where is_default;

create table public.wishlist_items (
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.customer_addresses enable row level security;
alter table public.wishlist_items     enable row level security;

create policy "own addresses" on public.customer_addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff read addresses" on public.customer_addresses for select using (public.is_staff());

create policy "own wishlist" on public.wishlist_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.customer_addresses, public.wishlist_items to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

/** Make one address the default (clears the previous default atomically). */
create or replace function public.set_default_address(p_address_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update customer_addresses set is_default = false where user_id = auth.uid() and is_default and id <> p_address_id;
  update customer_addresses set is_default = true  where user_id = auth.uid() and id = p_address_id;
end $$;
grant execute on function public.set_default_address to authenticated;
