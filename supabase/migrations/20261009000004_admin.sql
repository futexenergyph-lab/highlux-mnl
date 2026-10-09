-- HIGHLUX MNL — Phase 5: admin operations + consignment submissions.

-- ─── Consignments ("Sell to Us") ─────────────────────────────────────────
create type public.consignment_status as enum ('new', 'reviewing', 'offered', 'accepted', 'declined', 'received');

create table public.consignments (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text not null,
  phone         text not null,
  city          text,
  brand         text not null,
  category      text not null,
  model         text not null,
  condition     text,
  inclusions    text[] not null default '{}',
  purchase_year text,
  asking_price  numeric(12, 2),
  wants         text not null default 'sell' check (wants in ('sell', 'consign', 'either')),
  notes         text,
  photo_paths   text[] not null default '{}',   -- private bucket "consignments"
  status        public.consignment_status not null default 'new',
  admin_notes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index consignments_status_idx on public.consignments (status, created_at desc);
create trigger consignments_touch before update on public.consignments for each row execute function public.touch_updated_at();

-- Submitted through the server (service role); only staff can read or manage.
alter table public.consignments enable row level security;
create policy "staff manage consignments" on public.consignments for all using (public.is_staff()) with check (public.is_staff());

insert into storage.buckets (id, name, public) values ('consignments', 'consignments', false) on conflict (id) do nothing;
create policy "staff read consignment photos" on storage.objects for select using (bucket_id = 'consignments' and public.is_staff());

-- Internal notes on orders (staff only; never shown to customers).
alter table public.orders add column admin_notes text;
alter table public.orders add column cancelled_at timestamptz;

-- ─── Order operations ────────────────────────────────────────────────────

/** Staff rejected a bank-transfer proof: mark it, and give the customer time to upload a correct one. */
create or replace function public.reject_payment(p_payment_id uuid, p_reviewer uuid, p_reason text, p_hold_hours int)
returns public.orders language plpgsql security definer set search_path = public as $$
declare v_pay payments; v_order orders;
begin
  select * into v_pay from payments where id = p_payment_id for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if v_pay.status <> 'pending' then raise exception 'PAYMENT_NOT_PENDING'; end if;
  update payments set status = 'rejected', rejection_reason = p_reason, reviewed_by = p_reviewer, reviewed_at = now() where id = v_pay.id;
  select * into v_order from orders where id = v_pay.order_id for update;
  if v_order.status = 'pending_payment' then
    -- Restart the clock so the piece isn't held forever on a bad proof.
    update orders set hold_expires_at = now() + make_interval(hours => p_hold_hours) where id = v_order.id returning * into v_order;
    update products set reserved_until = v_order.hold_expires_at
     where reserved_session = 'order:' || v_order.id and status = 'reserved';
  end if;
  return v_order;
end $$;

/** Cancel an unpaid (or layaway) order and release its pieces. Fully paid orders can't be cancelled here (refund first). */
create or replace function public.cancel_order(p_order_id uuid)
returns public.orders language plpgsql security definer set search_path = public as $$
declare v_order orders;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status not in ('pending_payment', 'layaway', 'expired') then raise exception 'ORDER_NOT_CANCELLABLE'; end if;
  update products set status = 'available', reserved_session = null, reserved_until = null
   where reserved_session = 'order:' || v_order.id and status = 'reserved';
  update payments set status = 'expired' where order_id = v_order.id and status = 'pending';
  update orders set status = 'cancelled', cancelled_at = now(), hold_expires_at = null where id = v_order.id returning * into v_order;
  return v_order;
end $$;

revoke execute on function public.reject_payment, public.cancel_order from public, anon, authenticated;
