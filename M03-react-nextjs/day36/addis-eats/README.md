# Addis Eats — Day 36: Next.js & file-based routing

The Day 33 application, moved onto Next.js. The route table in `App.jsx` is
gone: every screen is a folder with a `page.js` in it, and the loading, error
and not-found states are files with reserved names. The components came across
with as few changes as possible — the ones that did change are listed at the
bottom, with the reason.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000, compiles each route on demand
npm run build      # production build — prints the route table below
npm run start      # serves that build
npm run lint
```

| Try | What happens |
| --- | --- |
| Open `/menu` | *Warming the mitad — loading the menu…* for about a second, then the dishes |
| Click **Simulate a broken kitchen** (or open `/menu?fail=1`) | The read throws on the server and `app/menu/error.js` takes over |
| Press **Try again** on that screen | `?fail=1` is dropped, the menu is read again and replaces the error |
| Type `/menu/kitfo` into the address bar | The dish page, rendered on the server from the URL alone |
| Open `/menu/pizza` | `notFound()` — the not-found screen |
| Open `/menuu/kitfo` or `/some/bad/url` | No folder claims it — the same not-found screen, with a 404 |
| Open `/menu/DishList` | Not found. The component file is not a route |
| Add dishes, refresh the page | The basket badge still shows them (localStorage) |
| Cart → **Checkout** → order with phone `0900 000 000` | The "server" rejects the number under the phone field |
| Open `/checkout?fail=1` and order | The kitchen refuses: reason shown, every value kept |

## The routes, and the file that makes each one

`npm run build`, Next.js 16.4.2:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /cart
├ ƒ /checkout
├ ƒ /menu
└ ƒ /menu/[id]


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Five routes, plus `/_not-found`, which Next.js always lists: it is
`app/not-found.js` built once as a static page. Nothing else — none of the eleven
component, helper and stylesheet files inside `app/` produced a route.

| URL | File | Rendering | Day 31 equivalent |
| --- | --- | --- | --- |
| `/` | [app/page.js](app/page.js) | ○ static — the specials are read at build time | `<Route index>` |
| `/menu` | [app/menu/page.js](app/menu/page.js) | ƒ on demand — it reads `searchParams` | `<Route path="menu">` |
| `/menu/kitfo`, `/menu/shiro`, … | [app/menu/\[id\]/page.js](app/menu/[id]/page.js) | ƒ on demand — one file, thirteen dishes | `<Route path="menu/:slug">` |
| `/cart` | [app/cart/page.js](app/cart/page.js) | ○ static shell, the cart fills in the browser | `<Route path="cart">` |
| `/checkout` | [app/checkout/page.js](app/checkout/page.js) | ƒ on demand — it reads `?fail=1` | `<Route path="checkout">` |
| anything else | [app/not-found.js](app/not-found.js) | — | `<Route path="*">` |
| *(while /menu or a dish loads)* | [app/menu/loading.js](app/menu/loading.js) | — | `<Suspense fallback>` |
| *(when the menu segment throws)* | [app/menu/error.js](app/menu/error.js) | — | `<ErrorBoundary>` |
| *(around every page)* | [app/layout.js](app/layout.js) | — | `Layout.jsx` + `<Outlet />` |

## The six requirements, and how each was met

| Requirement | How |
| --- | --- |
| Five routes as folders, each with a default-export `page.js` | `app/`, `app/menu/`, `app/menu/[id]/`, `app/cart/`, `app/checkout/` — the build table above lists exactly these |
| `/menu/[id]` reads params from props, not a hook | `export default async function DishPage({ params }) { const { id } = await params; … }`. In Next.js 15+ `params` is a Promise, so the page is `async` and awaits it |
| Menu components colocated and not routable | `DishList.jsx`, `Dish.jsx`, `CategoryBar.jsx`, `SearchBar.jsx`, `MenuBrowser.jsx` sit in `app/menu/`. `/menu/DishList` shows the not-found screen: the URL falls to `[id]`, there is no dish called "DishList", and the page calls `notFound()` |
| `loading.js` and `error.js` on the menu segment, both proven | `lib/menu.js` waits 900 ms before every menu read, so the skeleton is on screen without throttling. `/menu?fail=1` makes the read throw. `error.js` is `"use client"` and its **Try again** clears the boundary with `reset()` |
| `not-found.js`, by bad URL and by `notFound()` | `/some/bad/url` (no folder matches) and `/menu/pizza` (the dish page calls `notFound()`) both render `app/not-found.js` |
| Every navigation uses `next/link` | `grep -rn "<a[ >]" app components` finds only a comment that says not to use one. The single programmatic move — Cart's **Checkout** button — uses `useRouter().push` from `next/navigation` |

## Where the data comes from

There is no Vite mock server in Next.js, and none is needed. The menu is
[data/menu.json](data/menu.json) (copied from Day 33's `mock/menu.json`) and
[lib/menu.js](lib/menu.js) reads it with `node:fs`. Only server components
import it — the pages themselves — so the data is already in the HTML when it
reaches the browser. `useFetch` is gone, and so is every `isLoading` and `error`
flag that used to travel down to `DishList`: waiting is `loading.js`'s job now,
and failing is `error.js`'s.

| Function | Delay | Used by |
| --- | --- | --- |
| `readMenu()` | none | `/` — outside the menu segment, with no loading screen to cover a wait |
| `getMenu({ fail })` | 900 ms; throws when `fail` is true | `/menu` |
| `getDish(slug)` | 900 ms; `null` for an unknown slug | `/menu/[id]` |

The dish id in the URL is the slug (`/menu/kitfo`), as on Day 31 and as the
slides show. It arrives as a string, and the slugs are strings, so nothing
needs converting.

## Verified

Against the production build (`npm run build && npm run start -p 3036`):

| Check | Result |
| --- | --- |
| `npm run build` | Passes; lists `/`, `/cart`, `/checkout`, `/menu`, `/menu/[id]` and Next's own `/_not-found` — nothing else |
| `npm run lint` | No warnings, no errors |
| `curl` `/`, `/menu`, `/menu/kitfo`, `/cart`, `/checkout` | All 200 |
| `curl /some/bad/url` | **404**, not-found page |
| `curl /menu/nonexistent`, `/menu/DishList` | 200 with `<meta name="robots" content="noindex">` and Next's `NEXT_HTTP_ERROR_FALLBACK;404` marker; the browser shows the not-found page. See the note below on why the status is 200 |
| `curl -N /menu` | The *Warming the mitad* markup arrives at byte ~1,900 and the dish list at ~11,400, about 0.9 s later — `loading.js` is the first thing streamed |

Then driven in headless Chromium (playwright-core):

- `/menu` shows the loading text, then 13 dishes. Clicking **Drink** changes
  the URL to `/menu?category=Drink` and shows 3, with no request to the server.
- Clicking a dish name goes to `/menu/doro-wat` (client-side, through
  `next/link`). **Add to order** puts 1 item in the badge.
- `/menu/kitfo` typed directly renders Kitfo, and the badge still says 1 item
  after the full reload.
- `/menu/nonexistent`, `/menu/DishList` and `/some/bad/url` all show
  *Nothing at this address*.
- **Simulate a broken kitchen** shows `error.js` — *Could not load the menu…
  (Reference 2863077017.)*. **Try again** returns to `/menu` with 13 dishes.
  From `/menu?category=Side&fail=1` it returns to `/menu?category=Side` with 3.
- Cart → **Checkout** lands on `/checkout` via `router.push`. Submitting empty
  focuses the name field. A valid order shows *Order 1001 is in the kitchen*
  and empties the basket.
- The **Menu** tab is highlighted on `/menu`.
- No console errors other than the expected ones: the 404 for the bad URL, and
  the deliberate kitchen failure (which production React reports as error
  #441 — the server's message withheld from the browser).

The dev server was also driven through the same script, to catch hydration
warnings that production hides. That run is what found the two fixes in
`useRenderCount.js` and `SearchBar.jsx` below; after them it is clean too.

## What did not move across unchanged, and why

**Unchanged:** `CategoryBar.jsx`, `DishList.jsx`, `Field.jsx`, `validate.js`,
and `globals.css` (Day 33's `index.css` followed by `App.css`, verbatim).

**Changed only in imports.** `Dish.jsx` and `CartBadge.jsx` import `Link` from
`next/link` and write `href` where they wrote `to`; they reach the store and the
render counter through the `@/` alias, because they now sit at a different depth;
and they start with `"use client"`, because they call hooks.

**Changed because the code now runs on the server too.** This was the real
lesson of the move. Every component is rendered once on the server and then
*hydrated* in the browser, and the browser's first render must match the
server's HTML exactly. Three things from Day 33 assumed a browser:

- `cart/cartStore.js` gained `skipHydration: true`. The server has no
  localStorage and always renders an empty basket; the browser would have read
  "3 items" immediately and disagreed. Now it starts empty too, and
  [components/CartHydrator.jsx](components/CartHydrator.jsx) calls
  `persist.rehydrate()` in an effect, after hydration.
- `hooks/useRenderCount.js` answers 1 while hydrating, on both sides. The
  server is one long-lived process whose counter never resets, and StrictMode
  makes the browser's first count 2. `import.meta.env.DEV` (a Vite feature)
  became `process.env.NODE_ENV`.
- `SearchBar.jsx`'s propTypes referenced `Element`, which does not exist on
  the server. The module threw on load, and the whole menu silently fell back
  to browser-only rendering. One line now guards it.

**Split up.** Next.js server components cannot hold state or event handlers, so
Day 33's screens were divided at that line:

- `Menu.jsx` became `app/menu/page.js` (server: reads the data) plus
  `MenuBrowser.jsx` (client: category, search, focus). The category moves the
  URL with `window.history.replaceState`, which Next.js picks up in
  `useSearchParams` with no server round trip — `router.replace` would have
  re-read the menu, with its 900 ms delay, just to filter a list already in
  hand. The **Simulate a broken kitchen** checkbox became a link to
  `/menu?fail=1`, because the failure now happens on the server.
- `DishDetail.jsx` became `app/menu/[id]/page.js` (server) plus
  `AddToOrder.jsx` (the one button).
- `Checkout.jsx` moved beside its page. `?fail=1` is read by the page from its
  `searchParams` prop and passed down as `simulateFailure`.
- `Layout.jsx`'s tab bar became [components/NavTabs.jsx](components/NavTabs.jsx):
  Next.js has no `NavLink`, so the active tab comes from `usePathname`.

**Left behind**, because they are not among this exercise's five routes:

- `/login`, `RequireAuth` and `AuthProvider`. Checkout no longer asks you to
  sign in, and the "Signed in as…" line is gone.
- `/orders/:id`. A successful order now shows its receipt in place of the form
  rather than navigating to a receipt route.
- The Vite mock servers. `mock/ordersApi.js` became
  [app/checkout/placeOrder.js](app/checkout/placeOrder.js), which runs **in the
  browser** with the same delay, rules and answers (422 for `0900 000 000`,
  503 for `?fail=1`). A real endpoint would be `app/api/orders/route.js`, but
  that is a later day's topic and would add a route this exercise does not ask
  for. Until then the server-side check is a simulation, not a safeguard.
- The theme picker. The layout is "kept minimal until tomorrow"; the
  stylesheet still follows the system light/dark setting.

**`not-found.js` no longer prints the address.** Day 31's version said
*Nothing at /menuu*. Next.js builds `not-found.js` once as a static page, so
reading the path with `usePathname` made its server HTML disagree with the
browser — a hydration error. It now says *Nothing at this address*.

**`/menu/pizza` is a 200, not a 404, on the wire.** `app/menu/loading.js`
wraps the dish page too, so the loading screen has already been sent — headers
and status included — by the time the page finds there is no pizza. Headers
cannot be taken back, so Next.js renders `not-found.js` in place of the page and
adds `<meta name="robots" content="noindex">` so search engines still drop it.
A URL that matches no folder never streams, and gets a true 404. The fix, if a
real status matters, is to keep the dish page out from under the menu's
`loading.js` — for example by moving the list into a route group,
`app/menu/(list)/page.js` with its own `loading.js` — which departs from the
starter tree this exercise prescribes, so it is not done here.

**Config.** `create-next-app` 16.4 turns on `cacheComponents` and
`partialPrefetching`. Both change *when* routes render — Day 37's subject — and
the build output stops looking like the slides' ○ / ƒ table. They are switched
off in [next.config.mjs](next.config.mjs). Tailwind was declined at scaffold
time, since Day 33's own CSS is what makes it look the same. `next dev` writes
an `AGENTS.md` into the project and re-creates it if deleted; it is Next.js's
note to coding assistants, not part of the app.

## Files

| File | Job |
| --- | --- |
| [app/layout.js](app/layout.js) | Root shell: `<html>`, header, tabs, footer, `{children}` |
| [app/page.js](app/page.js) | `/` — today's three specials |
| [app/menu/page.js](app/menu/page.js) | `/menu` — reads the menu, throws on `?fail=1` |
| [app/menu/loading.js](app/menu/loading.js) | Shown while the menu segment waits |
| [app/menu/error.js](app/menu/error.js) | Shown when the menu segment throws; **Try again** |
| [app/menu/MenuBrowser.jsx](app/menu/MenuBrowser.jsx) | Category and search, in the browser |
| [app/menu/DishList.jsx](app/menu/DishList.jsx), [Dish.jsx](app/menu/Dish.jsx), [CategoryBar.jsx](app/menu/CategoryBar.jsx), [SearchBar.jsx](app/menu/SearchBar.jsx) | Day 33's menu components — not routes |
| [app/menu/\[id\]/page.js](app/menu/[id]/page.js) | `/menu/:id` — one dish, or `notFound()` |
| [app/menu/\[id\]/AddToOrder.jsx](app/menu/[id]/AddToOrder.jsx) | The dish page's only client component |
| [app/cart/page.js](app/cart/page.js) | `/cart` — a client page; `router.push("/checkout")` |
| [app/checkout/page.js](app/checkout/page.js) | `/checkout` — reads `?fail=1`, renders the form |
| [app/checkout/Checkout.jsx](app/checkout/Checkout.jsx), [Field.jsx](app/checkout/Field.jsx), [validate.js](app/checkout/validate.js), [placeOrder.js](app/checkout/placeOrder.js) | The Day 33 form, its rules, and the stand-in kitchen |
| [app/not-found.js](app/not-found.js) | Every kind of missing |
| [app/globals.css](app/globals.css) | Day 33's two stylesheets, in one file |
| [lib/menu.js](lib/menu.js) | Server-only reads of `data/menu.json` |
| [cart/cartStore.js](cart/cartStore.js) | The Day 32 Zustand store, plus `skipHydration` |
| [components/](components/) | Shared by the layout: `CartBadge`, `CartHydrator`, `NavTabs` |
| [hooks/useRenderCount.js](hooks/useRenderCount.js) | The render counter, hydration-safe |
