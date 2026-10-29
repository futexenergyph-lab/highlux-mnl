-- How many times each auction item's link has been opened (once per visitor session; bots/link previews skipped).
alter table public.auctions add column if not exists view_count integer not null default 0;

create or replace function public.increment_auction_view(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update auctions set view_count = view_count + 1 where id = p_id;
$$;

revoke execute on function public.increment_auction_view(uuid) from public, anon, authenticated;
grant execute on function public.increment_auction_view(uuid) to service_role;
