-- HIGHLUX MNL — Phase 3: orders, payments, layaway, item holds.
--
-- Hold model (each piece is one of a kind):
--   * Entering checkout holds items for the customer's browser session for 15 min
--     (products.status = 'reserved', reserved_session = <session id>, reserved_until = now()+15m).
--   * Placing an order transfers the hold to the order (reserved_session = 'order:<id>')
--     and extends it while the customer pays (PayMongo / bank transfer / meet-up).
--   * A layaway down payment holds the item indefinitely (reserved_until = null).
--   * Full payment marks it sold.
--   * Holds past reserved_until are treated as available and swept by expire_holds().
-- All writes go through the service role (server only); customers only read their own orders.

alter table public.products add column reserved_session text;
create index products_reserved_idx on public.products (reserved_until) where status = 'reserved';

create type public.order_status       as enum ('pending_payment', 'layaway', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'expired');
create type public.fulfillment_method as enum ('ship_metro_manila', 'ship_provincial', 'meetup', 'pickup');
create type public.payment_method     as enum ('gcash', 'maya', 'card', 'bank_transfer', 'pay_at_meetup');
create type public.payment_status     as enum ('pending', 'paid', 'failed', 'rejected', 'expired');

create sequence public.order_number_seq start 1001;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique default ('HLX-' || nextval('public.order_number_seq')),
  -- Secret for guest order tracking links (/orders/HLX-1001?t=...).
  access_token      text not null default encode(gen_random_bytes(18), 'hex'),
  user_id           uuid references auth.users (id) on delete set null,
  email             text not null,
  full_name         text not null,
  phone             text not null,
  fulfillment       public.fulfillment_method not null,
  shipping_address  jsonb,
  notes             text,
  payment_method    public.payment_method not null,
  payment_plan      text not null default 'full' check (payment_plan in ('full', 'layaway')),
  subtotal          numeric(12, 2) not null,
  shipping_fee      numeric(12, 2) not null default 0,
  total             numeric(12, 2) not null,
  amount_paid       numeric(12, 2) not null default 0,
  status            public.order_status not null default 'pending_payment',
  hold_expires_at   timestamptz,
  -- Set when a payment lands for an item that is no longer held for this order (e.g. paid after expiry).
  needs_review      boolean not null default false,
  review_note       text,
  courier           text,
  tracking_number   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  paid_at           timestamptz,
  packed_at         timestamptz,
  shipped_at        timestamptz,
  delivered_at      timestamptz
);
create index orders_user_idx    on public.orders (user_id, created_at desc);
create index orders_status_idx  on public.orders (status, created_at desc);
create index orders_email_idx   on public.orders (lower(email));
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid not null references public.products (id),
  title       text not null,
  brand       text not null,
  price       numeric(12, 2) not null,
  image_url   text
);
create index order_items_order_idx on public.order_items (order_id);

create table public.layaway_installments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  seq         int  not null,          -- 0 = down payment
  due_date    date not null,
  amount      numeric(12, 2) not null,
  status      text not null default 'due' check (status in ('due', 'paid')),
  paid_at     timestamptz,
  unique (order_id, seq)
);

create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  amount            numeric(12, 2) not null check (amount > 0),
  method            public.payment_method not null,
  status            public.payment_status not null default 'pending',
  provider          text,               -- 'paymongo' | 'manual'
  provider_ref      text unique,        -- PayMongo checkout session id
  checkout_url      text,
  proof_path        text,               -- storage path in payment-proofs bucket
  reference_no      text,               -- bank reference entered by the customer
  reviewed_by       uuid references auth.users (id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);
create index payments_order_idx on public.payments (order_id, created_at);
create index payments_review_idx on public.payments (status) where proof_path is not null;

-- ─── RLS: customers read their own orders; staff read everything; writes = service role ───
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.layaway_installments enable row level security;
alter table public.payments             enable row level security;

create policy "own orders"      on public.orders for select using (user_id = auth.uid() or public.is_staff());
create policy "staff orders"    on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy "own items"       on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));
create policy "own installments" on public.layaway_installments for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));
create policy "own payments"    on public.payments for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));

-- Private bucket for proof-of-payment uploads (written by the server, read via signed URLs).
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
create policy "staff read proofs" on storage.objects for select using (bucket_id = 'payment-proofs' and public.is_staff());

-- ─── Holds ───────────────────────────────────────────────────────────────

/** Is this product free for `p_holder` to take? (available, already theirs, or an expired timed hold) */
create or replace function public.product_takeable(p public.products, p_holder text)
returns boolean language sql stable as $$
  select p.status = 'available'
      or (p.status = 'reserved' and (
            p.reserved_session = p_holder
         or (p.reserved_until is not null and p.reserved_until < now())));
$$;

/** Hold items for a checkout session. Takes what it can; returns one row per requested id. */
create or replace function public.reserve_products(p_ids uuid[], p_session text, p_minutes int)
returns table (product_id uuid, held boolean, reserved_until timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  -- UPDATE row-locks and re-checks its WHERE after any concurrent writer commits,
  -- so two shoppers can't both take the same piece. Live order holds aren't takeable.
  return query
  with taken as (
    update products p
       set status = 'reserved', reserved_session = p_session, reserved_until = now() + make_interval(mins => p_minutes)
     where p.id = any(p_ids) and public.product_takeable(p, p_session)
    returning p.id, p.reserved_until
  )
  select i.id, t.id is not null, t.reserved_until
    from unnest(p_ids) as i(id)
    left join taken t on t.id = i.id;
end $$;

/** Release a session's holds (customer removed an item from the bag). */
create or replace function public.release_products(p_ids uuid[], p_session text)
returns void language sql security definer set search_path = public as $$
  update products set status = 'available', reserved_session = null, reserved_until = null
   where id = any(p_ids) and status = 'reserved' and reserved_session = p_session;
$$;

/**
 * Atomically create an order from held items. Prices are re-read under lock and
 * must match p_expected_subtotal (the server computed shipping/layaway from it).
 * Raises ITEM_UNAVAILABLE:<ids> or PRICE_CHANGED.
 */
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

  select sum(price) into v_sub from products where id = any(p_product_ids);
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
  select v_order.id, p.id, p.title, b.name, p.price,
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

/**
 * Mark a payment paid and apply it to its order. Idempotent (re-delivered
 * webhooks are no-ops). Fully paid → items sold; partially paid layaway →
 * items held indefinitely for the customer.
 */
create or replace function public.record_payment(p_payment_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_pay    payments;
  v_order  orders;
  v_ids    uuid[];
  v_claim  int;
  v_left   numeric;
  r        record;
begin
  select * into v_pay from payments where id = p_payment_id for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  select * into v_order from orders where id = v_pay.order_id for update;
  if v_pay.status = 'paid' then return v_order; end if;

  update payments set status = 'paid', paid_at = now() where id = v_pay.id;
  v_order.amount_paid := v_order.amount_paid + v_pay.amount;

  -- Allocate cumulative payments to installments in order.
  v_left := v_order.amount_paid;
  for r in select * from layaway_installments where order_id = v_order.id order by seq loop
    exit when v_left < r.amount;
    v_left := v_left - r.amount;
    if r.status = 'due' then
      update layaway_installments set status = 'paid', paid_at = now() where id = r.id;
    end if;
  end loop;

  select array_agg(product_id) into v_ids from order_items where order_id = v_order.id;

  -- (Re)claim the items for this order; fails only if someone else took them after this order's hold lapsed.
  with claim as (
    update products p set status = 'reserved', reserved_session = 'order:' || v_order.id, reserved_until = null
     where p.id = any(v_ids)
       and (public.product_takeable(p, 'order:' || v_order.id))
    returning 1
  ) select count(*) into v_claim from claim;
  if v_claim < coalesce(array_length(v_ids, 1), 0) then
    v_order.needs_review := true;
    v_order.review_note := concat_ws(E'\n', v_order.review_note,
      format('%s: payment of %s received but an item was no longer held for this order — refund or substitute.', now()::date, v_pay.amount));
  end if;

  if v_order.amount_paid >= v_order.total then
    update products set status = 'sold', sold_at = now(), reserved_session = null, reserved_until = null
     where id = any(v_ids) and reserved_session = 'order:' || v_order.id;
    v_order.status := case when v_order.status in ('pending_payment', 'layaway', 'expired', 'cancelled') then 'paid' else v_order.status end;
    v_order.paid_at := coalesce(v_order.paid_at, now());
  elsif v_order.payment_plan = 'layaway' then
    v_order.status := case when v_order.status in ('pending_payment', 'expired', 'cancelled') then 'layaway' else v_order.status end;
  end if;
  v_order.hold_expires_at := null;

  update orders set amount_paid = v_order.amount_paid, status = v_order.status, paid_at = v_order.paid_at,
                    hold_expires_at = null, needs_review = v_order.needs_review, review_note = v_order.review_note
   where id = v_order.id
  returning * into v_order;
  return v_order;
end $$;

/** A bank-transfer proof is awaiting review: stop the clock so the hold doesn't lapse meanwhile. */
create or replace function public.pause_hold_for_review(p_order_id uuid)
returns void language sql security definer set search_path = public as $$
  update orders set hold_expires_at = null where id = p_order_id and status = 'pending_payment';
  update products set reserved_until = null
   where reserved_session = 'order:' || p_order_id and status = 'reserved';
$$;

/** Sweep: expire unpaid orders whose hold lapsed and release every lapsed hold. Run by cron. */
create or replace function public.expire_holds()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update orders set status = 'expired'
   where status = 'pending_payment' and hold_expires_at is not null and hold_expires_at < now();
  update payments set status = 'expired'
   where status = 'pending' and proof_path is null
     and order_id in (select id from orders where status = 'expired');
  update products set status = 'available', reserved_session = null, reserved_until = null
   where status = 'reserved' and reserved_until is not null and reserved_until < now();
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.reserve_products, public.release_products, public.place_order,
  public.record_payment, public.pause_hold_for_review, public.expire_holds from public, anon, authenticated;

-- Default checkout settings (editable in the admin in Phase 5).
insert into public.site_settings (key, value) values ('checkout', '{}'::jsonb) on conflict (key) do nothing;
