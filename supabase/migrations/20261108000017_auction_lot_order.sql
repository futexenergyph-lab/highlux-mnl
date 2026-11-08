-- Order of pieces inside an auction event, set by dragging in admin. Item #s follow it.
alter table public.auctions add column if not exists position integer;
