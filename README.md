This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Partner Hub Vendor Dashboard — DB Contract (Supabase)

This README is the **source of truth** for how the vendor dashboard talks to the database. It documents tables, key fields, RLS policies, triggers, and the expected read/write paths for vendors vs. admins.

> Roles referenced here
>
> * **Public**: Not authenticated vendor; can only read availability & catalog.
> * **Vendor**: Authenticated user present in `company_users` for a company.
> * **Admin**: JWT has `role=admin` (or server calls using **service role key**)—bypasses RLS.

---

## Tables & Policies (at a glance)

| Table                     | Purpose                                 |                                                                        Public | Vendor                                                  | Admin / Service |
| ------------------------- | --------------------------------------- | ----------------------------------------------------------------------------: | ------------------------------------------------------- | --------------- |
| `companies`               | One row per vendor/company              |                                                                             – | **SELECT** own                                          | **ALL**         |
| `company_users`           | User↔Company membership & role          |                                                                             – | **SELECT** where `user_id = auth.uid()`                 | **ALL**         |
| `tool_listings`           | Published listing shown on site         |                                                                             – | **SELECT** own; **NO UPDATE** (use `listing_changes`)   | **ALL**         |
| `listing_changes`         | Vendor-submitted edits (moderated)      |                                                                             – | **SELECT + INSERT** own                                 | **ALL**         |
| `partner_threads`         | Inbox threads (vendor↔admin)            |                                                                             – | **SELECT + INSERT** own company                         | **ALL**         |
| `partner_messages`        | Messages inside a thread                |                                                                             – | **SELECT + INSERT** where thread belongs to own company | **ALL**         |
| `sponsor_slots`           | One row per day; sponsorship status     |                                                                    **SELECT** | **SELECT**                                              | **ALL**         |
| `sponsor_orders`          | Checkout orders for day sponsorship     |                                                                             – | **SELECT + INSERT** own                                 | **ALL**         |
| `ad_products`             | Non-calendar SKU catalog                |                                                                    **SELECT** | **SELECT**                                              | **ALL**         |
| `ad_orders`               | Orders for non-calendar placements      |                                                                             – | **SELECT + INSERT** own                                 | **ALL**         |
| `ad_creatives`            | Creative assets tied to an `ad_order`   |                                                                             – | **SELECT + INSERT** for own orders                      | **ALL**         |
| `placement_metrics_daily` | Daily impressions/clicks rollups        |                                                                             – | **SELECT** own `company_id`                             | **ALL**         |
| `v_my_companies` (VIEW)   | Convenience: current user → company ids | *Shows as Unrestricted* → **RLS enforced via `company_users` under the hood** |                                                         |                 |

> **Note:** Views show as “Unrestricted” in UI because RLS isn’t applied *to views*; queries against a view still respect RLS of the underlying tables.

---

## Key Schemas (fields we rely on)

### `companies`

* `id (uuid)` — PK
* `name (text)`, `website (text)`, `domain (text unique)`, `status (text)`

### `company_users`

* `user_id (uuid)` ↔ `auth.users`
* `company_id (uuid)` ↔ `companies.id`
* `role (text)` — `company_admin|company_editor|company_viewer`

### `tool_listings`

* `company_id (uuid)`
* `tool_id (uuid?)` — optional FK to your `ai_tools`
* `display_name`, `model_name`, `summary`, `use_cases`
* `pricing (jsonb)`, `login_requirements`, `features (jsonb)`
* `website_url`, `logo_url`, `screenshots (jsonb)`
* `is_published (bool)`, `updated_at`

### `listing_changes`

* `listing_id (uuid?)` — null for net-new listing
* `company_id (uuid)` — **RLS hinge**
* `proposed (jsonb)` — full proposed object
* `status (text)` — `pending|approved|rejected`
* `notes (text)`, `created_by (uuid)`, `reviewed_by (uuid)`, `reviewed_at`

### Messaging (`partner_threads`, `partner_messages`)

* Threads: `company_id`, `subject`, `last_message_at`
* Messages: `thread_id`, `sender_role ('company'|'admin')`, `body`, `attachments`

### Sponsorship calendar (`sponsor_slots`, `sponsor_orders`)

* Slots: `slot_date (date unique)`, `status ('open'|'held'|'booked'|'blocked')`, `price_cents`, `held_until`, `sponsor_company_id`
* Orders: `slot_id`, `company_id`, `stripe_session_id`, `stripe_payment_intent`, `amount_cents`, `status ('pending'|'paid'|'failed'|'canceled'|'refunded')`

### Ads (`ad_products`, `ad_orders`, `ad_creatives`)

* Products: `code (unique)`, `name`, `description`, `price_cents`, `duration_days`, `active`
* Orders: `company_id`, `product_id`, `status ('pending'|'paid'|'scheduled'|'active'|'completed'|'canceled')`, `start_date`, `end_date`
* Creatives: `order_id`, `headline`, `body`, `image_url`, `cta_label`, `cta_url`

### Analytics (`placement_metrics_daily`)

* `company_id`, `ad_order_id?`, `date`, `impressions`, `clicks`

---

## Read/Write Paths (what calls write where)

### 1) Listing moderation

* **Vendor (dashboard → "Submit for approval")** → `POST /api/listing-changes` → **INSERT** row into `listing_changes` (`company_id` = vendor’s company).
* **Admin (moderation UI)** reviews diff → **upserts** into `tool_listings` (sets `is_published=true`) and marks `listing_changes.status='approved'`.
* **RLS**: Vendors can’t `UPDATE tool_listings` directly; they only `INSERT` into `listing_changes`.

### 2) Messaging

* **Vendor** creates a thread in `partner_threads` (company-scoped), then **INSERT** messages in `partner_messages` with `sender_role='company'`.
* **Admin** replies with `sender_role='admin'`.
* **RLS** ensures vendors only see threads/messages for their own `company_id`.

### 3) Sponsor-a-Day (soft upsell)

* **Public/Vendor** reads `sponsor_slots` to render calendar.
* **Checkout start** (server route):

  * Validate the slot is `open` (or `held` but expired),
  * Enforce **1 per company in rolling 30 days** (see trigger),
  * Update slot → `status='held'`, set `held_until` and `sponsor_company_id`,
  * Create Stripe Checkout Session + **INSERT** `sponsor_orders (pending)`.
* **Webhook** (server): on successful payment → update `sponsor_orders.status='paid'` and slot → `status='booked'`.

### 4) Ads (non-calendar)

* **Public/Vendor** can read `ad_products` (catalog).
* **Vendor** creates `ad_orders` for their `company_id`, and `ad_creatives` tied to those orders.
* **Admin** schedules/activates and fulfills placements.

### 5) Analytics

* Server job writes to `placement_metrics_daily`.
* Vendors **SELECT** rows where `company_id` is theirs.

---

## Security Contract (RLS recap)

* **Vendors** can only operate within their `company_id` and cannot edit published listings directly.
* **Public** can only read `sponsor_slots` (availability) and `ad_products` (catalog).
* **Admin** (or **service role key**) can do everything.
* **Views** (like `v_my_companies`) surface underlying data that is still protected by table RLS.

---

## Trigger(s)

### `enforce_intro_month_limit()` on `sponsor_slots`

* Ensures **max 1** `booked` slot per `sponsor_company_id` in a rolling 30-day window (in addition to app-side checks).

---

## Seeders (dev convenience)

```sql
-- Sponsor days (next 30 days at $1)
insert into public.sponsor_slots (slot_date, price_cents)
select d::date, 100
from generate_series(now()::date + 1, now()::date + 30, interval '1 day') d
on conflict (slot_date) do nothing;

-- Example ad products
insert into public.ad_products (code, name, description, price_cents, duration_days, active)
values
  ('HOMEPAGE_FEATURE', 'Homepage feature', 'Hero placement on homepage', 50000, 7, true),
  ('CATEGORY_TOP', 'Category top slot', 'Top card in a Field Guide category', 30000, 7, true),
  ('NEWSLETTER_SPOT', 'Newsletter shoutout', 'One-time sponsor line + CTA', 15000, 1, true)
on conflict (code) do update set active = excluded.active;
```

---

## Admin Checklists

* **Moderation:** Review `listing_changes` → approve/reject → upsert `tool_listings` → trigger revalidation (if you’re ISR/SSG).
* **Sponsorship:** Monitor `sponsor_slots` for holds/bookings; confirm webhook events update rows correctly.
* **Security:** Ensure admin JWTs include `role=admin` claim; server code that mutates rows uses **service role key**.

---

## Notes for Engineers

* **Never** send the service role key to the client.
* Prefer server routes (App Router) for operations that change state: booking holds, Stripe webhooks, approvals.
* For client queries, rely on RLS and scoped selects (company\_id-aware) to avoid over-fetch.
* Keep sponsorship as a **teaser** on the dashboard; the full calendar lives at `/partners/ads`.

---

## Future Extensions

* Domain verification (email domain or DNS TXT) on `/partners/claim`.
* Diff UI for moderation (side-by-side: current vs. proposed).
* Email notifications on approval and sponsorship confirmations.
* Optional **UPDATE** policy for `ad_creatives` if you want vendors to tweak creatives post-submit.

---

**End of contract.** Paste this file into your repo as `README-db.md`. If any table/policy changes, update this document in the same PR.
