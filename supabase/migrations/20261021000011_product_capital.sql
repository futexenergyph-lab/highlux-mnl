-- What each piece cost us. Kept out of `products` (which the storefront can read)
-- in its own table with no policies, so only the server (service role) sees it.
create table if not exists public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  capital    numeric(12, 2) not null check (capital >= 0),
  updated_at timestamptz not null default now()
);
alter table public.product_costs enable row level security;
revoke all on public.product_costs from anon, authenticated;
