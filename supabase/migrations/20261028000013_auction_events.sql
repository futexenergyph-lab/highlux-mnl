-- Auction events: a titled auction with its own start and end time that several
-- pieces (lots) can join. Each lot is an ordinary auction linked by event_id.
create table if not exists public.auction_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'active' check (status in ('active', 'cancelled')),
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
alter table public.auction_events enable row level security;

alter table public.auctions add column if not exists event_id uuid references public.auction_events (id) on delete set null;
create index if not exists auctions_event_idx on public.auctions (event_id);
