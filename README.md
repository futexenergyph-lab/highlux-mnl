# HIGHLUX MNL

**Authentic Luxury, Timeless Investment.** E-commerce for a Philippine reseller of authentic pre-loved luxury bags, watches, diamonds and jewelry.

**Stack:** Next.js 14 (App Router, TypeScript) · Tailwind CSS · shadcn/ui (Radix) · Supabase (Postgres, Auth, Storage) · PayMongo · Vercel.

## Build phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Scaffold, design system, homepage, catalog schema + seed | ✅ Done |
| 2 | Shop All + filters, category pages, product pages, search, wishlist, recently viewed | ✅ Done |
| 3 | Cart, checkout, item reservation, PayMongo, bank transfer, layaway, emails, order tracking | ✅ Done |
| 4 | Customer accounts (email + Google) | ⏳ Next |
| 5 | Admin dashboard | — |
| 6 | Meta Pixel + CAPI, catalog feed, OG images, sitemap, schema.org | — |

## Run locally

```bash
npm install
cp .env.example .env.local   # optional for Phase 1
npm run dev                  # http://localhost:3000
```

**The site runs without Supabase.** When `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, data comes from `lib/sample-data.ts` (12 products, reviews, and the hero content). Once they are set, everything reads from Postgres.

## Environment variables

See `.env.example`. Variables are grouped by the phase that first needs them.

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, OG tags, sitemap |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (browser + server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only jobs: payment webhooks, reservation expiry. **Never expose.** |
| `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` | GCash, Maya and card payments via PayMongo Checkout |
| `PAYMENTS_MOCK=1` | Local demos only: simulates online payments when no PayMongo key is set |
| `CRON_SECRET` | Protects `/api/cron/expire-holds` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Order emails (Phase 3) |
| `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` | Meta Pixel + Conversions API (Phase 6) |
| `NEXT_PUBLIC_MESSENGER_USERNAME`, `NEXT_PUBLIC_VIBER_NUMBER`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_INSTAGRAM_HANDLE` | Contact and chat links |

## Supabase setup

1. Create a project at supabase.com and copy its URL and keys into `.env.local`.
2. Apply the migrations. Either:
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`, or
   - **Dashboard:** paste each file in `supabase/migrations/` (in filename order) into the SQL Editor.
3. Seed the sample catalog: run `supabase/seed.sql` in the SQL Editor. It is safe to run more than once.
4. Make yourself an admin after signing up:
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
   ```

`supabase/seed.sql` is generated from `lib/sample-data.ts`. Regenerate it with `npx tsx scripts/generate-seed.ts`.

### Schema (Phase 1)

- `profiles`: one row per auth user, with `role` (`customer` | `staff` | `admin`). Created automatically on sign-up.
- `brands`, `products`, `product_images` (max 15 per product, ordered by `position`).
- Product fields: condition grade + notes, inclusions, authenticity method + certificate URL, `specs` JSON (measurements, material, hardware, year/serial; watches: reference no., movement, case size), and status `available | reserved | sold | hidden`. `reserved_until` / `reserved_by` hold the 15-minute checkout reservation used in Phase 3.
- `site_settings` (key `home` holds the editable hero), `reviews`, `newsletter_subscribers`.
- **RLS:** the public can read everything except `hidden` products (sold items stay visible as social proof). Only staff and admins can write. Customers can't change their own role.
- **Storage buckets:** `product-media` and `site-assets` (public read, staff write).

## Storefront routes

| Route | What it is |
| --- | --- |
| `/` | Homepage |
| `/shop` | Shop All. Query params: `q`, `brand` (comma list of slugs), `condition`, `color`, `min`, `max`, `status=available\|sold`, `sort=newest\|price-asc\|price-desc`, `page` |
| `/bags`, `/watches`, `/jewelry`, `/accessories` | Category pages: same filters, plus `type=<sub-category>` |
| `/<category>/<slug>` | Product page, e.g. `/bags/louis-vuitton-speedy-30-monogram` |
| `/wishlist` | Saved items and recently viewed |
| `/api/search?q=` | Instant search (top 6 results) |
| `/api/products?ids=` | Fresh product summaries for the wishlist and recently viewed |
| `/cart`, `/checkout` | Bag and checkout |
| `/orders/<number>?t=<token>` | Order status, payments, layaway schedule, proof upload |
| `/track-order` | Find an order by number + email |
| `/api/checkout/hold`, `/api/checkout/release` | Start or end a checkout hold |
| `/api/webhooks/paymongo` | PayMongo payment webhook |
| `/api/cron/expire-holds` | Expiry sweep (cron) |

**How catalog data works:** `lib/data.ts` loads the whole public catalog in one query, caches it for 60s with the tag `catalog`, and runs filtering, facet counts and search in memory (`lib/filters.ts`). That suits a one-of-a-kind inventory of up to a few thousand pieces. Beyond roughly 5,000, move filtering into SQL. Within each sort, available pieces come first, then reserved, then sold. Facet counts apply every *other* active filter, so no option leads to zero results.

**Wishlist and recently viewed** are stored in the browser as product IDs. Price and status are re-fetched when shown, so a saved piece that has sold displays as sold. Phase 4 syncs the wishlist to the customer's account.

**"Inquire via Messenger"** opens `m.me/<page>?text=…` with the item name, price and link. Some Messenger clients ignore pre-filled text, so the message is also copied to the clipboard.

## Checkout, payments & layaway (Phase 3)

**Flow:** Bag (`/cart`) → Checkout (`/checkout`) → PayMongo, or bank-transfer instructions → Order page (`/orders/HLX-1001?t=<token>`). Customers can find their order again at `/track-order` with order number + email.

**Holding one-of-a-kind items.** Every hold rule lives in SQL functions (`supabase/migrations/…_orders.sql`):

| Moment | What happens to the piece |
| --- | --- |
| Customer opens checkout | Held for their browser session for **15 min** (`reserve_products`). Everyone else sees **Reserved**. Concurrent attempts are race-safe: only one shopper gets it. |
| Order placed (`place_order`) | The hold moves to the order and is extended: **30 min** for GCash/Maya/card, **24 h** for bank transfer, **48 h** for pay-at-meet-up. Prices are re-checked under lock. |
| Proof of payment uploaded | The hold is paused (no expiry) while staff verify it. |
| Layaway down payment received | Held for the customer with no expiry; shown publicly as **Reserved**. |
| Fully paid (`record_payment`) | Marked **Sold** and kept visible as social proof. |
| Hold lapses unpaid | Shown as available again immediately; `expire_holds()` marks the order expired. |

`record_payment` is idempotent, so a webhook delivered twice changes nothing. If a payment arrives after the hold lapsed and someone else has taken the piece, the order is flagged `needs_review` for a refund or substitute instead of being silently double-sold.

**Expiry sweep.** `vercel.json` runs `/api/cron/expire-holds` once a day, because that's the most often Vercel's free Hobby plan allows. For a 5-minute sweep, enable the `pg_cron` extension in Supabase and run:
```sql
select cron.schedule('expire-holds', '*/5 * * * *', 'select public.expire_holds()');
```
Customers never see a lapsed hold either way, because pages already treat expired holds as available.

**PayMongo setup**
1. Copy the secret key from PayMongo Dashboard → Developers into `PAYMONGO_SECRET_KEY` (`sk_test_…` while testing).
2. Under Webhooks, add `https://<your-domain>/api/webhooks/paymongo` for the event `checkout_session.payment.paid`, and copy its signing secret into `PAYMONGO_WEBHOOK_SECRET`.
3. The webhook verifies the signature, rejects events older than 5 minutes, and checks the amount PayMongo collected before marking anything paid.

**Layaway.** Configured in `site_settings` key `checkout`; defaults are in `lib/checkout/settings.ts`. The defaults are a 30% down payment, 2 installments 30 days apart, and a ₱20,000 minimum order. Installments can be paid online or by bank transfer from the order page. The balance and installment status update automatically as payments land.

**Other checkout settings** in the same key: Metro Manila / provincial shipping rates and an optional free-shipping threshold, whether meet-up and pickup are offered (with their notes), hold durations, bank accounts shown to customers, and the staff notification email.

**Emails** go through Resend (`RESEND_API_KEY`). Customers get: order received (with bank or layaway instructions), proof received, and payment received. Staff get notified of new orders, proofs and payments. Without a key, emails are only logged to the console.

**Demo without any keys:** without Supabase, orders live in server memory (`lib/orders/memory-repo.ts`, which mirrors the SQL functions) and reset on restart. Run `PAYMENTS_MOCK=1 npm run dev` to walk the whole flow with simulated GCash/Maya/card.

## Design system

- Colors are defined in `tailwind.config.ts`: `ink` `#0d0b09`, `gold` `#c9a24a` → `gold-light` `#e8cf8a`, `cream` `#f3ead8`.
- Fonts: Playfair Display (`font-serif`), Montserrat (`font-sans`), Great Vibes (`font-script`), loaded with `next/font`.
- Utility classes in `app/globals.css`: `.text-gold-gradient`, `.eyebrow`, `.gold-divider`, `.btn-gold`, `.btn-outline-gold`.
- Placeholder art in `public/placeholders/` is brand-free SVG generated by `node scripts/generate-placeholders.mjs`. The hero image is replaced through `site_settings.home.heroImageUrl`, edited in the admin homepage editor in Phase 5.

## Project structure

```
app/
  layout.tsx            fonts, metadata
  (store)/layout.tsx    announcement bar, header, footer, Messenger button
  (store)/page.tsx      homepage
  actions.ts            server actions (newsletter)
components/
  layout/  home/  product/  cart/  brand/  ui/
lib/
  catalog.ts            categories, sub-categories, brands, nav, URL helpers
  data.ts               server data access (Supabase, or sample-data fallback)
  types.ts  site.ts  utils.ts  sample-data.ts
  supabase/             server, browser and service-role clients
supabase/migrations/    SQL migrations
supabase/seed.sql       generated seed
```

## Deploy (Vercel)

1. Import the repo in Vercel. The framework preset is detected as Next.js.
2. Add the environment variables from `.env.example` under Project → Settings → Environment Variables.
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
4. Deploy.
