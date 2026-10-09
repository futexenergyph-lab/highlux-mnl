# HIGHLUX MNL

**Authentic Luxury, Timeless Investment.** E-commerce for a Philippine reseller of authentic pre-loved luxury bags, watches, diamonds and jewelry.

**Stack:** Next.js 14 (App Router, TypeScript) · Tailwind CSS · shadcn/ui (Radix) · Supabase (Postgres, Auth, Storage) · PayMongo · Vercel.

## Build phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Scaffold, design system, homepage, catalog schema + seed | ✅ Done |
| 2 | Shop All + filters, category pages, product pages, search, wishlist, recently viewed | ✅ Done |
| 3 | Cart, checkout, item reservation, PayMongo, bank transfer, layaway, emails, order tracking | ✅ Done |
| 4 | Customer accounts (email + Google) | ✅ Done |
| 5 | Admin dashboard | ✅ Done |
| 6 | Meta Pixel + CAPI, catalog feed, OG images, sitemap, schema.org, informational pages | ✅ Done |

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
| `ACCOUNTS_DEMO=1` | Local demos only: in-memory demo accounts when Supabase isn't configured |
| `DEMO_ADMIN_EMAILS` | Demo mode only: which demo accounts get admin access |
| `RESEND_API_KEY`, `EMAIL_FROM` | Order emails (Phase 3) |
| `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` | Meta Pixel + Conversions API |
| `META_TEST_EVENT_CODE` | Optional: see server events under Events Manager → Test events |
| `META_GRAPH_API_VERSION` | Optional: Graph API version for the Conversions API (default `v23.0`) |
| `NEXT_PUBLIC_MESSENGER_USERNAME`, `NEXT_PUBLIC_VIBER_NUMBER`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_INSTAGRAM_HANDLE` | Contact and chat links |

## Supabase setup

1. Create a project at supabase.com and copy its URL and keys into `.env.local`.
2. Create the database. Either:
   - **Easiest (new project):** open `supabase/setup.sql`, copy all of it, paste it into Supabase → **SQL Editor** → New query, and click **Run** once. It contains every migration plus the sample catalog. Regenerate it with `npm run db:setup-sql` after adding migrations.
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`, then run `supabase/seed.sql`.
3. For later schema changes on an existing project, run only the new files in `supabase/migrations/`.
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
| `/login` | Sign in, create account, email sign-in link, Google |
| `/auth/callback` | Return URL for Google, email confirmation and sign-in links |
| `/account`, `/account/orders`, `/account/wishlist`, `/account/addresses`, `/account/profile` | Customer account area |
| `/api/account/session`, `/api/account/wishlist` | Sign-in check and wishlist sync for client components |
| `/sell-to-us`, `/api/consign` | "Sell to Us / Consign" form (photos go to a private bucket) |
| `/admin/…` | Admin dashboard (staff/admin only) |
| `/api/admin/upload` | Staff uploads (product photos, certificates, hero image) |
| `/how-to-order`, `/about`, `/authenticity`, `/shipping-returns`, `/faq`, `/contact`, `/privacy` | Informational pages (shipping rates, holds and payment methods read live from checkout settings) |
| `/sitemap.xml`, `/robots.txt` | Search engine sitemap and crawl rules |
| `/api/catalog.xml` | Facebook / Instagram (and Google Merchant) product feed |
| `/opengraph-image`, `/<category>/<slug>/opengraph-image`, `/api/og/<category>/<slug>` | Generated 1200×630 share images |
| `/api/meta/event` | Server copy of browser Pixel events (Conversions API) |
| `/api/contact` | Contact form → staff email |
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

**Currently switched off (shown grayed out as "Coming soon"):**
- **Layaway:** `layaway.enabled = false`.
- **Online card payments via PayMongo:** `disabledMethods = ["card"]`. Cards are still accepted at meet-ups.

The server refuses both even if someone tampers with the request. To turn them on, set `layaway.enabled` to `true` and/or remove `"card"` from `disabledMethods` in `site_settings` key `checkout`, or change the defaults in `lib/checkout/settings.ts`. The product page, bag and footer text update to match.

**Layaway.** Configured in `site_settings` key `checkout`; defaults are in `lib/checkout/settings.ts`. Once switched on, the defaults are a 30% down payment, 2 installments 30 days apart, and a ₱20,000 minimum order. Installments can be paid online or by bank transfer from the order page. The balance and installment status update automatically as payments land.

**Other checkout settings** in the same key: Metro Manila / provincial shipping rates and an optional free-shipping threshold, whether meet-up and pickup are offered (with their notes), hold durations, bank accounts shown to customers, and the staff notification email.

**Emails** go through Resend (`RESEND_API_KEY`). Customers get: order received (with bank or layaway instructions), proof received, and payment received. Staff get notified of new orders, proofs and payments. Without a key, emails are only logged to the console.

**Demo without any keys:** without Supabase, orders live in server memory (`lib/orders/memory-repo.ts`, which mirrors the SQL functions) and reset on restart. Run `PAYMENTS_MOCK=1 npm run dev` to walk the whole flow with simulated GCash/Maya/card.

## Customer accounts (Phase 4)

Accounts are optional, and guest checkout always works. Signed-in customers get:
- **Order history:** includes their earlier guest orders. Any unclaimed order placed with the account's *verified* email is attached the first time they open their account.
- **Balance due and layaway status** on the overview.
- **Wishlist on every device:** device and account wishlists merge on sign-in. Signing out clears the device copy, which matters on shared phones.
- **Saved addresses:** add, edit, delete and set a default. Checkout preselects the default and picks the matching shipping zone, and a new address can be saved during checkout.
- **Faster checkout:** name, phone and email are prefilled, and orders are tied to the account automatically.
- **Profile:** edit name and phone; change or add a password.

**Security**
- Every account table uses row-level security. The account code runs as the signed-in user, so each customer can only read or change their own rows; this is tested in Postgres.
- Customers can edit their name and phone but can't change their own role.
- Order pages open for whoever holds the order's private link, or for its owner when signed in. Anyone else gets a 404.
- Checkout now also checks on the server that the shipping zone matches the address. The cheaper Metro Manila rate requires a Metro Manila city.

**Supabase Auth setup**
1. **Authentication → Providers → Email:** keep it enabled and leave **Confirm email** on. New customers verify their email before an account is created, and only verified emails claim guest orders.
2. **Authentication → Providers → Google:** create an OAuth client in Google Cloud Console (APIs & Services → Credentials → OAuth client ID → Web). Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorised redirect URI, then paste the client ID and secret into Supabase.
3. **Authentication → URL Configuration:** set the Site URL to your domain and add `https://<your-domain>/auth/callback` (plus `http://localhost:3000/auth/callback` for development) to the Redirect URLs.
4. **Optional:** under Authentication → Email Templates, brand the confirmation and sign-in-link emails.

**Demo without Supabase:** `ACCOUNTS_DEMO=1 PAYMENTS_MOCK=1 npm run dev` enables in-memory demo accounts. "Continue with Google" signs in a sample Google user, and everything resets on restart.

## Admin dashboard (Phase 5)

`/admin` is for accounts whose `profiles.role` is `staff` or `admin`. To grant access:
```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```
- **Guests** are sent to sign in.
- **Signed-in non-staff** get a 404, so the admin isn't advertised.
- **Every admin action and upload checks the role on the server.** The page layout's check isn't relied on.
- **Settings:** only `admin` can change them; `staff` can do everything else.

| Section | What it does |
| --- | --- |
| **Dashboard** | Needs-attention list (proofs to verify, orders to pack or ship, flagged orders, new consignments). Revenue received, pieces sold, average piece value, outstanding balances. Revenue per day (7 / 30 / 90 days / all time), top brands, payments by method, inventory counts. |
| **Orders** | Tabs: needs action, proof to verify, pending, to pack/ship, shipped, delivered, layaway, closed. Search by order number, name, email or phone. |
| **Order detail** | **Verify bank-transfer proofs:** view the image or PDF. Approve to record the payment and email the customer. Reject with a reason to email the customer and give them another 24 h to re-upload.<br>**Record a payment received without an upload:** cash or card at meet-up, or a direct transfer.<br>**Fulfilment:** Paid → **Packed** → **Shipped** (courier + tracking required for deliveries; email sent) → **Delivered**. Meet-up and pickup orders say "Ready" instead.<br>**Also:** cancel unpaid orders (releases the pieces), staff-only notes, quick Viber/WhatsApp links. |
| **Products** | Create, edit and delete. **Drag-and-drop photo upload** (up to 15): photos are resized in the browser to ≤2000 px and can be reordered by mouse, touch or keyboard (Space + arrows). The first photo is the cover.<br>**Fields:** brand (pick or type a new one), model, title and URL auto-filled, category/type, price and "was" price, condition grade and notes, inclusions, authenticity method and certificate upload, per-category specs plus custom fields, color, description, video, status, featured.<br>**Quick status menu** in the list. A piece that's on an order can't be deleted; hide it instead. |
| **Layaway** | Active plans with progress, next due date and overdue flags, plus outstanding totals. |
| **Consignments** | Inbox for `/sell-to-us` submissions: photos, details, status (new → reviewing → offered → accepted/declined → received), notes, quick contact links. |
| **Customers** | Account holders and guest buyers merged by email, with order count, amount paid and last order. |
| **Homepage** | Upload the hero image, edit every hero line with a live preview, and pick the **Curated Picks** shown above New Arrivals. |
| **Settings** | Payment methods on/off ("Coming soon" when off), layaway on/off and terms, shipping rates and free-shipping threshold, meet-up and pickup, hold durations, bank accounts, staff notification email. |

Changes in the admin refresh the affected storefront pages immediately.

**Storage buckets:** `product-media` and `site-assets` (public); `payment-proofs` and `consignments` (private, viewed by staff through short-lived signed links).

**Demo:** with `ACCOUNTS_DEMO=1`, create an account as `admin@highluxmnl.com` (or any address in `DEMO_ADMIN_EMAILS`) to open `/admin`.

## Marketing & SEO (Phase 6)

**Meta Pixel + Conversions API**
- **Events:** PageView on every store navigation (never in `/admin`), **ViewContent** on product pages, **AddToCart**, **InitiateCheckout** once the pieces are held, and **Purchase**.
- **Sent twice, counted once:** each event goes from the browser *and* from the server with the same `event_id`, so Meta counts it once even when ad blockers or iOS block the browser pixel.
- **Purchase** is sent by the server the moment an order becomes fully paid: on a PayMongo webhook, a staff-approved proof, or a recorded meet-up payment. It includes the customer's email, phone, name, city and ZIP, **SHA-256 hashed** and never sent raw. It also includes the visitor's `_fbp`/`_fbc` cookies, IP and browser, captured at checkout (`orders.attribution`), so the sale is credited to the ad click.
- **Prices** in server events come from the catalog, never from the browser.

**Setup**
1. In Meta Events Manager, create a Pixel and put its ID in `NEXT_PUBLIC_META_PIXEL_ID`. Then redeploy: the ID is built into the page.
2. Pixel → Settings → Conversions API → **Generate access token**, and put it in `META_CAPI_ACCESS_TOKEN`.
3. Optional: put the Test events code in `META_TEST_EVENT_CODE` to watch events arrive live, and remove it afterwards.

**Facebook / Instagram catalog:** in Commerce Manager, go to Catalog → Data sources → Add items → **Data feed** → Scheduled feed, use `https://<your-domain>/api/catalog.xml`, and set it to hourly.
- **What's in it:** every listed piece with price and sale price, condition (new/used), stock (sold and reserved pieces show as *out of stock*; hidden ones are left out), brand, Google category, color, material, up to 11 photos, and labels for ad sets by condition and price band.
- **Photos:** Meta rejects SVG, so the sample products link to their generated PNG card. Uploaded JPG/PNG photos are used directly.

**Share previews:** every product gets a 1200×630 card with photo, brand, model, condition and price (SOLD pieces show it). Every other page uses the site card built from the homepage hero. Fonts are in `assets/fonts` (SIL OFL).

**Search engines**
- `sitemap.xml` lists all pages, categories and products.
- `robots.txt` keeps admin, account, checkout, cart, orders and API routes out of search, and blocks preview deployments entirely.
- Product pages include schema.org **Product** (price in PHP, new/used condition, in stock / sold out, brand, images) and **BreadcrumbList**.
- The homepage includes **Store** and **WebSite** with a search box. The FAQ includes **FAQPage**.
- Every page has a canonical URL.

**Site URL:** links in emails, PayMongo returns, the feed and share cards use `NEXT_PUBLIC_SITE_URL`. On Vercel it falls back to the project's production domain (or the preview URL). Set it once you have a custom domain.

**Messenger:** Meta retired the embedded Messenger Chat Plugin in 2024, so the site uses the floating button that opens `m.me/<page>`. On product pages the message comes pre-filled with the item.

**Privacy:** `/privacy` is a template written for the Data Privacy Act of 2012. Have it reviewed and fill in your details before launch.

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

## Demo deployment (before Supabase is connected)

To preview the site on Vercel without a database, add these under Project → Settings → Environment Variables, then redeploy:

| Name | Value |
| --- | --- |
| `PAYMENTS_MOCK` | `1` |
| `ACCOUNTS_DEMO` | `1` |
| `DEMO_AUTH_SECRET` | any long random string |

Browsing (homepage, shop, product pages, search, wishlist) works fully. Demo orders and accounts live in server memory, which Vercel resets and doesn't share between instances, so checkout, sign-in and the admin can lose data. Connect Supabase for those. **Remove all three variables before going live.**

## Deploy (Vercel)

1. Import the repo in Vercel. The framework preset is detected as Next.js.
2. Add the environment variables from `.env.example` under Project → Settings → Environment Variables.
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
4. Deploy.
