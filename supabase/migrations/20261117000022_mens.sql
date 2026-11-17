-- Pieces ticked in admin's Mens tab show up when customers search "mens".
alter table public.products add column if not exists for_men boolean not null default false;
