# Rendering strategy — Addis Eats, route by route

Two questions picked every row: **does this route depend on who is asking**, and
**how stale may it be?** If the answers were "nobody in particular" and "quite
stale is fine", the route was left static and nothing was added.

The brief's five routes are the first five rows of the page table. Day 39
added three more pages (`/login`, `/orders`, `/orders/[id]`) and the endpoints.
Day 40 wrote one line of reasoning for every row, compared each line with the
build output, and changed one row as a result (below). Day 42 added
authentication, which moved `/orders` from static to dynamic and added
`/kitchen` and `/signup`. Every row below is the Day 42 build; Day 43
changed no row (images, fonts and one optional script do not decide when a
route renders), and its build prints the same table. Day 44 changed no page's
marker either — metadata is computed in the same render as the page — and
added five metadata routes, listed under Endpoints.

The questions, from the Day 40 sheet: *Who is asking?* Nobody in particular
→ static. *How stale may it be?* An hour → `revalidate = 3600`. *Do I know
the ids?* → `generateStaticParams`. *Does it read a cookie?* → dynamic, and
that is correct. *Is it private to one tab?* → render it on the client.

## Pages

| Route | Strategy | Build marker | Set by | Why, in one line |
| --- | --- | --- | --- | --- |
| `/` | Static, revalidated hourly (ISR 1 h) | `○` 1h | `export const revalidate = 3600` in [app/page.js](app/page.js) | Same for every visitor; the story never changes, but the three specials quote menu prices, so it takes the menu's window. |
| `/menu` | Incremental (ISR 1 h) | `○` 1h | `export const revalidate = 3600` in [app/menu/page.js](app/menu/page.js) | Same for every visitor and the dishes change a few times a day — an hour-old menu misleads nobody, and speed matters most here. |
| `/menu/[id]` | Static via params, revalidated hourly | `●` 1h (13 paths) | `generateStaticParams` + `revalidate = 3600` in [app/menu/\[id\]/page.js](app/menu/[id]/page.js) | Every dish is known at build time; it shows the same price as the list, so it shares the list's window. |
| `/menu/<unlisted slug>` | Rendered on first request, then cached | — | `dynamicParams` left at its default, `true` | A dish added after the build must open before the next build; an unknown slug is a cached 404. |
| `/cart` | Client | `○` (empty shell) | the list is [CartContents.jsx](app/cart/CartContents.jsx), a client component reading localStorage | The basket is the person's own and lives in their browser — the server has nothing to render. |
| `/checkout` | Dynamic (per request) | `ƒ` | `getSession()` and `await cookies()` (session, customer, basket) in [app/checkout/page.js](app/checkout/page.js); `dynamic = "force-dynamic"` in [app/checkout/layout.js](app/checkout/layout.js) | It shows the signed-in person their own basket and greets them by name — cached, one customer would see another's order. |
| `/login` | Dynamic | `ƒ` | `getSession()` (a cookie) and `await searchParams` in [app/login/page.js](app/login/page.js) | It says who you are signed in as, and where `?next=` will send you. |
| `/signup` | Dynamic | `ƒ` | `getSession()` and `await searchParams` in [app/signup/page.js](app/signup/page.js) | The same two reads as `/login`: a signed-in person is sent on, and `?next=` is the destination after the new account exists. |
| `/orders` | Dynamic | `ƒ` | `getSession()` and `listOrdersFor(user.id)` in [app/orders/page.js](app/orders/page.js) | Your orders, and nobody else's. The query is filtered by the session's account, so the answer depends on the cookie and cannot be prerendered. |
| `/orders/[id]` | Dynamic | `ƒ` | `getSession()` and `getOrderFor(user.id, id)` in [app/orders/\[id\]/page.js](app/orders/[id]/page.js) | A receipt is shown only to the person who placed it; the answer depends on the session cookie. |
| `/kitchen` | Dynamic | `ƒ` | `getSession()` and `user.role === "staff"` in [app/kitchen/page.js](app/kitchen/page.js) | The staff board shows every customer's order; a signed-in customer gets `forbidden()` (`403`), not a page. |
| `/_not-found` | Static | `○` | nothing | One page for every kind of missing; nothing in it varies. |

## Endpoints

Route handlers follow the same rules as pages and appear in the same table.

| Route | Build marker | Why |
| --- | --- | --- |
| `GET /api/dishes` | `ƒ` | It reads `?q=`, `?category=` and `?page=` from `request.nextUrl`, and a handler that reads the request cannot be prerendered. The read is the menu file without the page's 900 ms delay, so caching would save little and risk a stale-menu surprise. Day 41: the menu's search box calls it, and SWR caches each answer in the browser by key ([DATA.md](DATA.md)). |
| `GET /api/dishes/[id]` | **`●` 1h (13 paths)** | Day 40 changed this one (see below). Nobody in particular is asking, an hour matches `/menu/[id]` for the same price, and every id is known, so it uses `generateStaticParams` + `revalidate = 3600`. An unlisted slug is answered on request with a 404, which is then cached. |
| `POST /api/orders` | `ƒ` | A POST is never cached. Day 42: it calls `getSession()` before reading the body and answers `401` without one; the owner is the session's account, never a field. |
| `GET /api/orders/[id]` | `ƒ` | Day 40. It reads the session cookie, and its answer (the stage) changes with the clock. Day 42: `401` signed out, `403` for someone else's order, `404` for none. It is polled by the receipt, so it must never be cached anywhere: `Cache-Control: private, no-store`. Day 41: polled through `useSWR`, whose only cache is this tab's memory. |

### Day 44: the metadata routes

They are special route handlers, chosen by the same two questions. None of
them reads the request, so all five are prerendered; the ones that print
menu data take the menu's hour.

| Route | Build marker | Why |
| --- | --- | --- |
| `/opengraph-image` | `○` | The site-wide preview card. Nothing in it changes between builds |
| `/menu/opengraph-image` | `○` 1h | Prints the number of dishes and the lowest price, so it takes the menu's window |
| `/menu/[id]/opengraph-image` | `●` 1h (13 paths) | Prints the dish's price; `generateStaticParams` + `revalidate = 3600`, exactly like the dish page beside it |
| `/sitemap.xml` | `○` 1h | Lists every dish in the file; a new dish appears within the menu's hour |
| `/robots.txt` | `○` | Fixed rules. It and the sitemap contain the site URL, which is read at build time ([SEO.md](SEO.md)) |

## The route that changed its mind

**`GET /api/dishes/[id]`**, from `ƒ` to `●`. On Day 39 it was left dynamic,
justified as *"so the endpoint and the file never disagree"*. Asked the five
questions above, that sentence did not survive. The endpoint serves the same
dish, at the same price, as `/menu/kitfo`, which is already allowed to be an
hour old. So the endpoint can never disagree with the page by more than the
page already disagrees with the file. Nobody in particular is asking, and every
id is known at build time. Now the build prerenders thirteen JSON responses,
and `curl -i /api/dishes/kitfo` answers `x-nextjs-cache: HIT`.

`GET /api/dishes` stays `ƒ`, and the questions say why. Its answer depends on
the query string (`?category=`), and a handler that reads the request cannot
be prerendered.

**`/orders`, from `○` static to `ƒ` dynamic, on Day 42.** For three days it was
the kitchen board: the same orders for everyone, static, rebuilt by
`revalidatePath("/orders")` on every write. Authentication asked the two
questions again. *Who is asking?* One person, and the page says *"Your
orders"* — a different answer for every account. *How stale may it be?* Not at
all: an order placed a second ago must appear. A static page cannot be
different per cookie, so it is dynamic. The board did not disappear; it moved
to `/kitchen`, which is also `ƒ` because it reads the session and the role.
The on-demand `revalidatePath` calls stay, because they drop the client
router's cached copies of both pages.

## A special file that was tried and removed

Day 40 asks for loading and error files per segment, so `app/checkout/loading.js`
and `app/orders/loading.js` were written. Both were deleted the same hour,
because on a dynamic route a `loading.js` makes Next.js **stream** the page:
the status line and the fallback go out first, and the page follows. Two
things broke, and the browser checks caught both:

1. **The guard.** Signed out, `curl -i /checkout` answered `200 OK` instead of
   `307`. The page's `redirect("/login…")` runs after the status line has been
   sent, so it can only be a client-side redirect inside the stream.
2. **The checkout without JavaScript.** The form arrived hidden, waiting for
   an inline script to swap it in for the fallback. With scripting off it
   never appeared, so the order could not be placed.

These two routes read a couple of cookies and a small file, so they have
almost nothing to wait for. A real HTTP status and a working no-JavaScript
form are worth more than a spinner. The menu kept its `loading.js` until
Day 45, when it went too, for a different reason: on a prerendered page the
boundary cost `/menu` its LCP (below, and PERF.md "Day 45").

## The revalidate windows, justified

- **`/menu`, 1 hour.** The kitchen edits the menu a few times a day. Nobody is
  misled by a dish list that is up to an hour old, and every visitor in that
  hour gets a file instead of a 900 ms read. A flash promotion would need
  something shorter, or an on-demand `revalidatePath("/menu")` when the price
  is saved.
- **`/menu/[id]`, 1 hour.** The dish page prints the same price as the list.
  Without a window it would keep the build-day price forever while the list
  moved on, and the two pages would disagree.
- **`/`, 1 hour.** The home page's own text would be fine as plain static. Its
  specials list prices from the same file, so it takes the same window for the
  same reason as the dish pages.
- **`/orders`, `/orders/[id]`, `/kitchen`, `/signup`, no window.** These read
  the session, so they are rendered on request — a window is not available to
  them, and would be the wrong tool anyway: an order placed a second ago must
  appear. `/orders` used to be the static board with an on-demand
  `revalidatePath`; Day 42 made it the person's own list, which cannot be
  shared. The `revalidatePath` calls stay to drop the client router's cached
  copies.

## Inside a route

The table is per route, but the menu also shows the *inside* of the decision:

- `app/menu/layout.js` (sidebar) awaits nothing, so it is ready at once.
- `app/menu/page.js` awaits nothing either; only the dish list waits, and it is
  behind its own `<Suspense fallback={<DishSkeleton />}>` (until Day 45, last
  bullet).
- On a production build that wait was paid at build time (and is paid again in
  the background at most once an hour), so the HTML arrives complete. When the
  page is rendered on request — every visit under `npm run dev` — the shell and
  the skeleton are streamed first and the dishes follow ~900 ms later in the
  same response.
- **Day 43 correction.** "The HTML arrives complete" was only half true. The
  build does wait for the dishes, and the dishes *are* in the prerendered
  file — but because the boundary suspended while it was being built, React
  writes it in its streaming form: the skeleton in place, the dishes in a
  `<div hidden id="S:0">`, and an inline `$RC("B:0","S:0")` script that swaps
  them. React throttles that swap (it waits up to ~300 ms after the last
  paint, to batch reveals), so the first dish photo is painted after the
  skeleton, not with it. Lighthouse sees it as LCP render delay on `/menu`
  (PERF.md, "What is left"). Removing the `<Suspense>` in `page.js` was tried
  and did not help: `app/menu/loading.js` is a boundary of its own around the
  page and produces the same markup. Left as it is today; the real fix is to
  stop the build-time render suspending (the 900 ms teaching delay in
  `getMenu()`), which is a decision for the data layer, not for an
  optimisation day.
- **Day 45: done.** The budget asks for LCP under 2.5 s and `/menu` measured
  3.26 s, so this was the optimisation pass. Making the delay production-free
  was tried first and did **not** help: even a synchronous read inside an
  async server component suspends, and the build still wrote the `$RC` form.
  What helped was removing both boundaries — the `<Suspense>` in `page.js`
  *and* `app/menu/loading.js` (either one alone produced the same markup).
  The cards are now plain HTML in the first response, no `$RC`, and `/menu`'s
  LCP median went from 3.26 s to 2.29 s. The installed docs say the same
  (`streaming.md`: keep the LCP element outside Suspense boundaries). The
  route's strategy is unchanged (`○` 1h); the 900 ms is still paid by the
  build. The price is that `npm run dev` no longer shows the skeleton: it
  waits out the 900 ms on the previous page.

## The cookie that would have broken all of this

The session cookie is read by `/checkout`, `/login`, `/signup`, `/orders`,
`/orders/[id]`, `/kitchen` and the actions — and by no shared component. A
"Signed in as…" line in the header would have been one `cookies()` call in
`SiteHeader`, and every route in the table would have turned `ƒ`, `/menu` and
the dish pages included. So the sign-in line lives on the pages that are
dynamic anyway. The same reason keeps the Kitchen link off the header: knowing
the role means reading the session.

## Checked against the build

`npm run build` prints exactly what this table says, row for row:

| Route | This document | Build |
| --- | --- | --- |
| `/` | static, 1 h | `○` 1h |
| `/menu` | ISR 1 h | `○` 1h |
| `/menu/[id]` | static via params, 1 h | `●` 1h, 13 paths |
| `/cart` | client (static shell) | `○` |
| `/checkout` | dynamic | `ƒ` |
| `/login` | dynamic | `ƒ` |
| `/signup` | dynamic | `ƒ` |
| `/orders` | dynamic | `ƒ` |
| `/orders/[id]` | dynamic | `ƒ` |
| `/kitchen` | dynamic | `ƒ` |
| `/api/dishes` | dynamic | `ƒ` |
| `/api/dishes/[id]` | static via params, 1 h | `●` 1h, 13 paths |
| `/api/orders`, `/api/orders/[id]` | dynamic | `ƒ` |
| `/_not-found` | static | `○` |
| `/opengraph-image`, `/robots.txt` | static (Day 44) | `○` |
| `/menu/opengraph-image`, `/sitemap.xml` | static, 1 h (Day 44) | `○` 1h |
| `/menu/[id]/opengraph-image` | static via params, 1 h (Day 44) | `●` 1h, 13 paths |

The full output is in the README. Day 41 changed no marker: the search and
the poll run in the browser, after the page has been served exactly as
before. Day 42 changed three markers — `/orders` from `○` to `ƒ`, and the new
`/kitchen` and `/signup` are `ƒ` — because all three read the session. Every
client-side query, with its key and refresh rule, is in [DATA.md](DATA.md);
the layers that protect each route are in [AUTH.md](AUTH.md).
