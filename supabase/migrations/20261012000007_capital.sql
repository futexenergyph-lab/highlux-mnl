-- What a sold piece cost HIGHLUX (capital), entered in admin, for net profit in Purchase Records.
alter table public.orders add column if not exists capital numeric(12, 2);
