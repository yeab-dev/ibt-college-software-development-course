# The Day 45 project — three decisions, on paper

The project sheet asks for three tables before any code: who may see what,
where each piece of data is fetched, and the performance budget. Days 41–44
had already built most of it, so these were filled in against the existing
code first, and every row was then checked with a tool. A row that could not
point at a line or a number would have been a gap. The details are in
[AUTH.md](AUTH.md), [DATA.md](DATA.md) and [PERF.md](PERF.md); this file is
the one-page view.

## 1 · Who may see what

| Route | Who | Protected by | What that proves |
| --- | --- | --- | --- |
| `/menu`, `/menu/[id]`, `/` | Everyone | Nothing | Public, and indexable: in the sitemap, `index, follow` |
| `/cart` | Everyone | Nothing (the basket is the browser's own) | `noindex`, disallowed; nothing on the server to protect |
| `/orders` | The owner | Proxy + page + scoped query | Proxy: a session-shaped cookie exists. Page: the session is live. Query: `listOrdersFor(user.id)` can only return their own records |
| `/orders/[id]` | The owner | Proxy + page + scoped query + checked action | As above, with `getOrderFor(user.id, id)`: someone else's id is a `404`. Cancel re-checks the owner inside `cancelOrder` |
| `/checkout` | Any signed-in person | Proxy + page | Signed in. The write (`placeOrder`) checks the session itself and takes the owner from it, never from the form |
| `/kitchen` | Staff only | Proxy + page role check + role check in every action | Page: live session **and** `role === "staff"`, else `403`. `cancelOrder` checks the role again, because a button's action can be posted from anywhere |
| `/dashboard` (Day 46) | Staff only | Proxy + page role check, the same as `/kitchen` | Revenue across every customer and whose order is whose. Page: live session **and** `role === "staff"`, else `403`, checked *before* the Suspense boundary so the `403` is a real status. Read-only: no action to re-check (AUTH.md, Day 46) |
| `POST /api/orders`, `GET /api/orders/[id]` | Signed in / the owner | The handler itself (not in the proxy's matcher) | `401` without a session; `403` for someone else's order |
| `/login`, `/signup` | Everyone | Nothing, by design | `next` is accepted only if it stays on this site (`safeNext`, in the page **and** the action) |

"Protected by the proxy" is never the answer on its own: `proxy.js` only
proves a cookie of the right *shape* exists. The attacks in AUTH.md show a
forged cookie getting past it and being refused by `getSession()`.

## 2 · Where data is fetched

| Data | Where, and why |
| --- | --- |
| Menu and dishes | Server: public, indexable, cacheable. Prerendered, ISR 1 h |
| Order history | Server: private, scoped to the session (`listOrdersFor(user.id)`), rendered per request |
| Order status | Server first (the receipt's HTML), then polled on the client every 5 s with SWR, seeded with the server's answer as `fallbackData` |
| Menu search | Client: triggered by typing, debounced 300 ms, SWR keyed by the URL. Seeded by the server-rendered list: an empty box asks nothing |
| Cart | Client store (zustand + localStorage). It reaches the server only as the basket cookie the checkout prices |

Verified on Day 45: no request on arriving at a receipt, one request for five
keystrokes, one per pause ([DATA.md](DATA.md#day-45-the-sheets-five-rows-and-how-each-was-checked)).

## 3 · The performance budget

Lighthouse 13.6, mobile defaults (Slow 4G, 4× CPU), production build, medians.
Before = the Day 45 baseline (Day 44's code); after = the shipped Day 45
code. The full table, the ranges and the causes are in
[PERF.md](PERF.md#day-45-the-performance-budget).

| Measure | Target | Before | After | |
| --- | --- | --- | --- | --- |
| LCP, throttled (`/menu`) | under 2.5 s | 3.26 s | 2.29 s | Met. Cause: the cards left the Suspense boundary |
| CLS | under 0.1 | 0 | 0 | Met (Day 43's width/height and font fallback) |
| First Load JS, `/menu` | under 120 kB | 173 KiB | 173 KiB | **Missed**: the React + Next.js 16 runtime alone is ~130 KiB |
| Largest image | under 150 kB | 87 KiB | 87 KiB | Met (Day 43's `next/image`; the source JPEG is 286 KB) |
| Lighthouse performance (`/menu`) | 90 or better | 91 | 98 | Met; `/` 97, a dish page 99 |

The week's starting point, for scale (Day 43's plain `<img>` and Google font
link): `/menu` LCP 6.20 s, score 70, 1415 KiB of photos on every page.
