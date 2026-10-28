-- Where bidding for an auction event happens (e.g. the Viber group invite link).
alter table public.auction_events add column if not exists bid_link text;
