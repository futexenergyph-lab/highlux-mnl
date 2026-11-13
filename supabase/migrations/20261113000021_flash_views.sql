-- How many times each flash sale piece's link was opened while the sale was upcoming or running
-- (once per visitor session; bots/link previews skipped).
alter table public.flash_sale_items add column if not exists view_count integer not null default 0;

create or replace function public.increment_flash_views(p_product uuid)
returns void language sql security definer set search_path = public as $$
  update flash_sale_items i set view_count = i.view_count + 1
    from flash_sale_events e
   where e.id = i.event_id and i.product_id = p_product and e.deleted_at is null and now() < e.ends_at;
$$;

revoke execute on function public.increment_flash_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_flash_views(uuid) to service_role;
