# Addis Eats — Day 37: layouts & rendering strategies

The Day 36 Next.js application with a real shell and a decision for every
route. The root layout owns `<html>` and `<body>`, the header and the footer.
The menu has its own layout with a category sidebar that stays mounted while you
move between the list and the dishes. Each route is built at the moment that
suits it: the menu once an hour, every dish ahead of time, the checkout on every
request. The dish list sits behind a Suspense boundary, so the sidebar never
waits for it. [STRATEGY.md](STRATEGY.md) lists each route and why.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000; renders every request, so streaming is visible
npm run build      # production build: prints the route table below
npm run start      # serves that build
npm run lint
```

| Try | What happens |
| --- | --- |
| Open `/menu` under `npm run dev` | Header, sidebar and *The menu* straight away, skeleton cards where the dishes go, then the dishes about 0.9 s later |
| Same under `npm run start` | Everything at once. The page was built ahead of time and nothing waits (see [Streaming](#streaming-and-the-static-menu)) |
| Press **Count +1** three times in the sidebar, then open any dish | The dish replaces the list. The sidebar still says **3** |
| Pick **Drink**, open a dish, press **← Menu** | Still Drink. The category lives in the layout |
| On a dish page, pick **Main** | You go back to `/menu?category=Main`, filtered |
| Reload `/menu?category=Dessert` | Two desserts. The filter is read back from the address |
| Go to **Cart**, then back to **Menu** | The counter is back to 0. You left the menu segment, so its layout unmounted. The header's render count kept going |
| **Simulate a broken kitchen** | `app/menu/error.js` replaces the list. The sidebar and its counter stay. **Try again** brings the dishes back |
| Place an order, add a dish, open **Checkout** | *Welcome back, …*, with the name and area already filled in. The server read your cookie |
| `/checkout?fail=1` | The kitchen refuses the order, as on Day 33 |
| `/menu/pizza`, `/some/bad/url` | The not-found screen, with a real 404 status for both |

## The route table

`npm run build`, Next.js 16.4.2, after today's work:

```
Route (app)             Revalidate  Expire
┌ ○ /                           1h      1y
├ ○ /_not-found
├ ○ /cart
├ ƒ /checkout
├ ○ /menu                       1h      1y
└   /menu/[id]
  ├ ● /menu/doro-wat            1h      1y
  ├ ● /menu/shiro               1h      1y
  ├ ● /menu/tibs                1h      1y
  └ ● [+10 more paths]


○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

Day 36's build, for comparison. It was copied here unchanged and built before any edit:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /cart
├ ƒ /checkout
├ ƒ /menu
└ ƒ /menu/[id]
```

How the markers moved:

| Route | Day 36 | Day 37 | What moved it |
| --- | --- | --- | --- |
| `/menu` | `ƒ` | `○` 1h | The page stopped reading `searchParams` (Day 36 read `?fail=1`), which was the only thing making it dynamic. It also gained `revalidate = 3600` |
| `/menu/[id]` | `ƒ` | `●` ×13, 1h | `generateStaticParams` returns all 13 slugs. `.next/server/app/menu/` holds exactly 13 `.html` files, one per dish in `data/menu.json` |
| `/` | `○` | `○` 1h | `revalidate = 3600`. It quotes menu prices (see STRATEGY.md) |
| `/checkout` | `ƒ` | `ƒ` | Same marker for a different reason. See the next table |

The `/checkout` marker was checked at each step of exercise 6 by building three
variants:

| `/checkout` variant | Build |
| --- | --- |
| No `cookies()`, no `force-dynamic`, `?fail=1` not read | `○ /checkout`: it would be prerendered |
| Same, but `Checkout.jsx` reads `?fail=1` with `useSearchParams()` | **Build error**: *useSearchParams() should be wrapped in a suspense boundary at page "/checkout"*. A static page cannot know its query string |
| `await cookies()` in `page.js` (no `force-dynamic` yet) | `ƒ /checkout` |
| Plus `export const dynamic = "force-dynamic"` in `layout.js` (shipped) | `ƒ /checkout` |

## The seven requirements, and where each one landed

| Requirement | Where |
| --- | --- |
| Root layout owning html and body, importing global CSS, header and footer | [app/layout.js](app/layout.js) has the only `<html>`/`<body>` in the project and the only `globals.css` import. [components/SiteHeader.jsx](components/SiteHeader.jsx) and [SiteFooter.jsx](components/SiteFooter.jsx) are server components |
| Nested menu layout with a sidebar, shown to keep state across a navigation | [app/menu/layout.js](app/menu/layout.js) renders the category sidebar and [LayoutCounter.jsx](app/menu/LayoutCounter.jsx). Tested in Chromium: the counter and the sidebar's DOM node both survive `/menu` → dish (see Verified) |
| Menu route on a justified revalidate window, still static | `export const revalidate = 3600` in [app/menu/page.js](app/menu/page.js). The build shows `○ /menu 1h`. The justification is in the comment and in STRATEGY.md |
| `generateStaticParams` on the dish route, one page per dish | [app/menu/\[id\]/page.js](app/menu/[id]/page.js): 13 dishes, 13 `●` paths, 13 HTML files |
| Checkout forced dynamic, with a comment naming the read that requires it | [app/checkout/layout.js](app/checkout/layout.js) has `export const dynamic = "force-dynamic"`. Its comment names `const cookieStore = await cookies();` in [app/checkout/page.js](app/checkout/page.js), which is marked *"This is the line that makes /checkout dynamic"* |
| A Suspense boundary streaming the dish list behind an instant sidebar | `<Suspense fallback={<DishSkeleton />}><Dishes /></Suspense>` in [app/menu/page.js](app/menu/page.js). Measured below |
| STRATEGY.md | [STRATEGY.md](STRATEGY.md) |

## Decisions worth explaining

**The category moved into the layout.** Day 36 kept the category in the query
string and read it with `useSearchParams`. On a prerendered page that hook makes
everything up to the nearest Suspense boundary render only in the browser. Here
that would include the dish list, so the static HTML would have had no dishes
in it. So the category is now state in
[MenuFilterProvider.jsx](app/menu/MenuFilterProvider.jsx), which the menu
layout renders around the sidebar and the page. This is also where the state
belongs: the sidebar that changes it is in the layout, and layout state
survives navigation. The address still follows along
(`history.replaceState`), and a reload reads it back after hydration. One cost
follows from serving one file to everyone: the HTML for `/menu?category=Drink`
lists all 13 dishes, and the filter applies a moment later in the browser.

**Day 33's `CategoryBar.jsx` is unchanged.** [CategorySidebar.jsx](app/menu/CategorySidebar.jsx)
connects it to the layout's state. The only other change is CSS that stacks the
buttons in the sidebar. On a dish page, choosing a category also navigates to
the list.

**The broken kitchen is now simulated in the browser.** Day 36 threw on the
server for `/menu?fail=1`. Reading the query string on the server is what made
the menu dynamic, so the switch is now a button that sets state in
`MenuBrowser`, and the component throws while rendering. `error.js` catches a
client render error the same way it caught the server's. A useful side effect
shows where the boundary sits: `error.js` is nested *inside* the menu layout,
so the sidebar and its counter stay on screen while the error is shown. Retry
is now a plain `reset()`, because the component that held the switch was
discarded along with the error.

**`dynamicParams` stays `true`.** `/menu` is regenerated hourly from
`data/menu.json`, so a dish added during the day appears in the list before
the next build, and its link has to work. This was tested: a dish added to the
file after the build was served on its first request (`x-nextjs-cache: MISS`,
0.99 s), then from the cache (`HIT`, 5 ms). An unknown slug gets the same
treatment, and its 404 is cached too.

**`/menu/pizza` is now a real 404.** On Day 36 it was a 200 with a
`noindex` tag, because `loading.js` had already streamed before the page called
`notFound()`. An unlisted slug on an ISR route is rendered completely before
anything is sent, so that the result can be cached, so the status line can
still say 404. The comments in `not-found.js` and the dish page are updated.

**The checkout reads one thing from the request.** It greets a returning
customer. After a successful order the browser writes an `addis-eats-customer`
cookie holding the name and area only, never the phone number, since a cookie
travels with every request. [customerCookie.js](app/checkout/customerCookie.js)
parses it defensively on the server, because a cookie is outside input. The
greeting is rendered by the server, so it is already in the first HTML. `?fail=1`
moved from the page's `searchParams` back to `useSearchParams()` in the form,
which is fine on a dynamic route. That left exactly one request-time read in
the page, so "which line makes it dynamic?" has a single answer.

**Why both `cookies()` and `force-dynamic`.** The brief asks for both: force
the route dynamic, and name the read that requires it. The `cookies()` call
alone is enough, and the variant builds above show it. The export states the
intent at folder level, so a future `/checkout/confirm` inherits it. It also
keeps the route safe if the cookie read moves into a helper.

**`loading.js` stays, with a smaller job.** `/menu` no longer suspends at the
top, so `loading.js` now covers the dish pages. In production those are
prebuilt, so the server never streams it. It is what the router shows on a
client-side navigation to a dish whose payload is not cached yet, and it
streams on every visit under `npm run dev`. It and the Suspense fallback share
[DishSkeleton.jsx](app/menu/DishSkeleton.jsx). The skeleton cards are the same
size as dish cards, so nothing shifts when the dishes arrive.

**No `template.js`, no route groups.** Neither is needed. Nothing here has to
remount on every visit, and the shop has one shell. `LayoutCounter.jsx`'s
comment notes what would change if it lived in a template.

**Cache Components were not switched on.** The reading sheet and slides
(the Oct 20 versions) teach the model used here: `revalidate`, `dynamic`,
`generateStaticParams`. The `Day 37.docx` in the same folder instead
teaches Next.js 16's `cacheComponents` model: `"use cache"`, `cacheLife("hours")`,
`cacheTag`/`revalidateTag`/`updateTag`, `connection()`. That model is real
and current, but it **removes** `revalidate`, `dynamic` and `fetchCache` as
segment options (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md`),
so the requirements as written could not be met with it on. The equivalents,
for reference:

| Reading sheet (used here) | With `cacheComponents: true` |
| --- | --- |
| `export const revalidate = 3600` | `"use cache"; cacheLife("hours")` in the page or in `getMenu()` |
| `export const dynamic = "force-dynamic"` | No segment option. Read the request (`await cookies()`) or `await connection()` inside a `<Suspense>` |
| `fetch(url, { next: { revalidate } })` | `"use cache"` + `cacheLife` on the function doing the fetch |
| Whole-route `○`/`ƒ` | Partial prerendering: a static shell with dynamic holes, in the same route |

The docx's other Next 16 notes (`params`, `searchParams` and `cookies()`
are Promises and must be awaited, and the two-argument `revalidateTag(tag, profile)`)
are followed or not needed here.

## Streaming, and the static menu

A static page and a streamed page pull in opposite directions, and the
measurements show which one wins where. The script reads the response
chunk by chunk and records when each marker first arrives:

| `/menu` | Sidebar | Skeleton | First dish | Total |
| --- | --- | --- | --- | --- |
| `npm run dev` (rendered per request) | 57 ms, byte 3,150 | 57 ms, byte 4,271 | **949 ms**, byte 21,890 | 27.8 kB, 950 ms |
| `npm run start` (prerendered, ISR) | 65 ms, byte 1,893 | (not rendered) | **65 ms**, byte 3,113 | 19.3 kB, 66 ms |

Under dev, the Suspense boundary does exactly what the slides describe. The
shell and the fallback go out first, and the dishes are streamed into the same
response about 900 ms later. In production the wait happened during
`npm run build` (and happens in the background once an hour), so there is
nothing left to stream. The dishes come in the same response as the sidebar,
and the page is ready about 900 ms sooner than the streamed version could ever
be. That is the point of making `/menu` static: streaming is how to hide a
wait, and static rendering removes the wait.

The "throttled connection" check, in headless Chromium at 400 ms latency and
50 kB/s:

- **dev:** the sidebar was visible at 661 ms with 0 dishes and the skeleton on
  screen. The dishes appeared at 1,544 ms. Screenshot taken at that moment: the
  sidebar, *The menu* and six grey cards.
- **production:** the sidebar was visible at 563 ms, and all 13 dishes were
  already there. Nothing on this route waits, so the sidebar never appears
  without the dishes.

So the boundary is in place and works. On the production build it is unused
for `/menu` until something makes the page render on request.

## Verified

Against the production build (`npm run build && npm run start -p 3037`):

| Check | Result |
| --- | --- |
| `npm run build` | Passes; the table above. Matches STRATEGY.md row for row |
| `npm run lint` | No warnings, no errors |
| Prerendered files | `.next/server/app/menu/*.html`: 13 files, one per dish in `data/menu.json`. `menu.html` contains all 13 `class="dish"` cards |
| `curl` `/`, `/menu`, `/menu/kitfo`, `/cart`, `/checkout` | All 200 |
| `curl -I /menu`, `/menu/kitfo` | `x-nextjs-cache: HIT`, `Cache-Control: s-maxage=3600, stale-while-revalidate=…` |
| `curl -I /checkout` | `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` |
| `curl /checkout` with `Cookie: addis-eats-customer={"name":"Abebe","area":"Piassa"}` | The HTML contains *Welcome back, Abebe. Delivery to Piassa…*. With a garbage cookie: no greeting, no error |
| `curl /menu/pizza`, `/some/bad/url`, `/menu/DishList` | 404 status, not-found page |
| A dish appended to `data/menu.json` after the build (then removed) | `/menu/firfir`: 200, `MISS`, 0.99 s, then `HIT`, 5 ms. `/menu` did not list it yet (it updates in the background after an hour) |

Then in headless Chromium (playwright-core): 24 checks, all passed.

- `/menu` shows 13 dishes and the sidebar. **Drink** shows 3 and the URL becomes
  `/menu?category=Drink`.
- **Count +1** ×3, then a dish link (client-side): on `/menu/buna` the counter
  still reads 3. A `data-mark` set on the sidebar's DOM node before navigating
  is still there, so the node was not remounted. **Drink** is still selected.
- **Add to order** makes the badge read 1. **Main** on the dish page goes to
  `/menu?category=Main` with 5 dishes. The counter still reads 3.
- **Simulate a broken kitchen** shows `error.js` with *The kitchen is offline.*
  The sidebar stays visible and the counter still reads 3. **Try again**
  brings back the 5 Main dishes.
- **Cart**: the header's `data-mark` survives (the root layout persists) and
  there is no sidebar. Back to **Menu**: the counter reads 0, because the menu
  layout was unmounted and mounted again.
- Reloading `/menu?category=Dessert` restores Dessert (2 dishes).
- Cart → Checkout → order as *Abebe Bikila*, Kazanchis: the receipt appears and
  the `addis-eats-customer` cookie holds `{"name":"Abebe Bikila","area":"Kazanchis"}`.
  Add Kitfo, open `/checkout?fail=1` with a full load: *Welcome back, Abebe
  Bikila*, name and area pre-filled, and the *?fail=1 is on* notice shown.
- `/menu/pizza` shows the not-found screen.
- Console errors: only the two expected ones, the deliberate *kitchen is
  offline* throw and the 404 for `/menu/pizza`.

The same script was run against `npm run dev`, where React reports hydration
mismatches that production hides. All 24 passed, with no hydration warnings.
The 390 px wide screenshot has no horizontal scroll, and the sidebar
becomes a wrapped row above the list.

## What changed from Day 36

| File | Change |
| --- | --- |
| `app/layout.js` | Header and footer extracted to `components/SiteHeader.jsx` / `SiteFooter.jsx`. Comments now cover what the root layout owns and what persists |
| `app/menu/layout.js`, `MenuFilterProvider.jsx`, `CategorySidebar.jsx`, `LayoutCounter.jsx` | New: the nested layout and its three client pieces |
| `app/menu/page.js` | No `searchParams`, `revalidate = 3600`, and the dish list in its own async component behind `<Suspense>` |
| `app/menu/MenuBrowser.jsx` | The category comes from the layout. The broken-kitchen switch is state and throws during render |
| `app/menu/DishSkeleton.jsx` | New: the shared fallback |
| `app/menu/loading.js`, `error.js` | Use the skeleton. Retry is a plain `reset()`. Comments updated for the new roles |
| `app/menu/[id]/page.js` | `generateStaticParams` and `revalidate = 3600` |
| `app/page.js` | `revalidate = 3600` |
| `app/checkout/layout.js`, `customerCookie.js` | New: `force-dynamic`, and the cookie helpers |
| `app/checkout/page.js`, `Checkout.jsx` | The page reads the cookie. The form pre-fills from it, writes it after an order, and reads `?fail=1` itself |
| `lib/menu.js` | `getMenu()` lost its `fail` switch. `getDishSlugs()` added |
| `lib/categories.js` | New: the category list, importable from both sides |
| `app/globals.css` | Appended: the menu grid, sidebar, counter, skeleton, welcome line |

Unchanged: `CategoryBar.jsx`, `DishList.jsx`, `Dish.jsx`, `SearchBar.jsx`,
`AddToOrder.jsx`, the cart page and store, `NavTabs`, `CartBadge`,
`CartHydrator`, `useRenderCount`, `Field.jsx`, `validate.js`, `placeOrder.js`,
`data/menu.json`, `next.config.mjs` (Cache Components still off, for the
reason above).

## Files

| File | Job |
| --- | --- |
| [app/layout.js](app/layout.js) | Root shell: `<html>`, `<body>`, global CSS, header, page slot, footer |
| [components/SiteHeader.jsx](components/SiteHeader.jsx), [SiteFooter.jsx](components/SiteFooter.jsx) | The shared header (brand, badge, tabs) and footer |
| [app/page.js](app/page.js) | `/`: the specials. ISR 1 h |
| [app/menu/layout.js](app/menu/layout.js) | The menu shell: sidebar beside every `/menu` page |
| [app/menu/MenuFilterProvider.jsx](app/menu/MenuFilterProvider.jsx) | The selected category, held by the layout, mirrored to the URL |
| [app/menu/CategorySidebar.jsx](app/menu/CategorySidebar.jsx), [CategoryBar.jsx](app/menu/CategoryBar.jsx) | The category buttons |
| [app/menu/LayoutCounter.jsx](app/menu/LayoutCounter.jsx) | The proof that the layout keeps state |
| [app/menu/page.js](app/menu/page.js) | `/menu`: ISR 1 h, dish list behind Suspense |
| [app/menu/DishSkeleton.jsx](app/menu/DishSkeleton.jsx) | Fallback for the Suspense boundary and `loading.js` |
| [app/menu/MenuBrowser.jsx](app/menu/MenuBrowser.jsx), [DishList.jsx](app/menu/DishList.jsx), [Dish.jsx](app/menu/Dish.jsx), [SearchBar.jsx](app/menu/SearchBar.jsx) | Search and the list, in the browser |
| [app/menu/loading.js](app/menu/loading.js), [error.js](app/menu/error.js) | Segment-wide waiting and failure |
| [app/menu/\[id\]/page.js](app/menu/[id]/page.js) | `/menu/:id`: 13 prebuilt dish pages |
| [app/cart/page.js](app/cart/page.js) | `/cart`: client page |
| [app/checkout/layout.js](app/checkout/layout.js) | `dynamic = "force-dynamic"` for the segment |
| [app/checkout/page.js](app/checkout/page.js) | `/checkout`: reads the cookie |
| [app/checkout/customerCookie.js](app/checkout/customerCookie.js) | Writes and safely parses the returning-customer cookie |
| [app/checkout/Checkout.jsx](app/checkout/Checkout.jsx), [Field.jsx](app/checkout/Field.jsx), [validate.js](app/checkout/validate.js), [placeOrder.js](app/checkout/placeOrder.js) | The Day 33 form, its rules, the stand-in kitchen |
| [app/not-found.js](app/not-found.js) | Every kind of missing |
| [lib/menu.js](lib/menu.js), [lib/categories.js](lib/categories.js) | Server-only menu reads, and the shared category list |
| [STRATEGY.md](STRATEGY.md) | Every route, its strategy, and why |
