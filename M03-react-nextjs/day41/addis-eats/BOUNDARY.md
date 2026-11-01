# The server/client boundary: Addis Eats, component by component

Each component starts on the server. One moves to the browser only if it
holds state, handles an event, uses an effect, ref or context, or touches a
browser API. Even then, only the smallest piece that needs this moves.

**Server** means the code runs only on the server and ships no JavaScript.
**Client** means the file starts with `"use client"`, or is imported by a file
that does. The component renders on the server for the first HTML, then its
code is downloaded and it hydrates in the browser.

The mechanical check: `grep -rln '^"use client"' app components cart lib`
lists **15 files**. Three are error boundaries, which Next.js requires to be
client components. The other **12** are interactive leaves, plus the one
provider. Each has its line below.

## Client: the 12 interactive components

| File | Why it needs the browser, in one line |
| --- | --- |
| [app/providers.jsx](app/providers.jsx) | It holds the cart store in React state and context, rehydrates it from localStorage, and keeps the basket cookie in step with it. These are effects and a browser API. |
| [components/CartBadge.jsx](components/CartBadge.jsx) | It subscribes to the cart store, so it re-renders when the count changes. |
| [components/NavTabs.jsx](components/NavTabs.jsx) | `usePathname()` highlights the open tab, and a layout cannot react to the URL by itself. |
| [app/menu/MenuFilterProvider.jsx](app/menu/MenuFilterProvider.jsx) | A context provider holding the selected category, kept in sync with `?category=` by effects. |
| [app/menu/CategorySidebar.jsx](app/menu/CategorySidebar.jsx) | It handles clicks, reads the category context and navigates with `useRouter`. |
| [app/menu/FilterShell.jsx](app/menu/FilterShell.jsx) | The search term, the page, the focus ref, the broken-kitchen switch and the visible-dish context. Day 41: the search is a `useSWR` query (debounced, typed by the person), which only a browser can ask. It also exports `FilterItem`, which reads that context. |
| [app/menu/AddToCartButton.jsx](app/menu/AddToCartButton.jsx) | `onClick` writes to the cart store, and the *in order* count subscribes to it. |
| [app/cart/CartContents.jsx](app/cart/CartContents.jsx) | It reads the basket from the store, removes items on click, and calls `router.push`. |
| [app/checkout/Checkout.jsx](app/checkout/Checkout.jsx) | `useActionState` (the action's answer and `pending`), live validation state, blur and submit handlers, a focus ref and effect, and `useSearchParams`. |
| [app/login/LoginForm.jsx](app/login/LoginForm.jsx) | `useActionState`, for the error beside the phone field and the pending button. |
| [app/orders/\[id\]/CancelOrderButton.jsx](app/orders/[id]/CancelOrderButton.jsx) | `useActionState`, for *Cancelling…* and the answer. It binds the order id to the action. Day 41: it reads the order's query (the same key as the status line) to hide itself once the order leaves the kitchen. |
| [app/orders/\[id\]/OrderStatus.jsx](app/orders/[id]/OrderStatus.jsx) | Day 40. Polling `GET /api/orders/[id]` every 5 s, and `router.refresh()`. Day 41: the timer and both `useState`s are gone, replaced by `useSWR` with `refreshInterval` (in `useOrder.js`). Polling exists only in a browser. |

## Client: the 3 error boundaries

| File | Why |
| --- | --- |
| [app/menu/error.js](app/menu/error.js) | An error boundary is browser state ("has this failed?"), and Next.js passes it functions (`reset`, `retry`) that only a client component can receive. |
| [app/error.js](app/error.js) | Day 40. The same, for every route without its own boundary. It renders inside the root layout, so the header and the cart survive. |
| [app/global-error.js](app/global-error.js) | Day 40. The same, for a throw in the root layout itself. |

## Can each one be defended? Counting them honestly

The slides suggest three to five client components for an app this size.
This one has twelve. They can be grouped by what each is the leaf of:

- **The cart (4):** `Providers` holds the store, and the badge, the card
  button and the cart page read it. The slides' own list has `Providers` and
  `AddToCartButton`. A badge and a cart page are things their example app
  simply does not have.
- **The menu filter (3):** the slides' single `CategoryBar` is three files
  here. The category is *layout* state that survives a visit to a dish (Day
  37's requirement), so it needs a provider in the layout, the sidebar's
  buttons, and the shell that applies it to the server-rendered list.
- **Forms with an answer from the server (3):** checkout, sign-in and cancel.
  Each is the smallest piece holding a `useActionState`. The pages around them
  are server components.
- **The status poller (1)** and **the tabs (1).**

Day 41 added a library, SWR, and **no new client component**. The poll and
the search were already in client components (`OrderStatus`, `FilterShell`).
SWR replaced their hand-written fetching. `CancelOrderButton` was already a
client component, and it now also reads the order's query. The new files
below have no directive: they are hooks and helpers, imported only by those
components.

What Day 40 removed, because the project does not need it. These were Day 32
and Day 37 teaching instruments, not product:

| Removed | Was | Effect |
| --- | --- | --- |
| `app/menu/LayoutCounter.jsx` | A `useState` counter in the sidebar, proving the layout persists | One client component fewer. The selected category surviving a visit to a dish proves the same thing |
| `hooks/useRenderCount.js` and the *· N renders* labels in `CartBadge` and `AddToCartButton` | Day 32's render counters | Less code in two leaves that stay client anyway |

What was looked at and kept. `Checkout.jsx` is one client component, not a
server form with small client leaves. Every branch it renders (empty basket,
form, the failure box, each field's message) depends on the action's state or
on live validation. Splitting it would mean passing that state through
context to a dozen leaves, to save the markup of a heading.

## Client because a client file imports them (no directive of their own)

| File | Imported by | Note |
| --- | --- | --- |
| [app/menu/CategoryBar.jsx](app/menu/CategoryBar.jsx) | `CategorySidebar` | Day 33's buttons with an `onSelectCategory` callback, passed client → client |
| [app/menu/SearchBar.jsx](app/menu/SearchBar.jsx) | `FilterShell` | A controlled input; `onChange` is passed client → client |
| [components/Field.jsx](components/Field.jsx) | `Checkout`, `LoginForm` | Day 33's accessible field markup, carried over unchanged |
| [lib/validate.js](lib/validate.js) | `Checkout` | The shared schema. *Also* imported on the server by `lib/orders.js` and `app/actions.js`: one file, two enforcement points. No `server-only`, on purpose |
| [lib/orderStage.js](lib/orderStage.js) | `useOrder` | `isFinal()`. Also used by the receipt page, `lib/orders.js` and `cancelOrder` |
| [lib/fetcher.js](lib/fetcher.js) | `useOrder`, `useDishSearch` | Day 41. The one fetcher, throwing on a non-OK response. No Node, no secret |
| [app/orders/\[id\]/useOrder.js](app/orders/[id]/useOrder.js) | `OrderStatus`, `CancelOrderButton` | Day 41. The order's `useSWR` query and its key |
| [app/menu/useDishSearch.js](app/menu/useDishSearch.js), [useDebounce.js](app/menu/useDebounce.js) | `FilterShell` | Day 41. The search query and the debounce |
| [app/menu/Pager.jsx](app/menu/Pager.jsx) | `FilterShell` | Day 41. Links with the page in the query string; `onChoose` is passed client → client |
| [app/menu/menuUrl.js](app/menu/menuUrl.js) | `FilterShell`, `MenuFilterProvider` | Day 41. Reads and writes `?category=&q=&page=` with the history API |
| `swr` | the two hooks | The library. Its chunk is 5.7 kB gzipped (13.1 kB raw), loaded by `/menu` and the receipt only |
| [cart/basketCookie.js](cart/basketCookie.js) | `Providers` | Writes the basket cookie. The checkout page and `placeOrder` read it on the server |
| [cart/cartStore.js](cart/cartStore.js) | `Providers`, `CartBadge`, `AddToCartButton`, `CartContents` | Creates a React context, so no server component may import it, and none does |
| [lib/categories.js](lib/categories.js) | `MenuFilterProvider`, `CategorySidebar` | Plain data, safe on both sides |
| `next/link` | many | A client component that Next.js provides. A server component may render it with an `href` string |

## Server components (no JavaScript in the browser)

| Component | Why it stays on the server |
| --- | --- |
| [app/layout.js](app/layout.js) | It owns html and body and exports `metadata`, which only a server component may do. It passes children into `Providers` |
| [components/SiteHeader.jsx](components/SiteHeader.jsx), [SiteFooter.jsx](components/SiteFooter.jsx) | Markup. The header renders two client leaves. Neither reads a cookie: that would make every route dynamic |
| [app/page.js](app/page.js) | **Awaits the menu** for the three specials |
| [app/not-found.js](app/not-found.js), [app/menu/not-found.js](app/menu/not-found.js) | Markup only. The menu's one renders inside the menu layout |
| [app/menu/layout.js](app/menu/layout.js) | The sidebar's frame. It renders two client leaves inside a client provider, as children |
| [app/menu/page.js](app/menu/page.js) | **Awaits the dishes** inside a `<Suspense>`, and renders `<FilterShell index><DishList dishes /></FilterShell>`: server content passed into a client shell as children |
| [app/menu/DishList.jsx](app/menu/DishList.jsx), [Dish.jsx](app/menu/Dish.jsx) | The cards, as HTML. Each is *given* to a client `FilterItem` as children, so its code never ships |
| [app/menu/DishSkeleton.jsx](app/menu/DishSkeleton.jsx), [loading.js](app/menu/loading.js) | Fallback markup |
| [app/menu/\[id\]/page.js](app/menu/[id]/page.js) | **Awaits the dish**, uses `generateStaticParams`, and calls `notFound()` |
| [app/cart/page.js](app/cart/page.js) | The heading and frame |
| [app/checkout/page.js](app/checkout/page.js), [layout.js](app/checkout/layout.js) | The guard (`getSession()` → `redirect`), the cookies and the server-priced basket |
| [app/login/page.js](app/login/page.js) | Reads the session. Its sign-out button is a `<form action={signOut}>` with no client code at all |
| [app/orders/page.js](app/orders/page.js) | The kitchen board: **reads the order store**, markup only, no cookies, so it can stay static |
| [app/orders/\[id\]/page.js](app/orders/[id]/page.js) | **Reads the session and the order.** It decides between 404 and the receipt, and renders the two client leaves |
| [app/api/\*\*/route.js](app/api) | Route handlers are not components and never reach the browser |
| [lib/menu.js](lib/menu.js), [lib/orders.js](lib/orders.js), [lib/session.js](lib/session.js) | `import "server-only"`: `node:fs`, the order file with phone numbers, and the HMAC secret. The build fails if a client file imports any of them |
| [lib/apiError.js](lib/apiError.js), [lib/formatTime.js](lib/formatTime.js) | Used by handlers and server components only |

## What crosses the boundary, server → client

Every prop a server component passes to a client component:

| Server component | Client component | Props | Serialisable? |
| --- | --- | --- | --- |
| `app/layout.js` | `Providers` | `children` | yes, rendered elements |
| `app/menu/layout.js` | `MenuFilterProvider` | `children` | yes |
| `app/menu/layout.js` | `CategorySidebar` | none | n/a |
| `app/menu/page.js` | `FilterShell` | `index` (array of `{id, category}`; Day 41 dropped `name`, the search is the server's now), `children` | yes |
| `DishList` | `FilterItem` | `id` (number), `children` | yes |
| `Dish`, `app/menu/[id]/page.js` | `AddToCartButton` | `dish` (an object from `JSON.parse`), `label` (string) | yes |
| `SiteHeader` | `CartBadge`, `NavTabs` | none | n/a |
| `app/cart/page.js` | `CartContents` | none | n/a |
| `app/checkout/page.js` | `Checkout` | `user` (`{name, phone}`), `returningCustomer` (`{name, area}` or `null`), `basket` (`{lines, total}`) | yes |
| `app/login/page.js` | `LoginForm` | `next` (string) | yes |
| `app/orders/[id]/page.js` | `CancelOrderButton`, `OrderStatus` | `orderId` (string), `initial` (Day 41: the order as `GET /api/orders/[id]` answers it, used as `fallbackData`. It has the owner's own name, phone and area, which the receipt prints anyway, and no `userId`) | yes |
| server components | `Link` | `href`, `className`, text children | yes |

No callback crosses. Every `onClick`, `onChange`, `onSelectCategory`, `reset`
and `retry` is created on the client side of the boundary.

## The functions that do cross: server actions

A server action is the one function a client component may import from the
server. What arrives is not the function. It is an encrypted action id and a
stub that POSTs to it:

| Action ([app/actions.js](app/actions.js), `"use server"`) | Used by | What the browser gets |
| --- | --- | --- |
| `placeOrder` | `Checkout` | The id, and a stub that POSTs the form to it |
| `signIn` | `LoginForm` | The same |
| `cancelOrder` | `CancelOrderButton`, bound to an order id | The same, plus the bound id. Both are visible in the HTML, and the action checks them |
| `signOut` | `Checkout`, and the server-rendered `app/login/page.js` | The same |

`grep -r "That order is not yours" .next/static` finds nothing: the check is
not in the bundle, only the id of the endpoint that runs it. That is exactly
why it has to be a check. The id is public, and the README calls the action
with someone else's order, from the console and from curl.
