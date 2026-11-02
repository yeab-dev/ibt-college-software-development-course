# The dashboard, the order tables and their four states

Day 46. Until today Addis Eats only *collected* data: a menu, a basket, a
form. Today it shows some back: a staff dashboard with two charts and every
order in a table, and each customer's own orders as a table too. The reading
sheet's question for every screen is "chart or table?" — a chart answers a
question about shape, a table a question about a value — and its answer is
usually "both, the chart above the table".

| Question | Shape or value? | Representation | Where |
| --- | --- | --- | --- |
| Which neighbourhood brings in the most? | Shape: which is largest | Bar chart, largest first, plus its table | `/dashboard`, [RevenueChart.jsx](app/dashboard/RevenueChart.jsx) |
| Are orders growing? | Shape: how it changed | Line chart over 30 days, plus its table | `/dashboard`, [OrdersChart.jsx](app/dashboard/OrdersChart.jsx) |
| What did order 1187 cost, and who placed it? | Value | A row in a sortable, paged table | `/dashboard` (every order), `/orders` (your own) — [OrderTable.jsx](components/OrderTable.jsx) |

No pie chart: there is no "roughly what share?" question here, and four
neighbourhoods compared as angles would be read worse than four bars.

## Where it lives, and who may see it

`/dashboard`, staff only, behind the same three layers as `/kitchen`
([AUTH.md](AUTH.md#day-46-the-dashboard-behind-the-same-three-layers)). It is
revenue across every customer and its table says whose order is whose, so a
customer gets a `403` and a signed-out visitor a `307` to sign in. The
links to it are on `/kitchen`, `/orders` and `/login`, shown to staff only —
the interface half; the page's role check is the half that holds.

## 1 · Aggregated on the server, summaries across the boundary

The page is a server component. It reads the order file (425 orders on a
fresh clone, 230 KB, each with a name, a phone number and its dishes) and
[lib/dashboard.js](lib/dashboard.js) adds it up:

```js
const { range, byArea, byDay, totals, today } = summarise(orders);
const revenueRows = byArea.map(({ area, revenue }) => ({ area, revenue })); // 4 rows
const orderRows = byDay.map(({ label, orders }) => ({ label, orders }));    // 30 rows
<RevenueChart data={revenueRows} … />   // client leaf
<OrdersChart data={orderRows} … />      // client leaf
```

Measured on the production build (the RSC payload is inlined in the HTML as
`self.__next_f.push` chunks; decoded and searched):

| | Size |
| --- | --- |
| The order store, `.data/orders.json` | 425 orders, 229,551 bytes |
| What the bar chart is given | `[{"area":"Bole","revenue":74100},{"area":"Megenagna","revenue":34250},{"area":"Kazanchis","revenue":16900},{"area":"Piassa","revenue":16680}]` — 4 rows |
| What the line chart is given | 30 `{ label, orders }` rows |
| The whole RSC payload of `/dashboard` | 31,179 bytes (it also carries the rendered table: 20 rows as elements, plus the two chart tables) |
| Phone numbers in the payload / in the HTML | 0 / 0 |
| `"lines"` arrays (an order's dishes) in the payload | 0 |

So the answer to the sheet's "three rows or four thousand?" is four and
thirty. Every value is a string or a number, which is all that can cross.
Days are keys like `"2026-10-03"` computed in Addis Ababa's time zone
([lib/addisDay.js](lib/addisDay.js)), never `Date` objects or a `Map`.

The range is **the 30 complete days before today**. Today is left out of
the charts because a half-finished day at the right-hand end reads as a
drop; it gets its own line in the summary ("Today so far: 1 order, ETB 480"),
and the table has every order including today's.

Cancelled orders are not revenue and are not counted as orders; both chart
subheadings say so.

## 2–4 · The charts, honest and readable

Recharts 3.10 (the deck's library). Both charts are client leaves —
Recharts measures its container and is built from hooks — on a server page.
They are the only chart code in the app, and only `/dashboard` loads it:

| Route | Scripts | JavaScript (gzip) |
| --- | --- | --- |
| `/orders` | 11 | 179 KiB |
| `/kitchen` | 10 | 179 KiB |
| `/dashboard` | 13 | 287 KiB (Recharts ≈ +108 KiB) |

A staff screen that is opened on purpose can afford that. A public page
could not, and none imports it.

| Sheet's rule | How it is met |
| --- | --- |
| Fixed-height container | `.chart__frame { height: 300px }` in globals.css; `ResponsiveContainer` is `100%` of that. Measured: both frames 300 px. The space is reserved before the chart draws, so nothing moves |
| ETB tick formatting, one formatter | [lib/formatMoney.js](lib/formatMoney.js) `etb()` — `Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 0 })` — on the Y axis, the tooltip, the bar labels and every table total. Y axis `width={92}` so "ETB 80,000" is not clipped |
| A bar axis starts at zero | `domain={[0, "auto"]}`; measured ticks `ETB 0 … ETB 80,000` |
| A heading naming the range and the unit | "Revenue by neighbourhood, 3 Oct – 1 Nov 2026" + "In Ethiopian birr (ETB)…"; "Orders per day, 3 Oct – 1 Nov 2026" + "Number of orders placed each day (Addis Ababa time)…" |
| Readable without colour | One series per chart, so colour is not a key to anything. Every bar carries its value as text (`<LabelList>`), every day is a dot on the line, and every neighbourhood is named under its bar (`interval={0}`: Recharts had silently dropped "Megenagna" as overlapping). Checked with the page in greyscale |
| The same data in a table beneath | [DataTable.jsx](app/dashboard/DataTable.jsx), a server component given the same summarised rows. The revenue table is open; the 30-row daily table is in a `<details>` (in the HTML either way, so copy, print and find-in-page work) |
| Brand palette | `--chart-1`, defined with the other colour tokens and redefined for dark mode; the SVG reads `fill="var(--chart-1)"` |
| Motion | Recharts 3's default `isAnimationActive: "auto"` skips animation for `prefers-reduced-motion` |

The line chart's axis also starts at zero. A line *may* start elsewhere, but
the question is "are orders growing?", and an axis starting at 9 would make
ten orders a day look like a boom.

## 5 · The order table: real markup

[components/OrderTable.jsx](components/OrderTable.jsx), a server component
used by both pages. It ships no JavaScript.

- `<table>`, `<caption>` (names the table and says how it is sorted and
  which page: "Every order, largest total first — page 3 of 22"),
  `<thead>`, `<th scope="col">` on every header, `<th scope="row">` on the
  order number.
- Columns: Order, Placed, (Customer, staff only — first name, as on the
  kitchen board), Neighbourhood, Status, Total. Six at most.
- Totals right-aligned (`.num`), with `font-variant-numeric: tabular-nums`
  on the whole table so digits line up.
- Status is a word ("Delivered", "Cancelled"), never only a colour.
- On a phone it scrolls sideways inside a labelled, focusable region
  (`role="region" aria-labelledby=<caption>`), and the page itself does not
  (measured: `scrollWidth − innerWidth = 0` at 390 px). Getting that to 0
  needed `position: relative` on the scroll box: the visually-hidden text in
  the headers is absolutely positioned, and without a containing block it
  escaped the scroll box and widened the page by 156 px.

## 6 · Sorting in the URL, with aria-sort

```
/dashboard?sort=total            largest first
/dashboard?sort=total&dir=asc    smallest first
/dashboard?sort=area             neighbourhood A–Z
/orders?sort=total&page=3        Almaz's third page, by total
```

- [lib/tableQuery.js](lib/tableQuery.js) reads the query (`readTableQuery`)
  and writes it (`tableHref`). An unknown column, a bad direction or a
  negative page falls back to the default rather than throwing; defaults are
  left out of the address, so one state has one URL.
- [lib/orders.js](lib/orders.js) `pageOf(orders, { sort, dir, page })` is the
  sheet's `getOrdersFor(id, { sort, dir, skip, take })`: a sort, ties broken
  by date and id so a row never appears on two pages, then a slice of 20.
  `pageOrdersFor(user.id, query)` scopes it to the session first.
- Each sortable header is a `<Link>`: the active one reverses, another
  starts in its natural direction (newest, largest, A–Z), and both go back
  to page 1.
- `aria-sort="ascending|descending"` is on the active column's `<th>` and on
  no other. The arrow beside it is `aria-hidden`; the link also says what it
  will do ("Total, sort smallest total first") in visually-hidden text.

## 7 · Paging with links, and the four states

[components/PageLinks.jsx](components/PageLinks.jsx): Previous, the first
and last page, two either side of the current one, Next — each a real
`<Link>` to a real URL that keeps the sort. Back returns to the previous
page; middle-click opens one in a new tab. `?page=999` is clamped to the
last page. Day 41's menu pager stays as it was: it pages a client query, a
different job.

| State | What it shows | Where | Forced with |
| --- | --- | --- | --- |
| Loading | A skeleton the shape of the content: a caption bar, a header row and five rows; on the dashboard two 300 px chart blocks above them. `role="status"`, "Loading the dashboard…" | `<Suspense>` in each page, *after* the session check ([TableSkeleton.jsx](components/TableSkeleton.jsx), [DashboardSkeleton.jsx](app/dashboard/DashboardSkeleton.jsx)) | `?state=loading` (a 3 s wait) |
| Empty | Why it is empty and what to do next. `/orders`: "No orders yet — browse the menu to place your first" with a *Browse the menu* button. `/dashboard`: "No orders yet. The charts and the table fill in as soon as the first order is placed" with links to the kitchen board and the menu. Never an empty table with headers | the data components | `?state=empty`, or for real: sign up a new account and open `/orders` |
| Error | What failed, a reference (the digest), *Try again* (`retry()`), and a way out. A streamed `200`: the throw is inside the Suspense boundary, after the response started — fine for a failed read, unlike an access check | [app/dashboard/error.js](app/dashboard/error.js), [app/orders/error.js](app/orders/error.js) | `?state=error`, or for real: make `.data/orders.json` invalid JSON |
| Populated | The data, formatted: ETB, Addis dates, words for status | — | the default |

**The switch is not a backdoor** ([lib/demoState.js](lib/demoState.js)).
`?state=` works in `npm run dev`, or on a server started with
`ADDIS_EATS_DEMO_STATES=1` (server-only, read per request). Anywhere else it
is ignored — checked: `/dashboard?state=error` on the plain production
server renders the charts. It is read only after the session and role
checks, so it changes how an allowed page looks and nothing else — checked:
a customer's `/dashboard?state=empty` is still `403`.

### Why `<Suspense>` in the page and not the course's `loading.js`

`loading.js` wraps the whole page in a Suspense boundary, so the response
starts streaming — with a `200` — before the page's own checks run. Next.js
16's docs say it plainly (`loading.md`, "Status codes": "Streaming page
responses begin with a 200 status code… Run the corresponding check before
the response body streams to return a 404, 403, or 401 status"). It was
tried: with an `app/dashboard/loading.js` in place, a customer's
`/dashboard` answered **`200`** with the Staff-only page streamed into it
(and a `noindex` tag); without it, **`403`**. An `app/orders/loading.js`
would do the same to every receipt below it, turning a stranger's `404`
into a `200`. So each page awaits `getSession()` and the role first, then
renders the skeleton boundary around the data only.

## Seed data

The store used to start empty. A chart of three test orders shows no shape,
so [lib/seedOrders.js](lib/seedOrders.js) writes a month of history the first
time the store is read with no file ([DATA.md](DATA.md#day-46-a-month-of-seeded-orders)):
425 orders over the 30 days before the day it is seeded, a seeded
generator (mulberry32, seed 46), so every clone gets the same orders with
the same ids. Almaz has 46 of them (three pages of `/orders`), Bereket 10
(one page), the rest belong to 24 seeded customers with no account and
`0900…` numbers. The demo accounts and passwords are unchanged. Delete
`.data/` to reseed relative to today.
