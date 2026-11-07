-- Private bucket for clean (unwatermarked) copies of product photos.
-- Written by the server on upload; used only for staff "Banner + Was Price" downloads.
insert into storage.buckets (id, name, public) values ('product-originals', 'product-originals', false)
on conflict (id) do nothing;
drop policy if exists "staff read product originals" on storage.objects;
create policy "staff read product originals" on storage.objects for select using (bucket_id = 'product-originals' and public.is_staff());
