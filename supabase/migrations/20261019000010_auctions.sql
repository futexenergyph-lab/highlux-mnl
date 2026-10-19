-- Bidding (auctions) on one-of-a-kind pieces. All access goes through the server (service role).
create table if not exists public.auctions (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  starting_bid   numeric(12, 2) not null check (starting_bid > 0),
  min_increment  numeric(12, 2) not null default 500 check (min_increment > 0),
  reserve_price  numeric(12, 2),
  starts_at      timestamptz not null default now(),
  ends_at        timestamptz not null,
  status         text not null default 'live' check (status in ('live', 'ended', 'cancelled')),
  winner_bid_id  uuid,
  order_id       uuid references public.orders (id) on delete set null,
  created_at     timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists auctions_status_idx on public.auctions (status, ends_at);
-- One running auction per piece.
create unique index if not exists auctions_one_live_per_product on public.auctions (product_id) where status = 'live';

create table if not exists public.auction_bids (
  id          uuid primary key default gen_random_uuid(),
  auction_id  uuid not null references public.auctions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  bidder_name text not null,          -- masked, shown publicly
  contact     jsonb not null default '{}', -- staff/winner order only: { email, full_name, phone }
  amount      numeric(12, 2) not null check (amount > 0),
  created_at  timestamptz not null default now()
);
create index if not exists auction_bids_auction_idx on public.auction_bids (auction_id, amount desc);

alter table public.auctions enable row level security;
alter table public.auction_bids enable row level security;

/**
 * Place a bid atomically: the auction row is locked, the amount must beat the current
 * high bid by the increment (or meet the starting bid), and a bid in the last 2 minutes
 * pushes the end out to 2 minutes from now (anti-sniping).
 */
create or replace function public.place_bid(p_auction uuid, p_user uuid, p_name text, p_amount numeric, p_contact jsonb default '{}')
returns public.auction_bids language plpgsql security definer set search_path = public as $$
declare
  a   auctions;
  top numeric;
  b   auction_bids;
begin
  select * into a from auctions where id = p_auction for update;
  if not found then raise exception 'AUCTION_NOT_FOUND'; end if;
  if a.status <> 'live' or now() < a.starts_at or now() >= a.ends_at then raise exception 'AUCTION_CLOSED'; end if;
  select max(amount) into top from auction_bids where auction_id = p_auction;
  if p_amount < coalesce(top + a.min_increment, a.starting_bid) then
    raise exception 'BID_TOO_LOW:%', coalesce(top + a.min_increment, a.starting_bid);
  end if;
  insert into auction_bids (auction_id, user_id, bidder_name, amount, contact) values (p_auction, p_user, p_name, p_amount, coalesce(p_contact, '{}')) returning * into b;
  if a.ends_at - now() < interval '2 minutes' then
    update auctions set ends_at = now() + interval '2 minutes' where id = p_auction;
  end if;
  return b;
end $$;

revoke execute on function public.place_bid(uuid, uuid, text, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.place_bid(uuid, uuid, text, numeric, jsonb) to service_role;
