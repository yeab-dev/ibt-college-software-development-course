# Addis Eats — Day 38: server & client components

The Day 37 application, with every component placed on purpose. Data is read
in async server components. `"use client"` sits only on the leaves that need
the browser. The cart store lives in a `Providers` client component that the
server layout wraps around everything. The dish list is server-rendered and
passed into a client `FilterShell` as children, so neither `DishList` nor
`Dish` ships any code to the browser. The application behaves the same as
before; what changed is what the browser downloads.
[BOUNDARY.md](BOUNDARY.md) lists every component, its side, and why.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (route table below)
npm run start      # serves that build; use it for the bundle measurements
npm run lint
```

Everything in Day 37's *Try* table still works and was re-tested (see
Verified). Additions worth trying:

| Try | What happens |
| --- | --- |
| DevTools → Sources on `/menu`, search the `_next/static/chunks` files for `dish__head` | Nothing found. The dish card's code is not in the browser |
| Type `tibs` in the search box | One card left. The other twelve are still in the DOM, `hidden`. The browser filtered server HTML and rendered no dish |
| Add Doro Wat twice | Its button shows *2 in order*. Shiro's render count does not change: only the leaf that subscribes re-renders |
| Import `@/lib/menu` into any `"use client"` file and build | The build fails: *You're importing a module that depends on "server-only"* |

## Route table

`npm run build`, Next.js 16.4.2. Identical to Day 37. The boundary work
changed what ships, not when anything renders:

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
```

## The seven exercises, and where each one landed

| Exercise | Where |
| --- | --- |
| 1. Menu page as an async server component that awaits its dishes | [app/menu/page.js](app/menu/page.js): `async function Dishes() { const dishes = await getMenu(); … }`. It sits in its own component, below a synchronous `MenuPage`, only so that Day 37's Suspense boundary wraps exactly the slow part. The dish page, [app/menu/\[id\]/page.js](app/menu/[id]/page.js), is `async` itself |
| 2. Delete the `useFetch` hook and its loading and error state | `useFetch` has been gone since Day 36, when the app moved to Next.js. Today the last remains went too: `DishList`'s `isLoading`, `error` and `onRetry` props, and the loading and error branches they fed. `grep -rn "useFetch\|fetch("` finds nothing. The only `useEffect`s left are not fetching: cart rehydration, search-box focus, and URL sync |
| 3. List every file with `"use client"` | 12 on Day 37, 11 now. Both lists are in [BOUNDARY.md](BOUNDARY.md) |
| 4. Move each directive down to the smallest component that needs it | `Dish.jsx` → `AddToCartButton.jsx`. `MenuBrowser.jsx` (which imported the whole list) → `FilterShell.jsx` (which imports only `SearchBar`). `app/cart/page.js` → `CartContents.jsx` |
| 5. Extract the cart provider into its own client `Providers` component | [app/providers.jsx](app/providers.jsx), rendered by [app/layout.js](app/layout.js) around the shell. The layout stays a server component: it still exports `metadata` |
| 6. Wrap the server `DishList` in a client `FilterShell` using children | `<FilterShell index={index}><DishList dishes={dishes} /></FilterShell>` in `page.js`. `FilterShell.jsx` never imports `DishList` |
| 7. Record First Load JS for `/menu` before and after | [Below](#first-load-js-for-menu-before-and-after) |

| Mini-project requirement | Met by |
| --- | --- |
| Menu and dish routes as async server components with no fetching hooks | Exercises 1 and 2 |
| Every `"use client"` on the smallest component that needs it | BOUNDARY.md, one line per file |
| `Providers` client component wrapping children, `layout.js` still on the server | Exercise 5 |
| At least one client shell receiving server-rendered content through children | `FilterShell` ← `DishList`. Also `FilterItem` ← each `Dish`, `Providers` ← the whole app, and `MenuFilterProvider` ← the menu segment |
| No callback props passed from a server component to a client one | BOUNDARY.md's last table lists every server → client prop. None is a function |
| BOUNDARY.md | [BOUNDARY.md](BOUNDARY.md) |
| Before and after First Load JS for `/menu` | The next section |

## First Load JS for `/menu`, before and after

**Method.** Next.js 16's `next build` no longer prints a *First Load JS* column
(compare the table above with the one in the slides). So this measures what
the browser actually has to download, using a production build served by
`next start` on a cold load:

1. **The page's own script list.** Take every `<script src>` in the `/menu` HTML
   and leave out the `noModule` polyfill chunk, which modern browsers never
   fetch. Sum each chunk's size raw, and as served on the wire, gzip as
   `next start` sends it (fetched with `curl -H "Accept-Encoding: gzip"`). This
   is what *First Load JS* used to mean: everything needed before the page can
   hydrate.
2. **A cross-check in Chromium.** headless Chromium via playwright-core,
   cold cache: the sum of encoded body bytes for every `script` request until
   network idle. This also counts two tiny chunks that load after the page,
   for link prefetching.

"Before" is the committed Day 37 build (`day37/addis-eats-next`, port 3037).
"After" is this one (port 3038). Same machine, same Next.js.

| `/menu` | Scripts | Raw | **Gzip (First Load JS)** | Chromium, all scripts |
| --- | --- | --- | --- | --- |
| Day 37 (before) | 9 | 464.7 kB | **140.1 kB** | 141.3 kB (11 requests) |
| Day 38 (after) | 9 | 464.2 kB | **139.9 kB** | 141.5 kB (11 requests) |

**Down, but only just: 0.5 kB raw, 0.2 kB gzipped.** Per chunk, it is clearer
where the bytes went:

| Chunk | Before (raw / gzip) | After (raw / gzip) | Change |
| --- | --- | --- | --- |
| Unchanged chunks: React, the Next.js runtime and router (6 chunks, identical hashes before and after) | 432.6 / 129.3 kB | 432.6 / 129.3 kB | none |
| The menu's own client code (2 chunks) | 6,842 / 2,881 B | 5,248 / 2,248 B | **−1,594 / −633 B** |
| Shared app chunk (cart store, badge, tabs) | 26,009 / 8,128 B | 27,048 / 8,590 B | +1,039 / +462 B |

- **What the boundary saved.** The menu's own code lost `DishList`, `Dish`,
  and `MenuBrowser`'s list rendering. That is −1.6 kB raw, −23 % of the
  route's own JavaScript. The proof is in the chunks themselves. Day 37's menu
  chunk contains `dish__head`, `dish__note` and *This part of the kitchen is
  empty today*. In Day 38 no `/menu` chunk contains `dish__head` or
  `dish__note`, so the card markup is not shipped. The empty-state text is
  still there because it moved, on purpose, into `FilterShell`.
- **What paid some of it back.** The per-request cart store (`createStore` +
  `useStore` + a React context, instead of Zustand's `create`) costs about 1 kB
  in the chunk every page loads. `/cart` shows that cost alone: 137.1 → 137.6 kB
  gzip.
- **Why the total hardly moves.** 129 kB of the 140 kB is React and the
  Next.js runtime, which every page needs whatever the app does. The
  components that could move were small: thirteen cards of plain markup are
  about 1.5 kB of code. The slides' *"FilterShell ships ~2 kB, DishList ships
  nothing"* holds here: `FilterShell`, `SearchBar`, `FilterItem` and
  `AddToCartButton` together are 2.9 kB raw, 1.2 kB gzip.
- **What went up instead: the HTML.** `/menu`'s document grew from 19.3 kB to
  28.2 kB raw (4.0 → 4.7 kB gzip). A server component's output still has to
  reach the browser for client navigations, so the RSC payload inlined in the
  page now describes thirteen rendered cards. Day 37's payload was a JSON array
  that the browser turned into cards itself. Bytes moved from "code to run" to
  "data to read". The gain is that the browser no longer runs the card
  rendering code at all. Each card is HTML the browser only parses; just its
  button hydrates.

## Is `DishList` shipped to the browser?

No, and three checks agree:

1. **The chunks.** As above, no JavaScript file the `/menu` page loads contains
   the card's class names (`dish__head`, `dish__note`). On Day 37, chunk
   `2unq5zf-fvj_u.js` did.
2. **The import graph.** `DishList.jsx` and `Dish.jsx` have no directive. Their
   only importers are `page.js` and `DishList.jsx`, both server components.
   `FilterShell.jsx` receives `children` and never imports either one.
3. **The behaviour.** Typing in the search box hides cards with the `hidden`
   attribute (`FilterItem`) and never re-renders a card. Shiro's render count
   on its button stays put while Doro Wat is added, in the browser test below.

## Decisions worth explaining

**Filtering server HTML without shipping it.** If `FilterShell` renders the
list, it needs the list's code. Instead, `FilterShell` takes two things from
the page: `index`, a small array of `{ id, name, category }`, from which it
works out which ids are visible; and `children`, the finished list. It puts the
set of visible ids in context. `DishList` (server) wraps each card in
`FilterItem`, an 8-line client component that reads the context and renders
`<li hidden>` around the card it was handed. The cards are composed on the
server and placed by the client. Day 33's empty states ("No dish here
matches…") had to move from `DishList` to `FilterShell`, because only the
browser knows what was typed.

**The card split at its one interactive part.** The Add button, the *in order*
count and the render counter all read the store, so they became
`AddToCartButton.jsx`. Everything else on the card returned to the server. The
dish page had its own copy of the same button (`AddToOrder.jsx`), which is now
the same leaf with `label="Add to order"`. On the dish page it therefore also
shows *in order* and the render count, as the cards do.

**Providers, and why the store moved into it.** The course's pattern is
`<Providers><CartProvider>{children}</CartProvider></Providers>`. Day 32
replaced the context cart with a Zustand store, which needs no provider:
`create()` makes one store when the module loads. That is one cart per tab in
the browser. On the server it is one cart for every request the process ever
renders. It never leaked here, because the server only ever renders the
empty cart, but that was luck. Zustand's Next.js guidance is a store factory
plus a context provider, so each server render and each tab gets its own
store. So `cart/cartStore.js` now exports `createCartStore()`, a context, and a
`useCartStore(selector)` hook with the same signature as before. None of the
five components that read the cart changed a line. `app/providers.jsx`
creates the store once per mount and does what `CartHydrator.jsx` used to do:
rehydrating from localStorage after hydration. `CartHydrator.jsx` is deleted.

**The checkout form stays one client component.** `Checkout.jsx` keeps its
directive at the top. Every branch it renders (receipt, empty basket, form)
depends on the store or the form state, including the headings. Splitting off
a server `<h2>` would save almost nothing and break the Day 33 form's
structure. The page around it is a server component and does the one
server-only job, reading the cookie.

**`/cart`'s page went back to the server.** Its heading and frame are server
markup, and `CartContents.jsx` carries the directive. The route is `○` either
way: the basket is in localStorage, so there is nothing for the server to read.

**`server-only` on `lib/menu.js`.** The file has always said in a comment that
only server components may import it. Now the build enforces it. This was
tested by importing it into `LayoutCounter.jsx`: the build failed with
*You're importing a module that depends on "server-only"*. The import was then
removed. The package ships with Next.js; nothing was installed.

## Check yourself

| Question | Answer |
| --- | --- |
| How many files contain `"use client"`? Can you justify each? | 11. Each has its one-line justification in BOUNDARY.md. (The slides suggest three or four; this app also has a layout filter, a sidebar counter, per-card render counters and a checkout form, and each of those needs the browser.) |
| Does the menu page still work with every fetching hook deleted? | Yes. No `useFetch`, no fetching effect, no `isLoading`/`error` props anywhere. 31 browser checks pass |
| Is `DishList` shipped to the browser, and can you prove it? | No. See the three checks above |
| Did First Load JS for `/menu` go down? | Yes, from 140.1 to 139.9 kB gzip. The menu's own code fell 23 %, the per-request cart store added 0.5 kB to the shared chunk, and 129 kB is framework |
| Does `layout.js` import anything that carries the directive? | One file, `./providers`, as the pattern intends. A server component may import a client component; that marks an entry into the client and does not make the layout client. The layout still exports `metadata`, which the build allows only in server components. Its other imports, `SiteHeader` and `SiteFooter`, are server components |
| Why does `error.js` need `"use client"`? | An error boundary keeps state that only the browser has ("did something below me throw?"), and Next.js hands it `reset`, a function, which can be a prop only of a client component |

## Verified

Against the production build (`npm run build && npm run start -p 3038`):

| Check | Result |
| --- | --- |
| `npm run build` | Passes; the route table above, identical to Day 37 |
| `npm run lint` | No warnings, no errors |
| `grep -rln '^"use client"' app components cart hooks lib` | 11 files, as listed in BOUNDARY.md |
| `curl` `/`, `/menu`, `/menu/kitfo`, `/cart`, `/checkout` | All 200 |
| `curl` `/menu/pizza`, `/menu/DishList`, `/some/bad/url` | All 404 |
| `curl /checkout` with a customer cookie | The HTML contains *Welcome back, Abebe* |
| First Load JS, both builds | The tables above, from the method described |
| `server-only` guard | Importing `lib/menu.js` from a client file fails the build (then reverted) |

Then in headless Chromium (playwright-core): 31 checks, all passed. These are
Day 37's 24 checks, which were re-run (sidebar counter and DOM node survive
`/menu` → dish; category kept in the layout and mirrored to the URL;
`error.js` inside the layout with the sidebar intact; *Try again*; the menu
layout unmounts on `/cart` and the header persists; reload restores
`?category=Dessert`; order → cookie → *Welcome back* with the name and area
pre-filled; `?fail=1`; `/menu/pizza`). Seven are new:

- Search `tibs` → 1 visible card. `zzz` → 0 and *No dish here matches “zzz”.*
  **Clear** → 13.
- **Add** ×2 on Doro Wat's card → *2 in order*, badge +2. Shiro's render
  count is unchanged (`2 renders` → `2 renders`).
- `/cart` after a full reload lists the basket (2 lines). **Remove one Doro
  Wat** leaves 1 ×.
- Console errors: only the expected two, the deliberate *kitchen is offline*
  throw and the 404 for `/menu/pizza`.

The same 31 checks were run against `npm run dev`. All passed, with no
hydration warnings and no *Functions cannot be passed directly to Client
Components* errors. The dev server logged one *The destination stream errored
while writing data*. This comes from the test leaving `/menu` before its
900 ms stream had finished, which is a client abort. The Day 37 dev run logged
the same. Streaming still works under dev: sidebar and skeleton at 94 ms,
dishes at 1,034 ms.

## What changed from Day 37

| File | Change |
| --- | --- |
| `app/providers.jsx` | New: the cart store's provider and rehydration |
| `components/CartHydrator.jsx` | Deleted; its effect is in `Providers` |
| `cart/cartStore.js` | `create` → `createCartStore()` + context + `useCartStore(selector)` (same call signature) |
| `app/layout.js` | `<Providers>` around the shell; comment on what it imports |
| `app/menu/page.js` | Renders `<FilterShell index><DishList/></FilterShell>` |
| `app/menu/FilterShell.jsx` | New (replaces `MenuBrowser.jsx`): search, broken-kitchen switch, empty states, visibility context, `FilterItem` |
| `app/menu/DishList.jsx` | Server; only `dishes` remain as props; items wrapped in `FilterItem` |
| `app/menu/Dish.jsx` | Server; directive and store hooks removed |
| `app/menu/AddToCartButton.jsx` | New: the card's (and dish page's) interactive leaf |
| `app/menu/[id]/page.js` | Uses `AddToCartButton`; `AddToOrder.jsx` deleted |
| `app/cart/page.js`, `CartContents.jsx` | Directive moved from the page to the contents |
| `lib/menu.js` | `import "server-only"` |
| `components/SiteHeader.jsx`, `SiteFooter.jsx`, `CartBadge.jsx`, `app/globals.css` | Tagline, footer text, a comment, one rule for the dish page's button |

## Files

| File | Side | Job |
| --- | --- | --- |
| [app/layout.js](app/layout.js) | server | Root shell; wraps it in `Providers` |
| [app/providers.jsx](app/providers.jsx) | client | The cart store, per mount, rehydrated after hydration |
| [components/SiteHeader.jsx](components/SiteHeader.jsx), [SiteFooter.jsx](components/SiteFooter.jsx) | server | Shared header and footer |
| [components/CartBadge.jsx](components/CartBadge.jsx), [NavTabs.jsx](components/NavTabs.jsx) | client | The header's two interactive leaves |
| [app/page.js](app/page.js) | server | `/`: the specials |
| [app/menu/layout.js](app/menu/layout.js) | server | Menu shell with the sidebar |
| [app/menu/MenuFilterProvider.jsx](app/menu/MenuFilterProvider.jsx), [CategorySidebar.jsx](app/menu/CategorySidebar.jsx), [LayoutCounter.jsx](app/menu/LayoutCounter.jsx) | client | The layout's state, its buttons, its counter |
| [app/menu/page.js](app/menu/page.js) | server | `/menu`: awaits the dishes, composes shell and list |
| [app/menu/FilterShell.jsx](app/menu/FilterShell.jsx) | client | Search and visibility around server content |
| [app/menu/DishList.jsx](app/menu/DishList.jsx), [Dish.jsx](app/menu/Dish.jsx) | server | The cards, as HTML |
| [app/menu/AddToCartButton.jsx](app/menu/AddToCartButton.jsx) | client | Add, *in order*, render count |
| [app/menu/DishSkeleton.jsx](app/menu/DishSkeleton.jsx), [loading.js](app/menu/loading.js) | server | Fallbacks |
| [app/menu/error.js](app/menu/error.js) | client | The segment's error boundary |
| [app/menu/\[id\]/page.js](app/menu/[id]/page.js) | server | `/menu/:id`: 13 prebuilt dish pages |
| [app/cart/page.js](app/cart/page.js) / [CartContents.jsx](app/cart/CartContents.jsx) | server / client | `/cart` |
| [app/checkout/page.js](app/checkout/page.js), [layout.js](app/checkout/layout.js) / [Checkout.jsx](app/checkout/Checkout.jsx) | server / client | `/checkout` |
| [lib/menu.js](lib/menu.js) | server only | Menu reads, guarded by `server-only` |
| [BOUNDARY.md](BOUNDARY.md), [STRATEGY.md](STRATEGY.md) | — | Today's boundary map; Day 37's rendering strategy (still accurate) |
