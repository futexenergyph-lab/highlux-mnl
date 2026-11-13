# HIGHLUX MNL — project notes for Claude

Read this first in every new session. README.md has the full setup, routes and phase details.

## What this is
E-commerce site for a Philippine reseller of authentic pre-loved luxury bags, watches, jewelry, shoes and accessories. Owner works through Futex Energy PH (futexenergyph-lab on GitHub). Prices are in pesos (₱).

**Stack:** Next.js 14 App Router + TypeScript · Tailwind + shadcn/ui (Radix) · Supabase (Postgres, Auth, Storage) · PayMongo (GCash, Maya, card) · Resend emails · Meta Pixel + CAPI · deployed on Vercel.

The site also runs without Supabase (sample data from `lib/sample-data.ts`, demo accounts with `ACCOUNTS_DEMO=1`, mock payments with `PAYMENTS_MOCK=1`).

## Where things live
- `app/(store)/` — public storefront: shop, categories, product pages, cart, checkout, orders, track order, account, register/login, sell-to-us, bidding
- `app/admin/` — admin dashboard: orders, products, purchases (Purchase Records), bidding + auction events, customers, consignments, layaway, homepage, settings
- `app/api/` — webhooks (PayMongo), cron (expire holds), OG images, view counters, catalog feed
- `components/` — UI by area (admin, bidding, product, shop, layout, home…)
- `lib/` — data layer per area (`auctions/`, `admin/`, `account/`…), each with `repo.ts`, `supabase-repo.ts` and `memory-repo.ts` (demo mode)
- `supabase/migrations/` — schema changes; `supabase/setup.sql` is all migrations + seed in one file

## Status
Phases 1–6 are done (catalog, shop, checkout/payments/layaway, accounts, admin, marketing/SEO). Recent work since then:

**Bidding / auctions**
- Two event types: **Website auction event** (online bidding on the site) and **Manual auction event** (live auction elsewhere; items get an **Item #**, show the was price and a countdown, and a **Bid here!** button when a bidding location link is set).
- `/bidding` lists both kinds, ongoing events first, then upcoming, with each event's items under it.
- Bidding cards lead with **STARTING BID** (gold label, large bold amount) right after the item name, with the **was price** small and crossed out below.
- Link previews for auction pages show the item photo, Item # and the was price only.
- Ended bidding links show customers "This bidding has ended"; admins still see the page.
- Event item ⋮ menu: Share link (ready-made bidding post), Mark as sold (records a purchase), Edit product listing, Remove (removed items lose their Item # and the rest renumber).
- Link-open counters per auction item, including visitors from Viber/Messenger/WhatsApp in-app browsers.
- Bidding guidelines page has the 11 auction rules (the first-event poster was removed).

**Flash Sale Deals** (`app/admin/flash-sales`, `lib/flash/`, public `/flash-sale`)
- Event = title + start/end; add available pieces with a sale price (must be below the regular price; a piece can't be in two overlapping sales).
- Nothing is written to products: while a sale runs, `getCatalog()` swaps in the sale price (struck price = was price or regular price) and checkout charges it; `place_order` uses `flash_price()` in SQL so totals match. Regular prices come back by themselves when it ends.
- Product cards show a "⚡ Flash sale" badge; product page and /flash-sale show the countdown.
- Two kinds: **Website flash sale** (above) and **Group flash sale** (sold in a group chat: each piece has **Mine** and **Steal** prices, event has a group link shown as "Join group"; site price and checkout unchanged; `flash_price()` ignores group sales; customers never see the shop price for these pieces — cards and the product page show only Was/Mine/Steal, and Add to bag is hidden).

**Orders & purchase records**
- Orders list ⋮ menu: **Proceed** (moves to next step: paid → packed → ready/shipped → delivered), **Edit order**, **Delete order & mark available**.
- Pay-at-meet-up orders awaiting payment show under **Needs action**, a **Meet-ups to arrange** tab, the dashboard's Needs attention list and the Orders badge. For these, use **Record payment** to mark paid, then ⋮ → Proceed.
- Purchase Records: available listing value per category (Luxury Bags, Watches, Jewelry, Shoes, Accessories) plus total; **Mark as returned** on Edit purchase (cancels the order, removes it from sales totals, puts the piece back on sale).

**Members**
- Full registration form with ID upload (private `member-ids` bucket).

## Database migrations
When adding a migration: add the file in `supabase/migrations/`, list it in README.md under "Added after launch", and run `npm run db:setup-sql` to regenerate `supabase/setup.sql`. Remind the owner to run the new file once in the Supabase SQL Editor. Latest so far: `20261113000021_flash_views.sql`.

## How to work with the owner
- The owner works from a phone and is not a developer: explain results in plain language, short, no jargon.
- Commit straight to `main` with a clear one-line summary of what changed for users (see `git log` for the style); Vercel deploys from `main`.
- Send a screenshot or describe exactly what changed on screen when a visual change is done.
- Run `npm run typecheck` and `npm run lint` before committing when dependencies are installed.
