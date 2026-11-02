# Addis Eats — Day 47: maps, real-time and data formats

Week 10, day 2. The receipt becomes a **tracking page**: a Leaflet map with
the courier and the delivery point, the same information in words beside
it, and a live status pushed over **server-sent events** — seeded from the
server render, closed when you leave and closed on purpose when the order is
delivered, with a visible connection indicator. Every price and time in the
app now goes through **one formatting module**, `lib/format.js`. And the
order history can leave the app as a **CSV file** that survives commas,
quotation marks and newlines.

- [TRACKING.md](TRACKING.md) is new today: the map and why it loads with
  `ssr: false` from a client component, the simulated courier, the stream's
  framing and lifecycle, whether it replaces the poll (yes, with the poll
  kept as the fallback), serverless duration limits, `lib/format.js`, and the
  CSV with its awkward-value test.
- [AUTH.md](AUTH.md) gains "the stream and the export, behind the same
  checks": the stream makes exactly `GET /api/orders/[id]`'s checks, then
  re-checks the session every tick; tested signed out, as the owner, as
  another customer, and with a session signed out mid-stream.
- [DATA.md](DATA.md) gains "the receipt's order, pushed instead of polled".
- [BOUNDARY.md](BOUNDARY.md) gains the four tracking client components.
- [STRATEGY.md](STRATEGY.md) gains the two endpoints (no page changed its
  marker). [PROJECT.md](PROJECT.md) gains their rows.
- [PERF.md](PERF.md), [SEO.md](SEO.md) and [DASHBOARD.md](DASHBOARD.md) are
  Day 46's, unchanged (the map's cost is in TRACKING.md; prices on the
  dashboard now read the shared module).

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
(staff). Accounts, sessions and orders are written to `.data/` (git-ignored);
the first read seeds 425 orders over the 30 days before today. Delete the
folder to start again from the seed.

**To watch a delivery:** sign in as Almaz, add something to the cart and
check out. The receipt shows *In the kitchen · live*, the map and the facts.
After 2 minutes the courier sets off from Meskel Square and moves every 3
seconds; at 5 minutes the order is delivered, the indicator says *updates
finished*, and the connection is closed. The map needs the internet (its
tiles come from OpenStreetMap); everything else, including the facts in
words, works without it.

**To see the raw stream** (the session cookie from the browser's devtools):

```bash
curl -N -H "Cookie: addis-eats-session=…" http://localhost:3000/api/orders/1426/stream
```

**To download the history:** *Download your orders (CSV)* under the table
on `/orders`; staff also get *Download every order (CSV)* on `/dashboard`.

The Day 46 demo states still work (`ADDIS_EATS_DEMO_STATES=1 npm run start`,
then `?state=loading|empty|error` on `/orders` and `/dashboard`).

## Deploying to Vercel

Not done yet: deploying is the student's step (Day 48). Day 45's checklist
holds with the Day 47 folder: set **Root Directory** to
`M03-react-nextjs/day47/addis-eats`, and the same three environment
variables (`SESSION_SECRET` different per environment, `NEXT_PUBLIC_SITE_URL`
before the first build, `NEXT_PUBLIC_ANALYTICS_SRC` empty). Leave
`ADDIS_EATS_DEMO_STATES` unset.

**The storage problem is unchanged:** accounts, sessions and orders are JSON
files in `.data/`, and Vercel's functions have a read-only filesystem, so
signing in, placing an order — and therefore the whole tracking page — fail
there with a `500`. The public pages, the proxy's redirects and every
handler's `401` work. Show the signed-in walkthrough on `npm run build && npm
run start`. The fix is a hosted database (Module 4).

**Two Day 47 notes for a serverless host:**

- **A server-sent-events stream is a function that keeps running.** On
  Vercel every function has a maximum duration (set by the plan and by a
  route's `maxDuration`), the open stream counts against it the whole time,
  and it is billed for that time. The stream handler exports
  `maxDuration = 300` (a delivery takes 5 minutes) and closes itself at
  270 s without an `end` event, so the browser reconnects cleanly instead of
  being cut off. Check the plan's current limits before relying on long
  streams. WebSockets are not possible on serverless functions at all.
- **The map's tiles come from OpenStreetMap's public tile server**, which is
  for light use. Fine for a course demo; a real deployment would use a tile
  provider with an agreement (and a key), and keep the attribution.

After each deployment, Day 45's checks still apply (from the deployed URL):

```bash
URL=https://addis-eats.vercel.app      # your production URL
curl -sI $URL/checkout | grep -i 'location\|x-addis-eats-proxy'   # 307 → /login?next=%2Fcheckout
curl -s -o /dev/null -w '%{http_code}\n' $URL/api/orders/1001          # 401
curl -s -o /dev/null -w '%{http_code}\n' $URL/api/orders/1001/stream   # 401, JSON, not a stream
curl -s -o /dev/null -w '%{http_code}\n' $URL/api/orders/export        # 401
curl -s $URL/menu/kitfo | grep -o '<meta property="og:image" content="[^"]*"'   # https://…, not localhost
```

## The seven exercises, and where each landed

| # | Exercise | Where |
| --- | --- | --- |
| 1 | The map as a dynamic client component with `ssr: false` and a sized placeholder | [app/orders/[id]/MapPanel.jsx](app/orders/[id]/MapPanel.jsx) (`"use client"`, `dynamic(() => import("./DeliveryMap"), { ssr: false, loading })`) → [DeliveryMap.jsx](app/orders/[id]/DeliveryMap.jsx): `import "leaflet/dist/leaflet.css"`, `.delivery-map { height: 320px }` on the map **and** the placeholder, the OpenStreetMap attribution. CLS 0 ([TRACKING.md §1](TRACKING.md#1--the-map-in-the-browser-only)) |
| 2 | A courier and a delivery marker, the view fitted to both, the same in text | Two `L.divIcon` pins (*Courier*, *You*) and the dashed line still to travel; `bounds={[courier, drop]}` once at creation; positions simulated deterministically in [lib/delivery.js](lib/delivery.js) (Meskel Square → a landmark in the order's neighbourhood); the words in [DeliveryFacts.jsx](app/orders/[id]/DeliveryFacts.jsx) beside the map ([§2](TRACKING.md#2--two-markers-fitted-and-the-same-in-words)) |
| 3 | A stream route handler with correct SSE framing | [app/api/orders/[id]/stream/route.js](app/api/orders/[id]/stream/route.js): `retry: 3000\n\n`, then `data: {order}\n\n` (checked byte by byte with `od -c`), `event: end` on delivery; the same checks as `GET /api/orders/[id]` ([§3](TRACKING.md#3--the-stream-get-apiordersidstream)) |
| 4 | EventSource, seeded from the server, closed on unmount | [useOrderStream.js](app/orders/[id]/useOrderStream.js): frames go into the Day 41 SWR entry whose `fallbackData` is the server render; `return () => source.close()`. Five navigations away: 5 opened, 5 closed, 0 open ([§4](TRACKING.md#4--consuming-it-eventsource-seeded-closed-on-unmount)) |
| 5 | A connection indicator; the stream closed deliberately on delivery | [OrderStatus.jsx](app/orders/[id]/OrderStatus.jsx): *connecting… / live / reconnecting… / checking every few seconds / updates finished*, a word and a dot. On delivery the server sends `end` and closes, the client closes too; nothing reconnects ([§5](TRACKING.md#5--the-indicator-and-closing-on-delivery)) |
| 6 | `lib/format.js` with `etb`, `when` and `relative`, used everywhere | [lib/format.js](lib/format.js) (+ `clock`, `day`, `stamp`), each `Intl` formatter built once; `lib/formatMoney.js` and `lib/formatTime.js` deleted; every hand-written `{price} ETB` replaced ([§6](TRACKING.md#6--libformatjs)) |
| 7 | A CSV export, tested with awkward values | [lib/csv.js](lib/csv.js) + [app/api/orders/export/route.js](app/api/orders/export/route.js), linked from `/orders` and `/dashboard`; a name with a comma and quotes and a note with newlines and a formula round-tripped through Python's `csv` and LibreOffice ([§7](TRACKING.md#7--the-csv-export)) |

## The mini-project's requirements

| Requirement | Where it is shown |
| --- | --- |
| The map loaded with `ssr: false`, stylesheet imported, explicit height, attribution kept | Exercise 1. Leaflet's CSS applied (`.leaflet-pane` is `position: absolute`); map 322 px = placeholder 322 px; attribution "Leaflet \| © OpenStreetMap contributors" |
| The same delivery information available as text beside the map | `DeliveryFacts`: who, where (*Piassa — around St George's Cathedral*), the courier and distance, the arrival time, when placed. In the server HTML; at 390 px it stacks under the map |
| A stream route handler using `"data: "` and two newlines | Exercise 3 |
| An EventSource seeded from server data, closed on unmount, with a visible state | Exercises 4 and 5 |
| `lib/format.js` exporting `etb`, `when` and `relative`, each built once | Exercise 6 |
| CSV export that correctly quotes commas, quotes and newlines | Exercise 7 |

## Check yourself

| Question | Answer |
| --- | --- |
| Does the build succeed, and does the page avoid jumping when the map appears? | Yes. `next build` passes; CLS **0** from first paint through the map's arrival and the live frames; across a whole five-minute delivery **0.003**, from the status text and the facts changing length (the map stays put). The facts column stayed at the same position before and after the map loaded |
| Navigate away from the tracking page five times — how many connections are open? | **0.** The server's log counted 5 opened and 5 closed (`client went away`), and 1 open while each receipt was showing |
| Is every price and time going through the shared format module? | Yes. `grep -rn "Intl\." app components lib cart` finds only `lib/format.js` and `addisDay.js`'s day-*key* formatter (an identifier, not display text); no `{…} ETB` is left in a template |
| Does the CSV survive a value containing a comma and a quotation mark? | Yes, and a newline, a CRLF and a formula: 49 rows, every one 9 columns, values identical after a round trip |
| Can someone who cannot see the map still find where their order is? | Yes: the facts beside the map, in the HTML before JavaScript, and on receipts with no map; the map's container is labelled to say so; the stage is announced by the status line |

## Verified

Production build, `next start -p 3047`, curl and headless Chromium (one at a
time, closed after each run); the scripts are outside the repository. Tile
requests were aborted in every automated run after the first, to keep load
off OpenStreetMap's server.

| Check | Result |
| --- | --- |
| `npm run lint` | No warnings, no errors |
| `npm run build` | Passes; `ƒ /api/orders/[id]/stream` and `ƒ /api/orders/export` are new, every page keeps its Day 46 marker |
| Stream: signed out / another customer / no such order / owner | `401` JSON / `403` JSON / `404` JSON / `200 text/event-stream` |
| Stream framing (`curl -N … \| od -c`) | `retry: 3000\n\n`, then `data: {…}\n\n`; on the way, frames 3 s apart with the courier moving (9.01112 → 9.01155 → 9.01198 → 9.0124, 3.1 → 2.9 km) |
| Session signed out mid-stream | Stream ended 1,994 ms later (`session no longer valid`); reconnect `401` |
| Navigate away five times | `open while on receipt 1, after leaving 0` × 5; opened 5, closed 5, open now 0 |
| Delivery, watched in the browser | Order 9003 watched for 5 minutes: *live* throughout, the distance falling 0.1 km per frame to *almost at your door*, then *Delivered · updates finished* at 13:36:20 (placed 13:31:18); server log `closed (delivered); 0 open`; nothing reconnected in the next 10 s; the map stayed; CLS over the whole delivery 0.003 (text changing length, not the map) |
| Stream refused (`503`, forced in the browser) | Indicator *checking every few seconds*; 3 polls of `GET /api/orders/[id]` in 16 s |
| JavaScript off | The placeholder (322 px), the facts and the stage in the HTML |
| Console | No errors or warnings on the receipt (the only ones in other runs were the deliberately aborted tiles and the forced `503`) |
| Map chunk | 44.7 KB gzipped JS + 2.7 KB CSS, referenced by neither `/menu` nor a delivered receipt; 6 tiles for one view |
| CSV access | Signed out `401`; Almaz 47 rows, all hers; Bereket 10, all his; `?scope=all` customer `403`, staff `200` (426 rows); `?scope=everyone` `400`; `Content-Disposition: attachment; filename="addis-eats-my-orders-2026-11-02.csv"` |
| CSV awkward values | Temporary orders with `Almaz "Bole, Kitfo" Bekele`, a note with a comma, quotes, `\n` and `\r\n`, and `=HYPERLINK(…)`: Python `csv` 49 × 9, values identical; LibreOffice 9 columns, numbers as numbers, the formula as text. Removed afterwards |
| Prices and times | `/menu` "ETB 240", dish page and its description "ETB 260", kitchen "ETB 360" and "16:32", tables "2 Nov 2026, 16:31"; preview images `200` |
| Receipt access unchanged | Bereket at Almaz's receipt `404`, its API `403`; signed out `307` |

## Where the material and the installed versions disagree

| The course says | The installed docs / library | What was done |
| --- | --- | --- |
| `dynamic(() => import("./DeliveryMap"), { ssr: false })` — placed in `app/track/MapPanel.jsx` | Agrees, and the installed `lazy-loading.md` is explicit why it must be a client file: "`ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a Client Component." Writing it in the (server) page fails | `MapPanel.jsx` is `"use client"`; the page renders it |
| A new route, `app/track/[id]` | — | The receipt `/orders/[id]` already had the owner check, the proxy, `noindex` and the seeded client query, so the tracking page is the receipt |
| `url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"` | OpenStreetMap's tile usage policy now asks for the single host without `{s}` subdomains | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `<Marker position={BOLE}>` with Leaflet's default pin | Leaflet's default icon finds its PNGs from a path it reads out of its own CSS, which a bundler rewrites — a long-standing source of broken pins with webpack-style builds (avoided here, so not tested with Turbopack) | `L.divIcon` pins with a word on each — no images, and not colour-only |
| `es.onerror = () => es.close()` | MDN / the HTML spec: EventSource reconnects by itself after a dropped connection; closing on the first error disables that. The slides' own next table says "SSE reconnects; show the state" | Errors show *reconnecting…*; only a refused stream or three failures in a row fall back to polling |
| Stream example: `send(await getStatus(params.id))` | Next.js 16: `params` is a promise (`route.md`) | `const { id } = await params` |
| The stream example only sends | A stream needs to stop: `ReadableStream`'s `cancel()` is called when the browser goes away, or the interval runs forever | `cancel()` and `request.signal` both call one `stop()`; verified by the open-stream count |
| `new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "short", … })` prints "14 Jul 2026, 18:40" | Neither Node 24 nor Chromium 153 has `en-ET` data; both resolve it to `en` and print **"Nov 2, 2026, 6:40 PM"** | Dates use `en-GB` ("2 Nov 2026, 18:40"); money keeps `en-ET` (it prints `ETB 14,200` either way) |
| `export const etb = new Intl.NumberFormat(…)`, called as `etb.format(…)` | — | Exported as functions wrapping module-level formatters, so `etb` can be a Recharts `tickFormatter` and `when` takes ISO strings |
| CSV: quote when `/[",\n]/` matches | RFC 4180 and Excel also treat `\r` as a line break; OWASP: cells starting `= + - @` run as formulas | `/[",\r\n]/`, a leading `'` on formula-like text, CRLF rows and a UTF-8 BOM |
| CSV via a Blob and `URL.createObjectURL` in the browser | Right for data already on screen; the full history is not on screen (20 rows per page) and must be scoped by the session | A route handler with `Content-Disposition: attachment`, linked with `<a download>` |
| "Serverless hosting will not hold a socket open" (about WebSockets) | It also limits SSE: a function's maximum duration (`maxDuration.md`) caps how long a stream stays open | `maxDuration = 300`, self-close at 270 s, the browser reconnects |
| `Component.propTypes` | React 19 ignores them (CLAUDE.md) | Kept as documentation on the new components, as in the rest of the project |

## Deviations, honestly

- **The courier is simulated.** No courier app reports a position; it is
  computed from the order's time (straight line, constant speed, Meskel
  Square to a landmark in the neighbourhood). The coordinates are real
  places in Addis, approximately; the delivery point is not an address.
- **The time cap was not exercised.** A delivery ends in 5 minutes, before
  the 270 s cap can matter on a fresh connection; the cap uses the same
  `stop()` path as the session check, which was tested.
- **The stream polls the file on the server.** Each open stream reads the
  order and the session every 3 s. That is fine for a handful of viewers; a
  real system would push from the place the change happens (a database
  notification or a queue) instead of each connection asking.
- **Not deployed**, as on Days 45–46: the JSON store cannot write on Vercel.
- **Prices now read "ETB 260" everywhere**, where pages used to print
  "260 ETB". That is the point of one module, and it matches the dashboard.

## What changed from Day 46

| File | Change |
| --- | --- |
| `app/orders/[id]/MapPanel.jsx`, `DeliveryMap.jsx`, `DeliveryFacts.jsx`, `Tracking.jsx`, `useOrderStream.js` | New: the map, the facts and the stream on the receipt |
| `app/orders/[id]/OrderStatus.jsx`, `useOrder.js`, `page.js` | The stream and its indicator; the poll only as the fallback; the tracking section; prices and times through `lib/format.js` |
| `app/api/orders/[id]/stream/route.js` | New: the stream |
| `app/api/orders/export/route.js`, `lib/csv.js` | New: the CSV export |
| `lib/delivery.js` | New: the simulated courier and delivery point |
| `lib/format.js` | New: every formatter. Replaces `lib/formatMoney.js` and `lib/formatTime.js` (deleted) |
| `lib/orders.js` | `orderView()` includes `tracking` |
| `lib/session.js` | `sessionFromCookie()`, the uncached half of `getSession()`, for the stream's re-check |
| `lib/addisDay.js` | Day labels come from `lib/format.js` |
| `app/orders/page.js`, `app/dashboard/page.js` | The CSV links |
| `app/kitchen/page.js`, `components/OrderTable.jsx`, `app/dashboard/RevenueChart.jsx`, `app/cart/CartContents.jsx`, `app/checkout/Checkout.jsx`, `app/menu/Dish.jsx`, `app/menu/[id]/page.js`, `app/menu/[id]/opengraph-image.js`, `app/menu/opengraph-image.js`, `app/page.js` | Prices and times through `lib/format.js` |
| `app/globals.css` | The tracking grid, the map's height, the pins, the facts, the indicator |
| `package.json` | `leaflet` 1.9.4, `react-leaflet` 5.0.0 |
| `TRACKING.md` | New |
| `AUTH.md`, `DATA.md`, `BOUNDARY.md`, `STRATEGY.md`, `PROJECT.md`, `README.md` | Day 47 sections; this file |
