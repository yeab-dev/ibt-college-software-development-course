# Addis Eats — Day 46: data representation

Week 10 turns from screens that collect data to screens that show it. Day 46
adds a staff **dashboard** — revenue by neighbourhood as a bar chart, orders
per day as a line, each with the same numbers in a table beneath it, and
every order in a sortable, paged table — and turns each customer's own
`/orders` list into the same kind of table. Every data screen now has all
four states (loading, empty, error, populated), and each can be forced on
demand.

The order store used to start empty, which gives a chart nothing to show,
so it now starts from a deterministic month of seeded history (425 orders).

- [DASHBOARD.md](DASHBOARD.md) is new today: chart or table, the
  aggregation and what crosses to the browser, the honest-chart rules, the
  table markup, sorting and paging in the URL, the four states and how to
  force them.
- [AUTH.md](AUTH.md) gains "the dashboard, behind the same three layers",
  with status codes, and why the skeleton is a `<Suspense>` after the check
  rather than a `loading.js` (measured: `200` instead of `403`).
- [DATA.md](DATA.md) gains the dashboard's reads and the seeded month.
- [BOUNDARY.md](BOUNDARY.md) gains the two chart leaves, two error
  boundaries, and the table components that stay on the server.
- [PROJECT.md](PROJECT.md) gains the `/dashboard` row. [PERF.md](PERF.md),
  [SEO.md](SEO.md) and [STRATEGY.md](STRATEGY.md) are Day 45's, unchanged
  (the one new cost, Recharts on `/dashboard` only, is in DASHBOARD.md).

## Run it

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET: openssl rand -base64 32
npm run build
npm run start                # http://localhost:3000
npm run lint
```

Demo accounts (AUTH.md): Almaz `0911223344` / `almaz1234` and Bereket
`0922334455` / `bereket1234` (customers), Selam `0910101010` / `selam1234`
(staff). Sign in as Selam and open `/dashboard`. Accounts, sessions and
orders are written to `.data/` (git-ignored); the first read seeds 425
orders over the 30 days before today (Almaz has 46, Bereket 10). Delete the
folder to start again from the seed, dated from today.

### Forcing the four states

```bash
npm run dev                                    # ?state= always works here
ADDIS_EATS_DEMO_STATES=1 npm run start         # or on the production build
```

| URL (signed in) | State |
| --- | --- |
| `/dashboard`, `/orders` | Populated |
| `…?state=loading` | The skeleton for 3 s, then the data |
| `…?state=empty` | The empty state (for real: sign up a new account, open `/orders`) |
| `…?state=error` | The error boundary with *Try again* (for real: make `.data/orders.json` invalid JSON) |

Without the variable, `npm run start` ignores `?state=`. The switch is read
after the session and role checks, so it never opens a page to anyone.

## Deploying to Vercel

Not done yet: deploying is the student's step. This is Day 45's checklist,
with the Day 46 folder and route. Leave `ADDIS_EATS_DEMO_STATES` unset there.

**The project.** Import the GitHub repository in Vercel and set **Root
Directory** to `M03-react-nextjs/day46/addis-eats`. This repository holds the
whole course, so without that setting Vercel builds the wrong folder. The
framework preset (Next.js), `npm run build` and the Node version are detected
from `package.json`.

**Environment variables** (Project → Settings → Environment Variables):

| Variable | Production | Preview | Development (local) |
| --- | --- | --- | --- |
| `SESSION_SECRET` | A fresh `openssl rand -base64 32`, marked *Sensitive* | A **different** random value, so a preview cookie is never valid in production | Your own, in `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | The production URL, e.g. `https://addis-eats.vercel.app` (no trailing slash) | The production URL too, so canonicals always point at the real site. To check a preview's own cards, set it to that branch's stable alias URL instead | Empty: falls back to `http://localhost:3000` |
| `NEXT_PUBLIC_ANALYTICS_SRC` | Empty, unless a real analytics script is added | Empty | Empty |

Two rules make the table what it is:

- `NEXT_PUBLIC_SITE_URL` is **read by the build**: it is in the prerendered
  pages, the sitemap, robots.txt and every og:image. Set it before the first
  build; after changing it, redeploy (a new build), not just restart.
- `SESSION_SECRET` has no `NEXT_PUBLIC_` prefix, so it never reaches the
  browser. Changing it signs everyone out (AUTH.md).

**The storage problem, honestly.** Addis Eats stores accounts, sessions and
orders as JSON files in `.data/` (`lib/jsonStore.js`, `lib/orders.js`).
Vercel runs the server as functions on a **read-only filesystem**: only
`/tmp` is writable, it belongs to one instance, and it is emptied when the
instance is recycled. So on Vercel, as the code stands:

- **Works:** `/`, `/menu`, every dish page, search, the cart, `/sitemap.xml`,
  `/robots.txt`, the preview images, and the protection on the way in —
  `/checkout`, `/orders`, `/kitchen` and `/dashboard` redirect to sign-in (`307`), the
  order API answers `401`. All the discovery and performance checks can be
  done there.
- **Fails with a `500`:** signing in (the first read copies the accounts
  seed into `.data/`; Day 46: the first order read also writes the order seed), signing up, placing and cancelling orders — every
  write. So the signed-in walkthrough and the three attacks *cannot* be shown
  on a Vercel URL; show them on `npm run build && npm run start`.

Pointing `.data/` at `/tmp` would look like a fix and is not one: each
instance would have its own accounts and sessions, and lose them within
minutes, so a person would be signed out between two requests. The real fix
is a hosted database (Module 4, or a Postgres/Redis store from the Vercel
Marketplace) behind the same `lib/` functions. Until then, a host that runs
one long-lived `next start` process with a persistent disk would run the
whole app unchanged. The data layer was deliberately not changed today.

**After each deployment, check from the deployed URL** (the sheet's "view
source, not your code"):

```bash
URL=https://addis-eats.vercel.app      # your production URL
curl -sI $URL/checkout | grep -i 'location\|x-addis-eats-proxy'   # 307 → /login?next=%2Fcheckout
curl -s -o /dev/null -w '%{http_code}\n' $URL/api/orders/1001    # 401
curl -s $URL/menu/kitfo | grep -o '<meta property="og:image" content="[^"]*"'   # https://…, not localhost
curl -s $URL/sitemap.xml | grep -c '<loc>https://'                 # 15
curl -s $URL/robots.txt                                            # Sitemap: https://…/sitemap.xml
curl -s -o /dev/null -w '%{http_code}\n' "$URL/api/dishes?q=tibs"  # 200: data/menu.json was deployed
npx lighthouse $URL/menu --only-categories=performance             # add the column to PERF.md
```

Then paste a dish link into a chat to see the card (image, name, price), and
put the URL at the top of this README. Previews are often behind Vercel's
deployment protection, which also hides them from link-preview crawlers;
check cards on the production URL.

## The seven exercises, and where each landed

| # | Exercise | Where |
| --- | --- | --- |
| 1 | Aggregate order data in a server component and pass only the summary to the client | `app/dashboard/page.js` calls `summarise()` ([lib/dashboard.js](lib/dashboard.js)); the charts get 4 `{ area, revenue }` and 30 `{ label, orders }` rows. Decoded RSC payload: 31 KB against a 230 KB store, no phone numbers, no dish lines ([DASHBOARD.md](DASHBOARD.md#1--aggregated-on-the-server-summaries-across-the-boundary)) |
| 2 | Revenue bar chart, fixed-height container, ETB ticks | [app/dashboard/RevenueChart.jsx](app/dashboard/RevenueChart.jsx): `.chart__frame` 300 px, `ResponsiveContainer` 100 %, `YAxis tickFormatter={etb} width={92} domain={[0, "auto"]}`, bars largest first and labelled with their value |
| 3 | Orders-per-day line chart, heading naming the range and unit | [app/dashboard/OrdersChart.jsx](app/dashboard/OrdersChart.jsx) under "Orders per day, 3 Oct – 1 Nov 2026" and "Number of orders placed each day (Addis Ababa time)…" — the 30 complete days before today |
| 4 | The same data in a table beneath each chart | [app/dashboard/DataTable.jsx](app/dashboard/DataTable.jsx), a server component fed the same rows: revenue open, the 30 days in a `<details>` |
| 5 | Order table: caption, thead, th scope, right-aligned totals | [components/OrderTable.jsx](components/OrderTable.jsx), used by `/dashboard` (every order) and `/orders` (your own): `<caption>`, `<th scope="col">`, `<th scope="row">`, `.num` + tabular figures, a labelled scroll region on a phone |
| 6 | Sorting through searchParams, aria-sort on the active column | [lib/tableQuery.js](lib/tableQuery.js) + `pageOf()` in [lib/orders.js](lib/orders.js); header links; `aria-sort` on exactly one `<th>` |
| 7 | Paging with Link elements, then write and force the four states | [components/PageLinks.jsx](components/PageLinks.jsx); skeletons ([TableSkeleton](components/TableSkeleton.jsx), [DashboardSkeleton](app/dashboard/DashboardSkeleton.jsx)), empty states in each page, [app/dashboard/error.js](app/dashboard/error.js), [app/orders/error.js](app/orders/error.js); forced with `?state=` ([lib/demoState.js](lib/demoState.js)) |

## The mini-project's requirements

| Requirement | Where it is shown |
| --- | --- |
| Aggregation on the server, only summarised rows crossing | Exercise 1, measured |
| Charts as client leaves on a server page, each with a heading, unit and fixed height | The only two new `"use client"` files besides error boundaries; both frames measured at 300 px |
| Every chart accompanied by the same data in a table | Exercise 4 |
| `table`, `caption`, `thead`, `th scope` — not divs | Exercise 5 |
| Sorting and paging in the URL, paging with `Link` | `/dashboard?sort=total&page=3`; clicking a header then page 3 then Back walks the URLs |
| Loading, empty and error written, each demonstrable | The table under "Forcing the four states"; each was forced on the production build |
| Formatted in ETB, readable without colour | One `etb()` formatter everywhere; one series per chart, values as text on the bars, a dot per day, the page checked in greyscale |
| Who may see it | Staff only, the same three layers as `/kitchen` ([AUTH.md](AUTH.md#day-46-the-dashboard-behind-the-same-three-layers)) |

## Check yourself

| Question | Answer |
| --- | --- |
| Does every bar chart axis start at zero? | Yes: `domain={[0, "auto"]}`; ticks measured `ETB 0 … ETB 80,000`. The line starts at zero too |
| Can you read every chart with the colour removed? | Yes: one series each, so colour keys nothing; bars carry `ETB 74,100` etc. as text and every neighbourhood is named. Screenshot taken with `filter: grayscale(1)` |
| How many rows cross the network for the dashboard? | 4 + 30 summary rows to the charts, plus 20 rendered table rows. Not 425 orders |
| Does the table survive being copied into a spreadsheet? | It is a real `<table>`, so it pastes as rows and columns; totals are text like `ETB 700` (a spreadsheet keeps them as text, not numbers) |
| Can you link someone directly to page three sorted by total? | `/dashboard?sort=total&page=3`, and `/orders?sort=total&page=3` for Almaz's own |
| What does a brand-new customer see on the orders page? | "No orders yet — browse the menu to place your first" and a *Browse the menu* button; no empty table. Checked by signing up a new account |

## Verified

Production build, `next start -p 3046`, headless Chromium (one at a time)
plus raw HTTP; the scripts are outside the repository.

| Check | Result |
| --- | --- |
| `npm run lint` | No warnings, no errors |
| `npm run build` | Passes; `ƒ /dashboard` is new, the rest of the route table is Day 45's |
| Access (signed out / forged cookie / two customers / staff) | `307` / proxy passes, page `307` / `403` and `403` / `200` |
| `/kitchen`, robots.txt, noindex | Unchanged for the kitchen (customer `403`, staff `200`); `Disallow: /dashboard`; `noindex, follow` |
| What crosses | Chart props 4 + 30 rows; RSC payload 31,179 bytes; 0 phone numbers |
| Sorting and paging | `?sort=total&page=3`: 20 rows, `ETB 700 … 590`, page 2 ended at 700; `aria-sort="descending"` on Total only; pager links keep `sort=total`; `dir=asc`, `sort=area`, junk values and `?page=999` all behave |
| Customers' tables | Almaz page 3 by total: 6 rows, all hers; Bereket: 10, one page, no pager; Bereket at one of Almaz's receipts: `404` |
| Charts in the browser | 4 bars, 30 dots, both frames 300 px, no console errors or warnings; no horizontal page scroll at 390 px |
| States, `ADDIS_EATS_DEMO_STATES=1` | Loading: skeleton first, data after ~3 s, on both pages; empty: the two empty states; error: the boundary with a digest (a streamed `200`: the throw happens inside the boundary, after the response has started); customer `?state=empty` on `/dashboard` still `403` |
| States without the variable | `?state=error` ignored: the charts render |
| A real error | `.data/orders.json` made invalid: the dashboard's error state; restored, *Try again* brings the charts back |
| An order placed after the seed | The next id after the last seeded one; "Today so far: 1 order, ETB 480"; it is the only row on today's kitchen board |
| JavaScript per route (gzip) | `/orders` 179 KiB, `/kitchen` 179 KiB, `/dashboard` 287 KiB: Recharts loads on the dashboard only |

## Where the material and the installed versions disagree

| The course says | The installed docs / library | What was done |
| --- | --- | --- |
| `searchParams.sort ?? "date"` (a plain object) | Next.js 16: `searchParams` is a **promise** (`page.md`); synchronous access was a Next 14 shape | `const params = await searchParams` in both pages |
| `app/orders/loading.js` for the skeleton | `loading.md`, "Status codes": a streamed response starts with `200`, so `forbidden()`/`notFound()` after it no longer set the status. Measured: a customer's `/dashboard` became `200` with `loading.js`, `403` without | A `<Suspense>` boundary inside each page, after the session and role check |
| `<ResponsiveContainer>` is how a chart sizes itself | Recharts 3.10 still ships it, and also offers a `responsive` prop on the chart itself as the newer way | Kept `ResponsiveContainer` as taught, inside a 300 px wrapper |
| The chart is readable once you add an axis formatter | Recharts drops X-axis labels it thinks would collide: "Megenagna" silently vanished at 18 px | `interval={0}` and a 13 px tick |
| Accessibility is the table | Recharts 3 also turns on `accessibilityLayer` by default (keyboard focus and arrow keys move the tooltip) and skips animation under `prefers-reduced-motion` | The table is still there; the defaults kept |
| `Intl.NumberFormat("en-ET", …)` prints "ETB 14,200" | True in Node 24 and Chromium, with a no-break space after "ETB" (so "ETB 0" in a test must allow for it) | Used as written, in [lib/formatMoney.js](lib/formatMoney.js) |
| `className="h-10 bg-slate-200 animate-pulse"` | Tailwind classes; this project has no Tailwind | The same skeleton in globals.css, honouring `prefers-reduced-motion` |
| `getOrdersFor(id, { skip, take })` returns `{ rows, total }` | — (no database yet) | `pageOf()` sorts and slices the JSON file in memory, same shape |

## Deviations, honestly

- **Seeded data, not real history.** 425 generated orders from 24 customers
  with no account. Good enough to make the charts and paging meaningful;
  delete `.data/` to reseed relative to today, or the window slowly empties.
- **Today is not in the charts.** By design (a half day reads as a drop);
  it is in the summary line and the table.
- **Not deployed**, as on Day 45, and the JSON store still cannot write on
  Vercel — including the first order read, which writes the seed.
- **The dashboard costs ~108 KiB of gzipped JavaScript** for Recharts. It
  is a staff screen and nothing public loads it; no budget line was set for
  it, so PERF.md is unchanged.

## What changed from Day 45

| File | Change |
| --- | --- |
| `app/dashboard/page.js`, `RevenueChart.jsx`, `OrdersChart.jsx`, `DataTable.jsx`, `DashboardSkeleton.jsx`, `error.js` | New: the dashboard |
| `components/OrderTable.jsx`, `PageLinks.jsx`, `TableSkeleton.jsx` | New: the shared table, pager and skeleton |
| `app/orders/page.js`, `app/orders/error.js` | The list became a sorted, paged table with all four states |
| `app/kitchen/page.js` | Today's orders only; a link to the dashboard |
| `lib/orders.js` | Seeds a missing store; `SORTS`, `pageOf`, `pageOrdersFor`, `listOrdersToday` |
| `lib/seedOrders.js`, `lib/dashboard.js`, `lib/addisDay.js`, `lib/formatMoney.js`, `lib/tableQuery.js`, `lib/demoState.js` | New helpers |
| `lib/formatTime.js` | `formatDateTime()` |
| `proxy.js`, `app/robots.js`, `app/sitemap.js`, `app/login/page.js` | `/dashboard` in the matcher, disallowed, mentioned; the staff link |
| `app/globals.css` | Dashboard, table, pager and skeleton styles; `--chart-1` |
| `.env.example` | `ADDIS_EATS_DEMO_STATES` |
| `package.json` | `recharts` 3.10.1 |
| `DASHBOARD.md` | New |
| `AUTH.md`, `DATA.md`, `BOUNDARY.md`, `PROJECT.md`, `README.md` | Day 46 sections; this file |
