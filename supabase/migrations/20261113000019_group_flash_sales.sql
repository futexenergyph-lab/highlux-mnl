-- Group flash sales: sold in a group chat (Viber, Messenger…) with "Mine" and "Steal" prices.
-- The site shows the prices and a "Join group" link but keeps charging the regular price.
alter table public.flash_sale_events add column if not exists kind text not null default 'website' check (kind in ('website', 'group'));
alter table public.flash_sale_events add column if not exists group_link text;
alter table public.flash_sale_items add column if not exists steal_price numeric(12, 2) check (steal_price is null or steal_price > 0);

-- Only website flash sales change what checkout charges.
create or replace function public.flash_price(p_product uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select min(i.sale_price)
    from flash_sale_items i join flash_sale_events e on e.id = i.event_id
   where i.product_id = p_product and e.kind = 'website' and now() >= e.starts_at and now() < e.ends_at;
$$;
