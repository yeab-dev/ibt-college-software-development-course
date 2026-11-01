# Rendering strategy — Addis Eats, route by route

Two questions picked every row: **does this route depend on who is asking**, and
**how stale may it be?** If the answers were "nobody in particular" and "quite
stale is fine", the route was left static and nothing was added.

| Route | Strategy | Build marker | Set by | Why, in one line |
| --- | --- | --- | --- | --- |
| `/` | Static, revalidated hourly (ISR 1 h) | `○` 1h | `export const revalidate = 3600` in [app/page.js](app/page.js) | Same for every visitor; the story never changes, but the three specials quote menu prices, so it takes the menu's window. |
| `/menu` | Incremental (ISR 1 h) | `○` 1h | `export const revalidate = 3600` in [app/menu/page.js](app/menu/page.js) | Same for every visitor and the dishes change a few times a day — an hour-old menu misleads nobody, and speed matters most here. |
| `/menu/[id]` | Static via params, revalidated hourly | `●` 1h (13 paths) | `generateStaticParams` + `revalidate = 3600` in [app/menu/\[id\]/page.js](app/menu/[id]/page.js) | Every dish is known at build time; it shows the same price as the list, so it shares the list's window. |
| `/menu/<unlisted slug>` | Rendered on first request, then cached | — | `dynamicParams` left at its default, `true` | A dish added after the build must open before the next build; an unknown slug is a cached 404. |
| `/cart` | Client | `○` (empty shell) | `"use client"` on [app/cart/page.js](app/cart/page.js) | The basket is the person's own and lives in their browser's localStorage — the server has nothing to render. |
| `/checkout` | Dynamic (per request) | `ƒ` | `await cookies()` in [app/checkout/page.js](app/checkout/page.js); `export const dynamic = "force-dynamic"` in [app/checkout/layout.js](app/checkout/layout.js) | It greets the person by the name in their own cookie — cached, one customer would see another's name. |
| `/_not-found` | Static | `○` | nothing | One page for every kind of missing; nothing in it varies. |

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

## Inside a route

The table is per route, but the menu also shows the *inside* of the decision:

- `app/menu/layout.js` (sidebar) awaits nothing, so it is ready at once.
- `app/menu/page.js` awaits nothing either; only the dish list waits, and it is
  behind its own `<Suspense fallback={<DishSkeleton />}>`.
- On a production build that wait was paid at build time (and is paid again in
  the background at most once an hour), so the HTML arrives complete. When the
  page is rendered on request — every visit under `npm run dev` — the shell and
  the skeleton are streamed first and the dishes follow ~900 ms later in the
  same response. See the README for the measurements of both.

## Checked against the build

`npm run build` prints exactly what this table says: `○ /` 1h, `○ /menu` 1h,
`● /menu/[id]` 1h with thirteen paths, `○ /cart`, `ƒ /checkout`,
`○ /_not-found`. The full output is in the README.
