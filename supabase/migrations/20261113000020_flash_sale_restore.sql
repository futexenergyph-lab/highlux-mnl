-- Deleting a flash sale moves it to a Deleted tab (restorable) instead of removing it for good.
alter table public.flash_sale_events add column if not exists deleted_at timestamptz;

-- Deleted flash sales don't change what checkout charges.
create or replace function public.flash_price(p_product uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select min(i.sale_price)
    from flash_sale_items i join flash_sale_events e on e.id = i.event_id
   where i.product_id = p_product and e.kind = 'website' and e.deleted_at is null
     and now() >= e.starts_at and now() < e.ends_at;
$$;
