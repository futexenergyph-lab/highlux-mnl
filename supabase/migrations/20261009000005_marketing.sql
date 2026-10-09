-- HIGHLUX MNL — Phase 6: ad attribution captured at checkout (Meta Pixel cookies,
-- IP and user agent) so the server-side Purchase event can be matched to the ad click.
alter table public.orders add column attribution jsonb;
comment on column public.orders.attribution is 'Meta CAPI matching data captured at checkout: {fbp, fbc, ip, ua}. Staff/service only.';
