# Rendering strategy — Addis Eats, route by route

Two questions picked every row: **does this route depend on who is asking**, and
**how stale may it be?** If the answers were "nobody in particular" and "quite
stale is fine", the route was left static and nothing was added.

Day 39 added three pages (`/login`, `/orders`, `/orders/[id]`) and three
endpoints. Every row from Day 37 is unchanged.

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
| `GET /api/dishes/[id]` | `ƒ` | Route handlers are not cached by default in Next.js 16. It is one small file read; left dynamic so the endpoint and the file never disagree. |
| `POST /api/orders` | `ƒ` | A POST is never cached. |

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

`npm run build` prints exactly what this table says: `○ /` 1h, `○ /menu` 1h,
`● /menu/[id]` 1h with thirteen paths, `○ /cart`, `ƒ /checkout`, `ƒ /login`,
`○ /orders`, `ƒ /orders/[id]`, `ƒ` for the three API routes, `○ /_not-found`.
The full output is in the README.
