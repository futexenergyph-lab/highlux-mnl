"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ChevronDown, Clock, CreditCard, Landmark, Loader2, Lock, MapPin, Package, Smartphone, Store, Truck, Users, Wallet } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useProductSummaries } from "@/components/product/recently-viewed";
import {
  FULFILLMENT_LABELS,
  PAYMENT_LABELS,
  allowedMethods,
  offeredMethods,
  isShipping,
  layawayEligible,
  layawaySchedule,
  shippingFee,
  type Fulfillment,
  type PaymentMethod,
  type PaymentPlan,
  type PricingConfig,
} from "@/lib/checkout/pricing";
import type { BankAccount } from "@/lib/checkout/settings";
import type { SavedAddress } from "@/lib/account/types";
import { METRO_MANILA_CITIES } from "@/lib/ph";
import { cn, formatPHP } from "@/lib/utils";
import { placeOrderAction } from "./actions";
import { trackMeta } from "@/components/meta/pixel";

interface Config extends PricingConfig {
  layaway: PricingConfig["layaway"] & { terms: string };
  meetup: { enabled: boolean; note: string };
  pickup: { enabled: boolean; address: string };
  holdMinutes: number;
  bankTransferHours: number;
  bankAccounts: BankAccount[];
  disabledMethods: PaymentMethod[];
  online: "live" | "mock" | "off";
}

type HoldState = { kind: "loading" } | { kind: "held"; until: number } | { kind: "expired" } | { kind: "error" };

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  gcash: Smartphone,
  maya: Wallet,
  card: CreditCard,
  bank_transfer: Landmark,
  pay_at_meetup: Users,
};

// ─── Small UI pieces ─────────────────────────────────────────────────────

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gold/15 py-8 first:pt-0">
      <h2 className="mb-5 flex items-center gap-3 font-serif text-2xl text-cream">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/60 font-sans text-xs text-gold-light">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = React.useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-sans text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        className={cn(
          "h-12 w-full border bg-ink/60 px-3.5 font-sans text-[0.95rem] text-cream placeholder:text-cream-dim/60 focus:outline-none",
          error ? "border-red-400/70 focus:border-red-400" : "border-gold/30 focus:border-gold",
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}

function Choice({ checked, onSelect, title, detail, price, Icon, disabled, soon }: { checked: boolean; onSelect: () => void; title: string; detail?: React.ReactNode; price?: string; Icon: React.ElementType; disabled?: boolean; soon?: boolean }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-4 border p-4 transition-colors",
        checked ? "border-gold bg-gold/[0.06]" : "border-gold/20 hover:border-gold/50",
        disabled && "cursor-not-allowed border-cream/10 bg-transparent opacity-40 grayscale hover:border-cream/10",
      )}
    >
      <input type="radio" className="peer sr-only" checked={checked} onChange={onSelect} disabled={disabled} />
      <span className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border peer-focus-visible:ring-1 peer-focus-visible:ring-gold", checked ? "border-[5px] border-gold" : "border-gold/40")} />
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.25} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-cream">{title}</span>
          {soon ? (
            <span className="shrink-0 border border-cream/30 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.14em] text-cream-muted">Coming soon</span>
          ) : (
            price && <span className="shrink-0 text-sm text-cream">{price}</span>
          )}
        </span>
        {detail && <span className="mt-1 block text-xs leading-relaxed text-cream-muted">{detail}</span>}
      </span>
    </label>
  );
}

function Countdown({ until, onExpire }: { until: number; onExpire: () => void }) {
  const [left, setLeft] = React.useState(() => until - Date.now());
  React.useEffect(() => {
    const t = setInterval(() => {
      const l = until - Date.now();
      setLeft(l);
      if (l <= 0) {
        clearInterval(t);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [until, onExpire]);
  const s = Math.max(0, Math.floor(left / 1000));
  return (
    <span className={cn("font-mono tabular-nums", s < 120 && "text-red-300")}>
      {String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────

interface Account {
  email: string;
  fullName: string;
  phone: string;
  addresses: SavedAddress[];
}

export function CheckoutForm({ config, account }: { config: Config; account: Account | null }) {
  const { items, remove, clear } = useCart();
  const ids = items.map((i) => i.productId);
  const live = useProductSummaries(ids);

  const [hold, setHold] = React.useState<HoldState>({ kind: "loading" });
  const [lost, setLost] = React.useState<string[]>([]);

  const defaultAddress = account?.addresses.find((a) => a.isDefault) ?? account?.addresses[0];
  const [email, setEmail] = React.useState(account?.email ?? "");
  const [fullName, setFullName] = React.useState(account?.fullName ?? "");
  const [phone, setPhone] = React.useState(account?.phone || defaultAddress?.phone || "");
  // "new" = typing a new address; otherwise the id of a saved one.
  const [addressChoice, setAddressChoice] = React.useState<string>(defaultAddress?.id ?? "new");
  const [saveAddress, setSaveAddress] = React.useState(true);
  const [fulfillment, setFulfillment] = React.useState<Fulfillment>("ship_metro_manila");
  const [addr, setAddr] = React.useState({ line1: "", barangay: "", city: "", province: "", zip: "" });
  const [notes, setNotes] = React.useState("");
  const [plan, setPlan] = React.useState<PaymentPlan>("full");
  const [method, setMethod] = React.useState<PaymentMethod>(config.online !== "off" && !config.disabledMethods.includes("gcash") ? "gcash" : "bank_transfer");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);

  const clearError = (key: string) => setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));

  const idsKey = ids.join(",");
  const requestHold = React.useCallback(async () => {
    if (!idsKey) return;
    setHold({ kind: "loading" });
    try {
      const res = await fetch("/api/checkout/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: idsKey.split(",") }) });
      const json = await res.json();
      const skew = Date.now() - new Date(json.serverTime).getTime();
      const held = json.results.filter((r: { held: boolean }) => r.held);
      setLost(json.results.filter((r: { held: boolean }) => !r.held).map((r: { productId: string }) => r.productId));
      if (!held.length) return setHold({ kind: "error" });
      const until = Math.min(...held.map((r: { reservedUntil: string }) => new Date(r.reservedUntil).getTime())) + skew;
      setHold({ kind: "held", until });
    } catch {
      setHold({ kind: "error" });
    }
  }, [idsKey]);

  React.useEffect(() => {
    requestHold();
  }, [requestHold]);

  const onExpire = React.useCallback(() => setHold({ kind: "expired" }), []);

  // InitiateCheckout once per visit, after the pieces are actually held.
  const initiated = React.useRef(false);
  React.useEffect(() => {
    if (hold.kind !== "held" || initiated.current || !live) return;
    initiated.current = true;
    const held = items.filter((i) => !lost.includes(i.productId));
    trackMeta("InitiateCheckout", { productIds: held.map((i) => i.productId), value: held.reduce((s, i) => s + (live.find((p) => p.id === i.productId)?.price ?? i.price), 0) });
  }, [hold.kind, live, items, lost]);

  // Pricing preview (the server recomputes everything).
  const byId = new Map((live ?? []).map((p) => [p.id, p]));
  const lines = items.filter((i) => !lost.includes(i.productId)).map((i) => ({ ...i, price: byId.get(i.productId)?.price ?? i.price, brand: byId.get(i.productId)?.brand ?? "" }));
  const subtotal = lines.reduce((s, l) => s + l.price, 0);
  const fee = shippingFee(fulfillment, subtotal, config);
  const total = subtotal + fee;
  const canLayaway = layawayEligible(subtotal, config);
  const schedule = plan === "layaway" ? layawaySchedule(total, config) : [];
  const dueToday = plan === "layaway" ? schedule[0].amount : total;
  const methods = allowedMethods(fulfillment, plan, config.online !== "off", config.disabledMethods);
  // Switched-off methods still show, grayed out, so customers know they're coming.
  const shownMethods = offeredMethods(fulfillment, plan, config.online !== "off");

  React.useEffect(() => {
    if (!methods.includes(method)) setMethod(methods[0]);
  }, [methods, method]);
  React.useEffect(() => {
    if (plan === "layaway" && !canLayaway) setPlan("full");
  }, [plan, canLayaway]);

  const pickAddress = (id: string) => {
    setAddressChoice(id);
    const a = account?.addresses.find((x) => x.id === id);
    if (!a) {
      setAddr({ line1: "", barangay: "", city: "", province: fulfillment === "ship_metro_manila" ? "Metro Manila" : "", zip: "" });
      return;
    }
    setAddr({ line1: a.line1, barangay: a.barangay, city: a.city, province: a.province, zip: a.zip });
    // The saved address decides the shipping zone.
    setFulfillment(a.province === "Metro Manila" ? "ship_metro_manila" : "ship_provincial");
    setErrors({});
  };

  const chooseFulfillment = (f: Fulfillment) => {
    setFulfillment(f);
    // A saved address belongs to one zone; switching zones means entering a different address.
    const saved = account?.addresses.find((a) => a.id === addressChoice);
    if (saved && isShipping(f) && (saved.province === "Metro Manila") !== (f === "ship_metro_manila")) {
      setAddressChoice("new");
      setAddr({ line1: "", barangay: "", city: "", province: f === "ship_metro_manila" ? "Metro Manila" : "", zip: "" });
      return;
    }
    if (f === "ship_metro_manila") setAddr((a) => ({ ...a, province: "Metro Manila", city: METRO_MANILA_CITIES.includes(a.city) ? a.city : "" }));
    if (f === "ship_provincial" && addr.province === "Metro Manila") setAddr((a) => ({ ...a, province: "", city: "" }));
  };
  React.useEffect(() => {
    if (defaultAddress) pickAddress(defaultAddress.id);
    else chooseFulfillment("ship_metro_manila");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});
    const res = await placeOrderAction({
      productIds: lines.map((l) => l.productId),
      email,
      fullName,
      phone,
      fulfillment,
      shippingAddress: isShipping(fulfillment) ? addr : null,
      notes: notes.trim() || null,
      paymentMethod: method,
      paymentPlan: plan,
      saveAddress: Boolean(account) && addressChoice === "new" && saveAddress,
    });
    if (res.ok) {
      clear();
      window.location.assign(res.redirectUrl);
      return;
    }
    setSubmitting(false);
    setFormError(res.error);
    if (res.fieldErrors) setErrors(res.fieldErrors);
    if (res.unavailable?.length) {
      res.unavailable.forEach((id) => remove(id));
      setLost((l) => [...l, ...res.unavailable!]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!items.length) {
    return (
      <div className="container flex flex-col items-center py-24 text-center">
        <p className="font-serif text-3xl text-cream">Your bag is empty</p>
        <Link href="/shop" className="btn-gold mt-8">Continue shopping</Link>
      </div>
    );
  }

  const lostItems = items.filter((i) => lost.includes(i.productId));

  // Everything in the bag was taken by other clients: nothing left to check out.
  if (!lines.length && hold.kind !== "loading") {
    return (
      <div className="container flex flex-col items-center py-24 text-center">
        <AlertCircle className="h-10 w-10 text-gold/70" strokeWidth={1} />
        <p className="mt-4 font-serif text-3xl text-cream">{lostItems.length === 1 ? "This piece was just reserved by another client" : "These pieces were just reserved by other clients"}</p>
        <p className="mt-3 max-w-md text-sm text-cream-muted">
          {lostItems.map((i) => i.title).join(", ")}. Holds last 15 minutes — if it isn&rsquo;t purchased, it&rsquo;ll be available again. Message us and we&rsquo;ll let you know.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-gold">Browse the collection</Link>
          <Link href="/cart" className="btn-outline-gold">Back to bag</Link>
        </div>
      </div>
    );
  }
  const blocked = hold.kind !== "held" || !lines.length;

  const summary = (
    <div className="space-y-5">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.productId} className="flex gap-4">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden border border-gold/15">
              {l.image && <Image src={l.image} alt="" fill sizes="64px" unoptimized={l.image.endsWith(".svg")} className="object-cover" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="eyebrow block text-[0.6rem] text-gold">{l.brand}</span>
              <span className="line-clamp-2 font-serif text-sm text-cream">{l.title}</span>
            </span>
            <span className="text-sm text-cream">{formatPHP(l.price)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-gold/15 pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-cream-muted">Subtotal</dt><dd className="text-cream">{formatPHP(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-cream-muted">{FULFILLMENT_LABELS[fulfillment]}</dt><dd className="text-cream">{fee ? formatPHP(fee) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-gold/15 pt-3 text-base"><dt className="text-cream">Total</dt><dd className="font-medium text-gold-light">{formatPHP(total)}</dd></div>
      </dl>
      {plan === "layaway" && (
        <div className="border border-gold/25 bg-gold/[0.04] p-4 text-sm">
          <p className="eyebrow text-gold-light">Layaway schedule</p>
          <ul className="mt-3 space-y-1.5">
            {schedule.map((i) => (
              <li key={i.seq} className="flex justify-between">
                <span className="text-cream-muted">{i.seq === 0 ? "Due today (down payment)" : `Installment ${i.seq} · ${new Date(i.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`}</span>
                <span className="text-cream">{formatPHP(i.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-gold/15 pt-4">
        <span className="font-sans text-xs uppercase tracking-wider2 text-cream">Pay now</span>
        <span className="font-sans text-2xl text-gold-light">{formatPHP(dueToday)}</span>
      </div>
    </div>
  );

  return (
    <div className="container pb-20 pt-6">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <h1 className="font-serif text-4xl text-cream">Checkout</h1>
        <div className="flex items-center gap-2 border border-gold/30 bg-gold/[0.05] px-4 py-2 text-sm text-cream" role="status" aria-live="polite">
          <Clock className="h-4 w-4 text-gold" strokeWidth={1.5} />
          {hold.kind === "loading" && <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reserving your pieces…</span>}
          {hold.kind === "held" && <span>Your {lines.length === 1 ? "piece is" : "pieces are"} reserved for <Countdown until={hold.until} onExpire={onExpire} /></span>}
          {hold.kind === "expired" && (
            <span>
              Your reservation expired.{" "}
              <button onClick={requestHold} className="text-gold-light underline underline-offset-4">Reserve again</button>
            </span>
          )}
          {hold.kind === "error" && <span>We couldn&rsquo;t reserve your pieces. <Link href="/cart" className="text-gold-light underline underline-offset-4">Back to bag</Link></span>}
        </div>
        {config.online === "mock" && <p className="text-xs uppercase tracking-wider text-gold">Demo mode — online payments are simulated</p>}
      </div>

      {(lostItems.length > 0 || formError) && (
        <div className="mx-auto mb-6 flex max-w-3xl items-start gap-3 border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {formError && <p>{formError}</p>}
            {lostItems.length > 0 && <p>Just taken by another client: {lostItems.map((i) => i.title).join(", ")}. {lostItems.length === items.length ? "" : "We’ve removed it from this order."}</p>}
          </div>
        </div>
      )}

      {/* Mobile summary toggle */}
      <div className="mb-6 border border-gold/20 lg:hidden">
        <button onClick={() => setSummaryOpen(!summaryOpen)} className="flex w-full items-center justify-between p-4 text-sm" aria-expanded={summaryOpen}>
          <span className="flex items-center gap-2 text-gold-light">
            <Package className="h-4 w-4" strokeWidth={1.25} /> {summaryOpen ? "Hide" : "Show"} order summary
            <ChevronDown className={cn("h-4 w-4 transition-transform", summaryOpen && "rotate-180")} />
          </span>
          <span className="text-cream">{formatPHP(dueToday)}</span>
        </button>
        {summaryOpen && <div className="border-t border-gold/15 p-4">{summary}</div>}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
        <form onSubmit={submit} noValidate>
          <Step n={1} title="Contact">
            {account ? (
              <p className="mb-4 text-sm text-cream-muted">Signed in as <span className="text-cream">{account.email}</span> — this order will appear under My Orders.</p>
            ) : (
              <p className="mb-4 text-sm text-cream-muted">
                Have an account? <Link href="/login?next=/checkout" className="text-gold-light underline underline-offset-4">Sign in</Link> for faster checkout — or continue as a guest.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {!account && <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} error={errors.email} className="sm:col-span-2" required />}
              <Field label="Full name" autoComplete="name" value={fullName} onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }} error={errors.fullName} required />
              <Field label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" value={phone} onChange={(e) => { setPhone(e.target.value); clearError("phone"); }} error={errors.phone} required />
            </div>
          </Step>

          <Step n={2} title="Delivery">
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice Icon={Truck} checked={fulfillment === "ship_metro_manila"} onSelect={() => chooseFulfillment("ship_metro_manila")} title="Metro Manila delivery" detail="1–2 business days, insured" price={formatPHP(shippingFee("ship_metro_manila", subtotal, config)) } />
              <Choice Icon={Truck} checked={fulfillment === "ship_provincial"} onSelect={() => chooseFulfillment("ship_provincial")} title="Provincial delivery" detail="2–5 business days, insured" price={formatPHP(shippingFee("ship_provincial", subtotal, config))} />
              {config.meetup.enabled && <Choice Icon={MapPin} checked={fulfillment === "meetup"} onSelect={() => chooseFulfillment("meetup")} title="Meet-up" detail={config.meetup.note} price="Free" />}
              {config.pickup.enabled && <Choice Icon={Store} checked={fulfillment === "pickup"} onSelect={() => chooseFulfillment("pickup")} title="Store pickup" detail={config.pickup.address} price="Free" />}
            </div>

            {isShipping(fulfillment) && account && account.addresses.length > 0 && (
              <fieldset className="mt-6">
                <legend className="mb-2 font-sans text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted">Deliver to</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {account.addresses.map((a) => (
                    <Choice
                      key={a.id}
                      Icon={MapPin}
                      checked={addressChoice === a.id}
                      onSelect={() => pickAddress(a.id)}
                      title={`${a.label}${a.isDefault ? " · Default" : ""}`}
                      detail={`${a.fullName} · ${a.line1}, ${a.barangay}, ${a.city}, ${a.province} ${a.zip}`}
                    />
                  ))}
                  <Choice Icon={MapPin} checked={addressChoice === "new"} onSelect={() => pickAddress("new")} title="Use a new address" />
                </div>
                {/* The saved address's fields are hidden, so surface any server-side address error here. */}
                {addressChoice !== "new" &&
                  Object.entries(errors)
                    .filter(([k]) => k.startsWith("shippingAddress"))
                    .slice(0, 1)
                    .map(([k, msg]) => (
                      <p key={k} className="mt-2 text-xs text-red-300" role="alert">
                        {msg}. <button type="button" onClick={() => pickAddress("new")} className="underline underline-offset-4">Edit address</button>
                      </p>
                    ))}
              </fieldset>
            )}

            {isShipping(fulfillment) && (!account || addressChoice === "new" || account.addresses.length === 0) && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="House / unit no., street, building" autoComplete="address-line1" value={addr.line1} onChange={(e) => { setAddr({ ...addr, line1: e.target.value }); clearError("shippingAddress.line1"); }} error={errors["shippingAddress.line1"]} className="sm:col-span-2" />
                <Field label="Barangay" value={addr.barangay} onChange={(e) => { setAddr({ ...addr, barangay: e.target.value }); clearError("shippingAddress.barangay"); }} error={errors["shippingAddress.barangay"]} />
                {fulfillment === "ship_metro_manila" ? (
                  <div>
                    <label htmlFor="mm-city" className="mb-1.5 block font-sans text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted">City</label>
                    <select
                      id="mm-city"
                      value={addr.city}
                      onChange={(e) => { setAddr({ ...addr, city: e.target.value }); clearError("shippingAddress.city"); }}
                      className={cn("h-12 w-full border bg-ink/60 px-3 text-[0.95rem] text-cream focus:outline-none", errors["shippingAddress.city"] ? "border-red-400/70" : "border-gold/30 focus:border-gold")}
                    >
                      <option value="">Select city</option>
                      {METRO_MANILA_CITIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    {errors["shippingAddress.city"] && <p className="mt-1 text-xs text-red-300">{errors["shippingAddress.city"]}</p>}
                  </div>
                ) : (
                  <Field label="City / municipality" autoComplete="address-level2" value={addr.city} onChange={(e) => { setAddr({ ...addr, city: e.target.value }); clearError("shippingAddress.city"); }} error={errors["shippingAddress.city"]} />
                )}
                <Field label="Province" autoComplete="address-level1" value={addr.province} readOnly={fulfillment === "ship_metro_manila"} onChange={(e) => { setAddr({ ...addr, province: e.target.value }); clearError("shippingAddress.province"); }} error={errors["shippingAddress.province"]} />
                <Field label="ZIP code" inputMode="numeric" autoComplete="postal-code" maxLength={4} value={addr.zip} onChange={(e) => { setAddr({ ...addr, zip: e.target.value.replace(/\D/g, "") }); clearError("shippingAddress.zip"); }} error={errors["shippingAddress.zip"]} />
                {account && (
                  <label className="flex items-center gap-2 text-sm text-cream-muted sm:col-span-2">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-[#c9a24a]" /> Save this address to my account
                  </label>
                )}
              </div>
            )}
            <div className="mt-4">
              <label htmlFor="notes" className="mb-1.5 block font-sans text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted">Notes (optional)</label>
              <textarea id="notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={fulfillment === "meetup" ? "Preferred meet-up place and time" : "Delivery instructions, landmarks…"} className="w-full border border-gold/30 bg-ink/60 px-3.5 py-3 text-[0.95rem] text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none" />
            </div>
          </Step>

          <Step n={3} title="Payment plan">
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice Icon={Wallet} checked={plan === "full"} onSelect={() => setPlan("full")} title="Pay in full" price={formatPHP(total)} />
              <Choice
                Icon={Clock}
                checked={plan === "layaway"}
                onSelect={() => setPlan("layaway")}
                disabled={!canLayaway}
                soon={!config.layaway.enabled}
                title="Layaway"
                price={canLayaway ? `${config.layaway.downPaymentPercent}% down` : undefined}
                detail={
                  !config.layaway.enabled
                    ? "Pay in installments — available soon."
                    : canLayaway
                      ? `${formatPHP(layawaySchedule(total, config)[0].amount)} today, then ${config.layaway.installments} payments every ${config.layaway.intervalDays} days. Item released once fully paid.`
                      : `Available on orders of ${formatPHP(config.layaway.minSubtotal)} and up.`
                }
              />
            </div>
            {plan === "layaway" && <p className="mt-3 text-xs leading-relaxed text-cream-dim">{config.layaway.terms}</p>}
          </Step>

          <Step n={4} title="Payment method">
            <div className="grid gap-3 sm:grid-cols-2">
              {shownMethods.map((m) => (
                <Choice
                  key={m}
                  Icon={METHOD_ICONS[m]}
                  checked={method === m}
                  onSelect={() => setMethod(m)}
                  disabled={!methods.includes(m)}
                  soon={!methods.includes(m)}
                  title={PAYMENT_LABELS[m]}
                  detail={
                    !methods.includes(m)
                      ? m === "card"
                        ? "Online card payments are coming soon. Cards are accepted at meet-ups."
                        : "Coming soon."
                      : m === "bank_transfer"
                      ? `BDO, Metrobank, BPI or GCash. Send, then upload your proof of payment within ${config.bankTransferHours}h.`
                      : m === "pay_at_meetup"
                        ? "We’ll confirm your meet-up schedule by phone or Messenger."
                        : "Secure checkout by PayMongo."
                  }
                />
              ))}
            </div>
            {method === "bank_transfer" && (
              <div className="mt-4 border border-gold/20 p-4 text-sm">
                <p className="text-cream-muted">You&rsquo;ll transfer <span className="text-cream">{formatPHP(dueToday)}</span> to one of:</p>
                <ul className="mt-2 space-y-1">
                  {config.bankAccounts.map((b) => (
                    <li key={b.bank + b.accountNumber} className="text-cream"><span className="text-gold-light">{b.bank}</span> · {b.accountName} · {b.accountNumber}</li>
                  ))}
                </ul>
              </div>
            )}
          </Step>

          <div className="pt-8">
            <button type="submit" disabled={blocked || submitting} className="btn-gold h-14 w-full disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" strokeWidth={1.5} />}
              {submitting ? "Placing order…" : method === "bank_transfer" || method === "pay_at_meetup" ? `Place order · ${formatPHP(dueToday)}` : `Pay ${formatPHP(dueToday)}`}
            </button>
            <p className="mt-3 text-center text-xs text-cream-dim">
              By placing your order you agree to our <Link href="/shipping-returns" className="underline underline-offset-4">Shipping &amp; Returns</Link> policy.
            </p>
          </div>
        </form>

        <aside className="hidden h-fit border border-gold/20 bg-ink-50 p-6 lg:sticky lg:top-28 lg:block">
          <h2 className="eyebrow mb-5 text-gold">Order summary</h2>
          {summary}
        </aside>
      </div>
    </div>
  );
}
