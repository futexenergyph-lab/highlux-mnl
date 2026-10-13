-- How many times each product page has been viewed (counted once per visitor session).
alter table public.products add column if not exists view_count integer not null default 0;

-- A view isn't an edit: don't bump updated_at when only the counter changes.
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row when (old.view_count is not distinct from new.view_count)
  execute function public.touch_updated_at();

create or replace function public.increment_product_view(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update products set view_count = view_count + 1 where id = p_id and status <> 'hidden';
$$;

revoke execute on function public.increment_product_view(uuid) from public, anon, authenticated;
grant execute on function public.increment_product_view(uuid) to service_role;
