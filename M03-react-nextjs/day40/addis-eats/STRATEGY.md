# Rendering strategy — Addis Eats, route by route

Two questions picked every row: **does this route depend on who is asking**, and
**how stale may it be?** If the answers were "nobody in particular" and "quite
stale is fine", the route was left static and nothing was added.

The brief's five routes are the first five rows of the page table. Day 39
added three more pages (`/login`, `/orders`, `/orders/[id]`) and the endpoints.
Day 40 wrote one line of reasoning for every row, compared each line with the
build output, and changed one row as a result (below).

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
| `/checkout` | Dynamic (per request) | `ƒ` | `await cookies()` (session, customer, basket) in [app/checkout/page.js](app/checkout/page.js); `dynamic = "force-dynamic"` in [app/checkout/layout.js](app/checkout/layout.js) | It shows the signed-in person their own basket and greets them by name — cached, one customer would see another's order. |
| `/login` | Dynamic | `ƒ` | `getSession()` (a cookie) and `await searchParams` in [app/login/page.js](app/login/page.js) | It says who you are signed in as, and where `?next=` will send you. |
| `/orders` | **Static, revalidated on demand** | `○` (no window) | nothing on the page; `revalidatePath("/orders")` in every write: `placeOrder`, `cancelOrder` ([app/actions.js](app/actions.js)) and `POST /api/orders` | The board is the same for everyone and changes only when an order is written — so it is rebuilt exactly then, and never on a timer. |
| `/orders/[id]` | Dynamic | `ƒ` | `getSession()` in [app/orders/\[id\]/page.js](app/orders/[id]/page.js) | A receipt is shown only to the person who placed it; the answer depends on the session cookie. |
| `/_not-found` | Static | `○` | nothing | One page for every kind of missing; nothing in it varies. |

## Endpoints

Route handlers follow the same rules as pages and appear in the same table.

| Route | Build marker | Why |
| --- | --- | --- |
| `GET /api/dishes` | `ƒ` | It reads `?category=` from `request.nextUrl`, and a handler that reads the request cannot be prerendered. The read is the menu file without the page's 900 ms delay, so caching would save little and risk a stale-menu surprise. |
| `GET /api/dishes/[id]` | **`●` 1h (13 paths)** | Day 40 changed this one (see below). Nobody in particular is asking, an hour matches `/menu/[id]` for the same price, and every id is known, so it uses `generateStaticParams` + `revalidate = 3600`. An unlisted slug is answered on request with a 404, which is then cached. |
| `POST /api/orders` | `ƒ` | A POST is never cached. |
| `GET /api/orders/[id]` | `ƒ` | Day 40. It reads the session cookie, and its answer (the stage) changes with the clock. It is polled by the receipt, so it must never be cached anywhere: `Cache-Control: private, no-store`. |

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
form are worth more than a spinner. The menu keeps its `loading.js`: every
menu page is prerendered, so there is nothing to stream there except an
unlisted slug.

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
- **`/orders`, no window.** The one route that is told when it is wrong. A
  window would be the wrong tool twice over: up to a window behind right after
  an order, and a pointless re-render every window when there is none. Day 39's
  README shows the board staying stale when the `revalidatePath` call is
  removed.

## Inside a route

The table is per route, but the menu also shows the *inside* of the decision:

- `app/menu/layout.js` (sidebar) awaits nothing, so it is ready at once.
- `app/menu/page.js` awaits nothing either; only the dish list waits, and it is
  behind its own `<Suspense fallback={<DishSkeleton />}>`.
- On a production build that wait was paid at build time (and is paid again in
  the background at most once an hour), so the HTML arrives complete. When the
  page is rendered on request — every visit under `npm run dev` — the shell and
  the skeleton are streamed first and the dishes follow ~900 ms later in the
  same response.

## The cookie that would have broken all of this

The session cookie is read only by `/checkout`, `/login`, `/orders/[id]` and the
actions. A "Signed in as…" line in the shared header would have been one
`cookies()` call in `SiteHeader` — and every route in the table would have
turned `ƒ`, `/menu` and `/orders` included. So the sign-in line lives on the
pages that are dynamic anyway.

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
| `/orders` | static, on-demand | `○`, no window |
| `/orders/[id]` | dynamic | `ƒ` |
| `/api/dishes` | dynamic | `ƒ` |
| `/api/dishes/[id]` | static via params, 1 h | `●` 1h, 13 paths |
| `/api/orders`, `/api/orders/[id]` | dynamic | `ƒ` |
| `/_not-found` | static | `○` |

The full output is in the README.
