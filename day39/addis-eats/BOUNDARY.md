# The server/client boundary: Addis Eats, component by component

Each component starts on the server. One moves to the browser only if it
holds state, handles an event, uses an effect, ref or context, or touches a
browser API. Even then, only the smallest piece that needs this moves.

**Server** means the code runs only on the server and ships no JavaScript.
**Client** means the file starts with `"use client"`, or is imported by a file
that does. The component renders on the server for the first HTML, then its
code is downloaded and it hydrates in the browser.

Day 39 adds the one kind of function that crosses the boundary: the server
action. Its section is at the end.

## Files that carry `"use client"`: 13

`grep -rln '^"use client"' app components cart hooks lib`

| File | Why it needs the browser, in one line |
| --- | --- |
| [app/providers.jsx](app/providers.jsx) | It holds the cart store in React state and context, and rehydrates it from localStorage in an effect. |
| [components/CartBadge.jsx](components/CartBadge.jsx) | It subscribes to the cart store (a hook), so it re-renders when the count changes. |
| [components/NavTabs.jsx](components/NavTabs.jsx) | It calls `usePathname()` to highlight the open tab, and a layout cannot react to the URL by itself. |
| [app/menu/MenuFilterProvider.jsx](app/menu/MenuFilterProvider.jsx) | It is a context provider holding the selected category, and syncs it with the URL in effects. |
| [app/menu/CategorySidebar.jsx](app/menu/CategorySidebar.jsx) | It handles clicks, reads the category context and navigates with `useRouter`. |
| [app/menu/LayoutCounter.jsx](app/menu/LayoutCounter.jsx) | `useState` and `onClick`: its job is to show that the layout keeps state. |
| [app/menu/FilterShell.jsx](app/menu/FilterShell.jsx) | The search term, the focus ref, the broken-kitchen switch, and the visible-dish context. It also exports `FilterItem`, which reads that context. |
| [app/menu/AddToCartButton.jsx](app/menu/AddToCartButton.jsx) | `onClick` writes to the cart store, and the "in order" count subscribes to it. |
| [app/menu/error.js](app/menu/error.js) | An error boundary is browser state ("has this failed?"), and Next.js passes it `reset`, a function, which only a client component can receive. |
| [app/cart/CartContents.jsx](app/cart/CartContents.jsx) | It reads the basket from the store, removes items on click, and calls `router.push`. |
| [app/checkout/Checkout.jsx](app/checkout/Checkout.jsx) | `useActionState` (the action's answer and `pending`), live validation state, blur and submit handlers, a focus ref and effect, `useSearchParams`. Every branch it renders depends on that state. Since Day 39 it no longer reads the cart store: the basket arrives as a prop from the server. |
| [app/login/LoginForm.jsx](app/login/LoginForm.jsx) | Day 39. `useActionState` for the error beside the phone field and the pending button. The page around it is a server component. |
| [app/orders/\[id\]/CancelOrderButton.jsx](app/orders/[id]/CancelOrderButton.jsx) | Day 39. `useActionState` for "Cancelling…" and the answer; it binds the order id to the action. The receipt around it is a server component. |

Day 38 had 11; Day 39's two are the leaves of new pages, each the smallest
piece that holds a `useActionState`. Nothing that was server moved to the
client.

Day 37 had 12 such files. On Day 38 the count barely moved: one directive
disappeared (`AddToOrder.jsx` merged into `AddToCartButton.jsx`), `Providers`
replaced `CartHydrator`, and four directives moved lower:

| Day 37 directive on | Day 38 directive on | What went back to the server |
| --- | --- | --- |
| `app/menu/MenuBrowser.jsx` (imported `DishList`, `Dish`, `SearchBar`) | `app/menu/FilterShell.jsx` (imports only `SearchBar`) | `DishList` and every `Dish` card |
| `app/menu/Dish.jsx` (the whole card) | `app/menu/AddToCartButton.jsx` | The card's name, link, price, description and spicy tag |
| `app/cart/page.js` (the whole page) | `app/cart/CartContents.jsx` | The page and its heading |
| `app/menu/[id]/AddToOrder.jsx` | `app/menu/AddToCartButton.jsx` (shared) | Nothing new. One leaf instead of two copies |
| `components/CartHydrator.jsx` | `app/providers.jsx` | Nothing new. The same effect now lives in the provider |

The slides suggest three or four directives for an app this size. This app has
thirteen because it also has a sidebar counter, a layout-level filter, a
per-card render counter, a cart page, a full checkout form and, since Day 39,
two small forms with pending states. Each of those
needs the browser. The test is not the count but whether each directive sits
on the smallest piece, and the table above makes that claim per file.

## Client because a client file imports them (no directive of their own)

| File | Imported by | Note |
| --- | --- | --- |
| [app/menu/CategoryBar.jsx](app/menu/CategoryBar.jsx) | `CategorySidebar` | Day 33's buttons with an `onSelectCategory` callback. The callback is passed client → client, which is fine |
| [app/menu/SearchBar.jsx](app/menu/SearchBar.jsx) | `FilterShell` | A controlled input. `onChange` comes from `FilterShell`, also client → client |
| [components/Field.jsx](components/Field.jsx) | `Checkout`, `LoginForm` | Moved from `app/checkout/` on Day 39: two routes use it now |
| [lib/validate.js](lib/validate.js) | `Checkout` | The Day 33 rules. *Also* imported on the server by `lib/orders.js` and `app/actions.js`: one file, two enforcement points. No `server-only`, on purpose |
| [cart/basketCookie.js](cart/basketCookie.js) | `Providers` | Writes the basket cookie. Also imported by the checkout page and `placeOrder`, which read it |
| [cart/cartStore.js](cart/cartStore.js) | `Providers`, `CartBadge`, `AddToCartButton`, `CartContents` | Creates a React context, so it must never be imported by a server component, and none does |
| [hooks/useRenderCount.js](hooks/useRenderCount.js) | `CartBadge`, `AddToCartButton` | A hook |
| [lib/categories.js](lib/categories.js) | `MenuFilterProvider`, `CategorySidebar` | Plain data, safe on both sides |
| `next/link` | many | A client component that Next.js provides. A server component may render it and pass it an `href` string |

## Server components (no JavaScript in the browser)

| Component | Why it stays on the server |
| --- | --- |
| [app/layout.js](app/layout.js) | It owns html/body and exports `metadata`, which only a server component may do. It passes children into `Providers` and imports no other client file |
| [components/SiteHeader.jsx](components/SiteHeader.jsx) | The brand link and tagline are markup. It renders two client leaves, `CartBadge` and `NavTabs` |
| [components/SiteFooter.jsx](components/SiteFooter.jsx) | Markup only |
| [app/page.js](app/page.js) | An async component that reads the menu file for the three specials. No interactivity |
| [app/not-found.js](app/not-found.js) | Markup only |
| [app/menu/layout.js](app/menu/layout.js) | The sidebar's frame (aside, heading, grid). It renders three client leaves |
| [app/menu/page.js](app/menu/page.js) | The page and its async `Dishes` component **await the menu on the server**. It renders `<FilterShell index={…}><DishList dishes={dishes} /></FilterShell>`: server content passed into a client shell as children |
| [app/menu/DishList.jsx](app/menu/DishList.jsx) | The list is markup from data. Each item is wrapped in a client `FilterItem` that is *given* the card as children, so the card's code never moves |
| [app/menu/Dish.jsx](app/menu/Dish.jsx) | Name, link, price, description, tag: markup from data. Its one interactive part is `AddToCartButton` |
| [app/menu/DishSkeleton.jsx](app/menu/DishSkeleton.jsx), [loading.js](app/menu/loading.js) | Fallback markup, sent in the first bytes |
| [app/menu/\[id\]/page.js](app/menu/[id]/page.js) | **An async server component** that awaits the dish, calls `notFound()`, and uses `generateStaticParams`. It renders one client leaf, the button |
| [app/cart/page.js](app/cart/page.js) | The heading and frame. `CartContents` does the rest |
| [app/checkout/page.js](app/checkout/page.js), [layout.js](app/checkout/layout.js) | The guard (`getSession()` → `redirect`), the cookies and the basket's prices can only be read on the server. `force-dynamic` is segment config. [customerCookie.js](app/checkout/customerCookie.js) beside them is read here and written by `placeOrder` |
| [app/login/page.js](app/login/page.js) | Reads the session; renders the sign-out form (a `<form action={signOut}>` with no client code at all) and the `LoginForm` leaf |
| [app/orders/page.js](app/orders/page.js) | The kitchen board: reads the order file, markup only. Must stay free of cookies to stay static |
| [app/orders/\[id\]/page.js](app/orders/[id]/page.js) | Reads the session and the order, decides 404 or receipt, renders one client leaf |
| [app/api/\*/route.js](app/api) | Route handlers are not components and never reach the browser |
| [lib/orders.js](lib/orders.js), [lib/session.js](lib/session.js) | `server-only`: the order file (phone numbers) and the session's HMAC secret |
| [lib/apiError.js](lib/apiError.js), [lib/formatTime.js](lib/formatTime.js) | Used by handlers and server components only |
| [lib/menu.js](lib/menu.js) | Reads files with `node:fs`. `import "server-only"` makes the build fail if a client file ever imports it (tested: *You're importing a module that depends on "server-only"*) |

## What crosses the boundary, server → client

Every prop a server component passes to a client component, checked by reading
each server file above:

| Server component | Client component | Props | Serialisable? |
| --- | --- | --- | --- |
| `app/layout.js` | `Providers` | `children` (rendered elements) | yes, JSX |
| `app/menu/layout.js` | `MenuFilterProvider` | `children` | yes |
| `app/menu/layout.js` | `CategorySidebar`, `LayoutCounter` | none | n/a |
| `app/menu/page.js` | `FilterShell` | `index` (array of `{id, name, category}`), `children` | yes |
| `DishList` | `FilterItem` | `id` (number), `children` | yes |
| `Dish`, `app/menu/[id]/page.js` | `AddToCartButton` | `dish` (an object from `JSON.parse`), `label` (string) | yes |
| `SiteHeader` | `CartBadge`, `NavTabs` | none | n/a |
| `app/cart/page.js` | `CartContents` | none | n/a |
| `app/checkout/page.js` | `Checkout` | `user` (`{name, phone}`), `returningCustomer` (`{name, area}` or `null`), `basket` (`{lines, total}`) | yes |
| `app/login/page.js` | `LoginForm` | `next` (string) | yes |
| `app/orders/[id]/page.js` | `CancelOrderButton` | `orderId` (string) | yes |
| server components | `Link` | `href`, `className`, text children | yes |

No function crosses. Every callback (`onSelectCategory`, `onChange`, `onClick`,
`reset`) is created on the client side of the boundary. Day 37's `DishList`
received `onRetry` from `MenuBrowser`. That was fine while both were client,
but a server `DishList` could not accept it, so the prop was removed along with
the states it served.

## Day 39: the functions that do cross

Day 38's rule was that no function crosses from server to client. A server
action is the exception, and it is not really a function when it arrives:

| Action ([app/actions.js](app/actions.js), `"use server"`) | Imported by (client) | What the browser actually gets |
| --- | --- | --- |
| `placeOrder` | `Checkout` | An encrypted action id and a stub that POSTs the form to it |
| `signIn` | `LoginForm` | The same |
| `cancelOrder` | `CancelOrderButton`, bound to an order id | The same, plus the bound id — visible in the HTML, and checked by the action |
| `signOut` | `Checkout`; also rendered by the server `app/login/page.js` | The same |

The bodies stay on the server. `grep -r "That order is not yours" .next/static`
finds nothing: the check is not in the bundle, only the id of the endpoint
that runs it. That is also why it has to be a check: the id is public, and
anyone can call it with any arguments (the README does, from the console and
from curl).
