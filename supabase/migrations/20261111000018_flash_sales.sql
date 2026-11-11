-- Flash Sale Deals: a titled sale window (start → end) with chosen pieces at a sale price.
-- While the window is open the sale price is what customers see and pay; the regular price
-- comes back by itself when it ends (nothing is written to products).
create table if not exists public.flash_sale_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
alter table public.flash_sale_events enable row level security;

create table if not exists public.flash_sale_items (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.flash_sale_events (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  sale_price  numeric(12, 2) not null check (sale_price > 0),
  created_at  timestamptz not null default now(),
  unique (event_id, product_id)
);
alter table public.flash_sale_items enable row level security;
create index if not exists flash_sale_items_product_idx on public.flash_sale_items (product_id);

-- The running flash sale price of a piece right now, or null.
create or replace function public.flash_price(p_product uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select min(i.sale_price)
    from flash_sale_items i join flash_sale_events e on e.id = i.event_id
   where i.product_id = p_product and now() >= e.starts_at and now() < e.ends_at;
$$;

-- Checkout charges the flash sale price while a sale runs (same as the site shows).
create or replace function public.place_order(
  p_session text, p_product_ids uuid[], p_expected_subtotal numeric, p_hold_minutes int,
  p_order jsonb, p_installments jsonb
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_order   orders;
  v_bad     uuid[];
  v_sub     numeric;
begin
  if coalesce(array_length(p_product_ids, 1), 0) = 0 then raise exception 'EMPTY_ORDER'; end if;

  perform 1 from products where id = any(p_product_ids) for update;

  select array_agg(i.id) into v_bad
    from unnest(p_product_ids) i(id)
    left join products p on p.id = i.id
   where p.id is null or not public.product_takeable(p, p_session);
  if v_bad is not null then raise exception 'ITEM_UNAVAILABLE:%', array_to_string(v_bad, ','); end if;

  select sum(least(price, coalesce(public.flash_price(id), price))) into v_sub from products where id = any(p_product_ids);
  if v_sub <> p_expected_subtotal then raise exception 'PRICE_CHANGED'; end if;

  insert into orders (user_id, email, full_name, phone, fulfillment, shipping_address, notes,
                      payment_method, payment_plan, subtotal, shipping_fee, total, hold_expires_at)
  values (nullif(p_order ->> 'user_id', '')::uuid, p_order ->> 'email', p_order ->> 'full_name', p_order ->> 'phone',
          (p_order ->> 'fulfillment')::fulfillment_method, p_order -> 'shipping_address', p_order ->> 'notes',
          (p_order ->> 'payment_method')::payment_method, p_order ->> 'payment_plan',
          v_sub, (p_order ->> 'shipping_fee')::numeric, v_sub + (p_order ->> 'shipping_fee')::numeric,
          now() + make_interval(mins => p_hold_minutes))
  returning * into v_order;

  insert into order_items (order_id, product_id, title, brand, price, image_url)
  select v_order.id, p.id, p.title, b.name, least(p.price, coalesce(public.flash_price(p.id), p.price)),
         (select url from product_images i where i.product_id = p.id order by position limit 1)
    from products p join brands b on b.id = p.brand_id
   where p.id = any(p_product_ids);

  insert into layaway_installments (order_id, seq, due_date, amount)
  select v_order.id, (x ->> 'seq')::int, (x ->> 'due_date')::date, (x ->> 'amount')::numeric
    from jsonb_array_elements(coalesce(p_installments, '[]'::jsonb)) x;

  update products set status = 'reserved', reserved_session = 'order:' || v_order.id, reserved_until = v_order.hold_expires_at
   where id = any(p_product_ids);

  return v_order;
end $$;
