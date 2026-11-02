# Tracking a delivery: the map, the live connection, the formats

Day 47. Three things a delivery app needs and a dashboard does not: a map
showing where the order is, a connection that keeps the screen current, and
formatting that writes ETB and Addis Ababa's time correctly. Then the
fourth: the order history leaving the app as a file someone opens in a
spreadsheet.

| Exercise | Where |
| --- | --- |
| 1 · The map, a dynamic client component with `ssr: false` and a sized placeholder | [MapPanel.jsx](app/orders/[id]/MapPanel.jsx) → [DeliveryMap.jsx](app/orders/[id]/DeliveryMap.jsx) |
| 2 · A courier and a delivery marker, the view fitted to both, the same in words | `DeliveryMap.jsx`, positions from [lib/delivery.js](lib/delivery.js), words in [DeliveryFacts.jsx](app/orders/[id]/DeliveryFacts.jsx) |
| 3 · A stream route handler with correct SSE framing | [app/api/orders/[id]/stream/route.js](app/api/orders/[id]/stream/route.js) |
| 4 · EventSource, seeded from the server render, closed on unmount | [useOrderStream.js](app/orders/[id]/useOrderStream.js), feeding the Day 41 query ([useOrder.js](app/orders/[id]/useOrder.js)) |
| 5 · A connection indicator; the stream closed deliberately on delivery | [OrderStatus.jsx](app/orders/[id]/OrderStatus.jsx); the `end` event |
| 6 · `lib/format.js`: `etb`, `when`, `relative`, each formatter built once, used everywhere | [lib/format.js](lib/format.js); `lib/formatMoney.js` and `lib/formatTime.js` are gone |
| 7 · A CSV export that survives awkward values | [lib/csv.js](lib/csv.js), [app/api/orders/export/route.js](app/api/orders/export/route.js) |

## Where it lives: the receipt is the tracking page

The slides build a new `app/track/[id]`. Addis Eats already had a page that
is exactly that: `/orders/[id]`, the receipt, which since Day 41 renders the
order on the server, hands it to the client as its first value and keeps it
current. It is behind the proxy's matcher, scoped to the owner
(`getOrderFor(user.id, id)`, someone else's id is a `404`), `noindex` and
disallowed. A second route would have needed every one of those again, so
the map and the live connection were added to the receipt.

```
/orders/1426  (server component, ƒ)
├─ OrderStatus      client  the stage + the connection indicator; opens the EventSource
├─ Tracking        client  <section> "Where your order is"; decides once whether there is a map
│  ├─ MapPanel      client  dynamic(() => import("./DeliveryMap"), { ssr: false })
│  │  └─ DeliveryMap        Leaflet, loaded in the browser only
│  └─ DeliveryFacts client  the same information, in words
├─ the TeleBirr line, the dishes          (server)
└─ CancelOrderButton client (Day 39)
```

All the client leaves read one query, `useOrder(id, initial)`, keyed
`/api/orders/1426`. The stream writes each frame into it; nothing else on
the page knows a stream exists.

## 1 · The map, in the browser only

Leaflet reads `window` the moment it is imported. Every client component is
still rendered once on the server for the HTML, so an ordinary import
anywhere in the receipt's tree crashes that render. `next/dynamic` with
`ssr: false` makes the server render the `loading` element instead, and the
browser fetches the map's chunk after hydration.

**`ssr: false` is only allowed in a client component.** The installed docs
(`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`, "Skipping
SSR"): *"`ssr: false` is not allowed with `next/dynamic` in Server
Components. Please move it into a Client Component."* The receipt page is a
server component, so the call lives in `MapPanel.jsx` (`"use client"`), as
the slides' `app/track/MapPanel.jsx` does. The page renders `<MapPanel>`.

The deck's three things people forget, all in `DeliveryMap.jsx`:

| | How | Checked |
| --- | --- | --- |
| The stylesheet | `import "leaflet/dist/leaflet.css"` in `DeliveryMap.jsx`. It is bundled with the map's chunk, so it loads only with the map | `.leaflet-pane` computes `position: absolute` (Leaflet's CSS applied); the CSS file is in neither `/menu`'s HTML nor the receipt's, it arrives with the chunk |
| An explicit height | `.delivery-map { height: 320px }` (globals.css), on the map *and* on the placeholder | Map box 322 px tall (320 + border); the placeholder has the same class |
| The attribution | `TileLayer attribution="© OpenStreetMap contributors"` with a link to the copyright page; Leaflet adds its own | The control reads " Leaflet \| © OpenStreetMap contributors" |

**No layout jump.** The placeholder (`Loading the map…`) is the same
element class as the map, so it holds exactly the map's space. Measured in
headless Chromium with a `PerformanceObserver` on `layout-shift`, from
before the first paint until the map, its markers and the live frames had
arrived: **CLS 0, no shift entries**, and the facts column's box was at
the same `y` (403.75) before and after the map appeared.

**What it costs.** The map chunk is 154.5 KB raw, **44.7 KB gzipped**
(Leaflet and react-leaflet; the deck says "about 40 kB"), plus 2.7 KB of
CSS. It is fetched only by a receipt that draws a map: `/menu` and a
delivered order's receipt reference neither file.

**Light on OpenStreetMap's tile server.** Its tiles are free for light use,
and its usage policy is not written for production traffic. So: a map is
drawn only for an order still on its way (a delivered or cancelled receipt
gets the facts in words and no map: none of the 425 seeded receipts loads a
tile), the scroll wheel does not zoom (the page scrolls; no accidental
zooming through tile levels), the view is fitted once, and the URL is the
single `tile.openstreetmap.org` host. One receipt view fetched **6 tiles**.
The automated checks below aborted tile requests after the first view.

## 2 · Two markers, fitted, and the same in words

There are no couriers with phones, so the position is simulated —
deterministically, like the stage since Day 40 ([lib/delivery.js](lib/delivery.js)):

| Stage (lib/orderStage.js) | Courier |
| --- | --- |
| In the kitchen (0–120 s) | At the kitchen, Meskel Square (9.0105, 38.7614) |
| On the way (120–300 s) | On the straight line from the kitchen to the delivery point, moved evenly over the 180 s |
| Delivered (300 s on) | At the delivery point |
| Cancelled | None |

The delivery point is a real landmark in the order's neighbourhood (Edna
Mall in Bole, the ECA in Kazanchis, Megenagna Square, St George's Cathedral
in Piassa), moved up to ~400 m in a direction taken from a hash of the
order id. The checkout only asks for a neighbourhood, so it is "around Edna
Mall", never a street. The same order at the same instant is in the same
place in the HTML, in a poll and in every frame.

Leaflet takes `[lat, lng]` and GeoJSON `[lng, lat]`. Every point in the code
is an object with named `lat` and `lng`; `toLatLng()` in `DeliveryMap.jsx`
is the one place it becomes an array.

**Fitted to both.** `MapContainer bounds={[courier, drop]}` with 40 px of
padding, computed once when the map is created. It is never refitted: the
courier only moves along the line between those two points, so the rest of
the trip stays inside the first view, and someone who has panned the map is
not yanked back every three seconds.

**Pins.** `L.divIcon` pins with a word on each (*Courier*, *You*), so they
are told apart by what they say and not only by colour, and no image file is
involved (Leaflet's default PNG pin is a well-known casualty of bundlers).
The dashed line is what is still to travel, and dashed because it is not a
road.

**In words, beside the map** (`DeliveryFacts.jsx`, a `<dl>`): who it is for
and the area with its landmark; the courier and how far away
(*Abel is on the way: 1.4 km from you.*); the estimated arrival as a clock
time and a relative one (*16:29 (in 4 minutes)*); when it was placed. It is
in the server's HTML (checked: the `<dl>` is there before any JavaScript),
updates with each frame, and also stands alone on a receipt with no map. It
is deliberately not an `aria-live` region: the distance changes every three
seconds. The stage change is announced once, by the status line
(`role="status"`). The map's container is labelled for a screen reader as
*"Map of the delivery to Piassa. The same information is given in words
beside the map."*

At 390 px the map stacks above the facts; no horizontal scroll.

## 3 · The stream: `GET /api/orders/[id]/stream`

A route handler returning a `ReadableStream` with
`Content-Type: text/event-stream`: the Day 39 handler, returning a stream
instead of a body. Ordinary HTTP.

**Framing.** Each message is `data: ` + JSON + a blank line. The raw bytes
of the start of a stream (`curl -N … | od -c`):

```
r e t r y :   3 0 0 0 \n \n d a t a :   { " i d " : " 1 4 2 6 " , …
… " a t " : " 2 0 2 6 - 1 1 - 0 2 T 1 3 : 2 5 : 3 1 . 6 5 8 Z " } } \n \n
```

| Frame | When | Why |
| --- | --- | --- |
| `retry: 3000` | Once, first | The browser's reconnect delay after a drop |
| `data: {…order…}` | At once; then when anything but the clock changed (every 3 s while the courier moves); otherwise every 15 s | Every frame is the **whole order** — `orderView()`, the same object as the server render and `GET /api/orders/[id]`. A reconnect's first frame is the current state, so no `Last-Event-ID` or replay is needed: "resync on reconnect" for free. The 15 s refresh keeps "placed 2 minutes ago" current and an idle line alive through proxies |
| `event: end` / `data: {"reason":"delivered"}` | When the stage is final | Then the handler closes the stream |

Four consecutive frames from `curl -N` while the order was on the way, 3 s
apart, the courier moving north towards Piassa:

```
"stage":"on-the-way" "courier":{"name":"Abel","lat":9.01112,"lng":38.76112} "remainingKm":3.1
"stage":"on-the-way" "courier":{"name":"Abel","lat":9.01155,"lng":38.76092} "remainingKm":3
"stage":"on-the-way" "courier":{"name":"Abel","lat":9.01198,"lng":38.76072} "remainingKm":3
"stage":"on-the-way" "courier":{"name":"Abel","lat":9.0124,"lng":38.76053}  "remainingKm":2.9
```

**Headers.** `Cache-Control: private, no-store, no-transform` (`no-transform`
so nothing between — including a compressing proxy — buffers frames to gzip
them) and `X-Accel-Buffering: no` for nginx-style proxies. Frames arrived
3 s apart through `next start`, so nothing buffered them here.

**Every way it ends goes through one `stop()`**: delivered or cancelled
(with `end`), the session no longer valid, the time cap, an error, or the
browser leaving — `ReadableStream`'s `cancel()` and the request's `abort`
signal both call it, and it runs once. It clears the interval and logs:

```
[stream] order 1426 opened by usr_almaz; 1 open
[stream] order 1426 closed (client went away); 0 open
```

That counter is how the "how many connections are open?" question below
was answered.

**Who may open it** is in [AUTH.md](AUTH.md#day-47-the-stream-and-the-export-behind-the-same-checks):
the same checks as `GET /api/orders/[id]`, before the stream opens, plus a
re-check of the session every tick.

### Serverless hosts limit how long a stream may stay open

`next start` holds a stream as long as both ends want it. A serverless host
does not: on Vercel a route handler runs as a function with a **maximum
duration**, set by the plan and by the route's `maxDuration` export
(`route-segment-config/maxDuration.md`: "Deployment platforms can use
`maxDuration` from the Next.js build output"), and a streaming response
counts as running the whole time it is open — and is billed for it. Check the
current limits for the plan before relying on long streams; they have
changed over time. So the handler:

- exports `maxDuration = 300` (the most a delivery needs: 5 minutes from
  placing it), and
- closes itself after 270 s **without** an `end` event, so the browser sees
  a clean close and reconnects (one request, every check re-run) rather
  than having the platform cut it mid-frame.

The time cap was not exercised in the checks below (a delivery ends sooner);
it is the same `stop()` path as the session check, which was. And as the
README says, this app's JSON files cannot be written on Vercel at all, so
the signed-in tracking page is demonstrated on `next start`. WebSockets,
which need a connection held open both ways, are not possible on serverless
functions at all — the deck's Module 4 conversation.

## 4 · Consuming it: EventSource, seeded, closed on unmount

[useOrderStream.js](app/orders/[id]/useOrderStream.js), called by
`OrderStatus`:

```js
const source = new EventSource(`/api/orders/${id}/stream`);
source.onmessage = (e) => mutate(orderKey(id), JSON.parse(e.data), { revalidate: false });
source.addEventListener("end", finish);         // close deliberately
return () => source.close();                    // Day 29's cleanup
```

**Seeded from the server.** The receipt's server render passes `initial`
(the same `orderView()` object) to every leaf; `useOrder` uses it as SWR's
`fallbackData`. The first paint already has the stage, the facts and the
map's positions. The stream only updates them. Checked: the server's HTML
contains the facts (*"Abel will collect it from the Addis Eats kitchen at
Meskel Square. Estimated arrival 16:29 (in 4 minutes)"*) and the indicator
starts as *connecting…*.

**Closed on unmount.** Five times: open the receipt in headless Chromium,
wait for *live*, leave by the receipt's own *All your orders* link (a
client-side navigation, so the React tree unmounts rather than the page
being torn down), and read the server's counter:

```
visit 1: open while on receipt 1, after leaving 0
visit 2: open while on receipt 1, after leaving 0
visit 3: open while on receipt 1, after leaving 0
visit 4: open while on receipt 1, after leaving 0
visit 5: open while on receipt 1, after leaving 0
opened: 5 closed: 5 open now: 0
```

Every close was logged as `client went away`: the browser's `close()`
reached the server as a cancelled stream, and the interval stopped.

**Errors.** The slides write `es.onerror = () => es.close()`. That throws
away the one thing SSE does for free — reconnecting — and contradicts the
slides' next table ("SSE reconnects; show the state"). Here an error is
fatal only when the browser has itself given up (`readyState === CLOSED`:
the server answered a status other than 200, such as the `401` after
signing out), or after three failed reconnects in a row. Either way the
receipt falls back to the Day 41 poll (`useOrder(…, { poll: true })`),
whose first answer says why (*Not signed in.*), and SWR stops polling while
the last answer is an error.

## 5 · The indicator, and closing on delivery

The status pill now reads *In the kitchen · live*: a dot for the eye and
the state in words (`data-connection` on the element), never colour alone:

| State | Shown | Meaning |
| --- | --- | --- |
| `connecting` | *connecting…* | Server render, before the EventSource opens |
| `live` | *live* (the dot pulses, unless reduced motion) | Open, frames arriving |
| `reconnecting` | *reconnecting…* | The line dropped; the browser is retrying |
| `polling` | *checking every few seconds* | The stream failed; the Day 41 poll is running |
| `closed` | *updates finished* | Delivered or cancelled; nothing more will change |

**Closed deliberately on delivery.** The server sends the last frame and
`event: end`, then closes. The client closes its EventSource on that event
(and, defensively, on any frame whose stage is final). Both are needed: if
only the server closed, EventSource would treat it as a dropped line and
reconnect — to a delivered order, every 3 s, forever.

Watched in headless Chromium, order 9003, placed 13:31:18 (UTC), sampled
every second:

```
13:32:29 live   | In the kitchen | Hirut will collect it from the Addis Eats kitchen at Meskel Square.
13:33:20 live   | On the way     | Hirut is on the way: 3.1 km from you.
   … a frame every 3 s; the distance drops 0.1 km about every 6 s …
13:36:11 live   | On the way     | Hirut is on the way: 0.1 km from you.
13:36:17 live   | On the way     | Hirut is almost at your door.
13:36:20 closed | Delivered      | Hirut delivered it.
after delivery, 10 s later: new stream log lines: [] open now: 0
```

The server logged `[stream] order 9003 closed (delivered); 0 open`, and
nothing reconnected. The indicator reads *updates finished*.

**The map stays on delivery — after a fix.** The first version let the
server decide whether to draw a map (`!isFinal(stage)` in `page.js`). On
delivery `OrderStatus` calls `router.refresh()`, the server rendered the
receipt again, saw a delivered order, and the map vanished: everything below
it jumped up 320 px at the very moment the person was watching. (The
delivered-receipt screenshot from that run showed the facts with no map.)
The decision moved into a client component, `Tracking.jsx`, as
`useState(() => !isFinal(initial.stage))`: computed from the first render,
on the server and in the browser alike, and kept across `router.refresh()`,
which preserves client state. Re-run: the map was still there after
delivery, and the CLS over the whole five minutes was **0.003** — the
status pill and the facts changing length ("live" → "updates finished"),
not the map.

## Should the stream replace the poll? Yes, on the receipt — with the poll kept as the fallback

The reading sheet says start with polling and move right only with a
reason. Until today the receipt had nothing frequent to show: a stage
that changes twice, minutes apart, and a five-second poll was right (Day
41). The map changes that. A courier moving every 3 seconds is the
sheet's own case for server-sent events: *frequent and one-directional*.

| | Poll every 3 s | Server-sent events |
| --- | --- | --- |
| Requests while watching a delivery (5 min) | ~100, each a new HTTP request that re-reads the session and the order and re-sends the whole body | 1 connection; ~60 frames while moving, one every 15 s otherwise |
| Latency | Up to 3 s, chosen by the client | The server decides when there is something to say |
| The end | The client notices the stage and stops | The server says `end`; the client closes |
| Cost | Nothing held between requests | A held connection per open receipt, a file read every 3 s each, and serverless duration limits (above) |

The cost side is why the poll is not deleted. `GET /api/orders/[id]` and
`useOrder`'s `refreshInterval` stay, switched on only when the stream cannot
be held open (the reading sheet's "nothing arrives at all → fall back to
polling"). Nothing else became live: the kitchen board and the dashboard
stay rendered on request (DATA.md, "considered and left alone"), and a
delivered receipt opens no connection at all. WebSockets were not
considered: the browser has nothing to send.

## 6 · `lib/format.js`

| Export | Output | Built from | Used by |
| --- | --- | --- | --- |
| `etb(n)` | `ETB 14,200` | `Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 0 })` | Every price: menu cards, dish pages and their metadata and preview images, the home page's specials, cart, checkout, receipt, kitchen board, order tables, dashboard and charts |
| `when(t)` | `2 Nov 2026, 18:40` | `DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" })` | Receipt (placed, cancelled), order tables, the facts beside the map |
| `relative(t, now)` | `in 4 minutes`, `46 seconds ago`, `now` | `RelativeTimeFormat("en", { numeric: "auto" })` | The facts beside the map |
| `clock(t)` | `18:40` | `DateTimeFormat("en-GB", { timeStyle: "short", … })` | Kitchen board, estimated arrival |
| `day(t)` | `3 Oct`, `3 Oct 2026` | two `DateTimeFormat`s | Chart axes and headings (through `lib/addisDay.js`'s `dayLabel`) |
| `stamp(t)` | `2026-11-02 18:40` | `DateTimeFormat("sv-SE", …)` | The CSV's Addis Ababa column |

Every formatter is a module-level constant, built once on import. Each
export is a function rather than the bare `Intl` object the slides export
(`etb.format(…)`), so it can be handed to Recharts as a `tickFormatter` and
accepts the ISO strings JSON delivers.

`relative()` takes `now` as a parameter, on purpose: the facts compute it
against `tracking.at`, the server's clock when the value was made, never
the browser's `Date.now()`. The server's HTML and the browser's hydration
compute the same string, so there is no hydration mismatch (and none was
reported in the console).

Consolidated: `lib/formatMoney.js` (Day 46) and `lib/formatTime.js` (Day 39)
are deleted, the date labels inside `lib/addisDay.js` now come from here,
and every hand-written `{price} ETB` became `etb(price)` (14 places, in 9
files). `grep -rn "Intl\." app components lib cart` now finds `lib/format.js`
and one more: `addisDay.js`'s `en-CA` key formatter, which makes the
`YYYY-MM-DD` *identifier* a day is grouped by, not text anyone reads. Prices
moved from "260 ETB" to "ETB 260" everywhere at once; that is the point of
one module.

**en-ET is not a locale either engine has.** Both Node 24 and Chromium 153
resolve `en-ET` to plain `en`. For money it makes no difference (currency
formatting prints `ETB 14,200` either way), so `etb` keeps the material's
locale. For dates it does: the slides' `when` with `en-ET` prints
**"Nov 2, 2026, 6:40 PM"**, not the "14 Jul 2026, 18:40" their comment
promises. `en-GB` prints what was meant, so the date formatters use it.

**The Ethiopian calendar** and the 12-hour clock counted from dawn are not
used: Addis Eats shows Gregorian dates and a 24-hour clock, as it has since
Day 39 — a decision, as the sheet asks, not an omission. `Intl` cannot do it;
it would need a dedicated library.

## 7 · The CSV export

`GET /api/orders/export` (your own orders) and `?scope=all` (every order,
staff only), linked as *Download your orders (CSV, 47 rows)* under `/orders`
and *Download every order (CSV, 426 rows)* under `/dashboard`.

**Server, not a Blob.** The slides build the file in the browser from data
already on screen. Here the table shows one page of 20, the full history
must be scoped to the person asking, and that scoping is the server's. A
plain `<a href download>` to a handler: no JavaScript, no rows sent to the
browser first.

**Headers:** `Content-Type: text/csv; charset=utf-8`,
`Content-Disposition: attachment; filename="addis-eats-my-orders-2026-11-02.csv"`
(or `addis-eats-all-orders-…`), `Cache-Control: private, no-store`.

**Columns:** Order, Placed (Addis Ababa), Placed (UTC, ISO 8601), Status,
Name, Neighbourhood, Items, Total (ETB), Note for the rider. Totals are bare
integers under a header that names the unit, so a spreadsheet can add them
up (`ETB 1,240` would be text). No phone numbers; staff get first names
only, as on the kitchen board.

**The escaping** ([lib/csv.js](lib/csv.js)): a value containing a comma, a
double quote, `\r` or `\n` is wrapped in quotes, with each `"` doubled; rows
end in CRLF; a UTF-8 byte-order mark goes first so Excel does not misread
`×` and Amharic names. Two additions to the slides' `/[",\n]/`: `\r` (a
lone carriage return is a line break to Excel), and **formula injection** —
a text value starting with `=`, `+`, `-`, `@`, a tab or `\r` gets a leading
`'`, because the notes field is free text and `=HYPERLINK(…)` would
otherwise run when the file is opened.

**Tested with awkward values.** Two temporary orders were written into
`.data/orders.json`: one with the name `Almaz "Bole, Kitfo" Bekele` and the
note `Gate 2, "blue door"` + newline + `Call on arrival` + CRLF + `Thanks`,
one with the note `=HYPERLINK("http://example.com","click")`. The raw file:

```
9002,…,1 × Kitfo,260,"'=HYPERLINK(""http://example.com"",""click"")"
9001,…,"Almaz ""Bole, Kitfo"" Bekele",Bole,1 × Kitfo,260,"Gate 2, ""blue door""
Call on arrival
Thanks"
```

Python's `csv` module read it back as 49 rows, **every one 9 columns**, the
name and note identical to what was stored (`'Gate 2, "blue door"\nCall on
arrival\r\nThanks'`). LibreOffice Calc (headless, UTF-8, comma) opened it
with 9 columns, the order and total columns as numbers, the Addis time as a
date, and the formula as text. The two orders were then removed.

Access: signed out `401`; Almaz `200` (47 rows, all hers), Bereket `200` (10,
all his); `?scope=all` as a customer `403`, as Selam `200` (426 rows);
`?scope=everyone` `400`.

## Files

| File | What it is |
| --- | --- |
| [app/orders/[id]/MapPanel.jsx](app/orders/[id]/MapPanel.jsx) | `"use client"`; `dynamic(…, { ssr: false })` with the sized placeholder |
| [app/orders/[id]/DeliveryMap.jsx](app/orders/[id]/DeliveryMap.jsx) | Leaflet: tiles, attribution, two pins, the route, bounds |
| [app/orders/[id]/DeliveryFacts.jsx](app/orders/[id]/DeliveryFacts.jsx) | The map's information in words |
| [app/orders/[id]/useOrderStream.js](app/orders/[id]/useOrderStream.js) | EventSource → the SWR cache; the connection state |
| [app/orders/[id]/OrderStatus.jsx](app/orders/[id]/OrderStatus.jsx) | The stage, the indicator, the fallback poll switch |
| [app/api/orders/[id]/stream/route.js](app/api/orders/[id]/stream/route.js) | The stream |
| [app/api/orders/export/route.js](app/api/orders/export/route.js) | The CSV |
| [lib/delivery.js](lib/delivery.js) | The simulated courier and delivery point |
| [lib/format.js](lib/format.js) | Every price and time |
| [lib/csv.js](lib/csv.js) | `cell`, `toCsv`, `BOM` |
