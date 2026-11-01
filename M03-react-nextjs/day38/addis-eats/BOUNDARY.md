# The server/client boundary: Addis Eats, component by component

Each component starts on the server. One moves to the browser only if it
holds state, handles an event, uses an effect, ref or context, or touches a
browser API. Even then, only the smallest piece that needs this moves.

**Server** means the code runs only on the server and ships no JavaScript.
**Client** means the file starts with `"use client"`, or is imported by a file
that does. The component renders on the server for the first HTML, then its
code is downloaded and it hydrates in the browser.

## Files that carry `"use client"`: 11

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
| [app/checkout/Checkout.jsx](app/checkout/Checkout.jsx) | A controlled form: state for every field, handlers, refs, `flushSync`, `useSearchParams`. Every part of what it renders depends on that state. |

Day 37 had 12 such files. The count barely moved: one directive
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
eleven because it also has a sidebar counter, a layout-level filter, a
per-card render counter, a cart page and a full checkout form. Each of those
needs the browser. The test is not the count but whether each directive sits
on the smallest piece, and the table above makes that claim per file.

## Client because a client file imports them (no directive of their own)

| File | Imported by | Note |
| --- | --- | --- |
| [app/menu/CategoryBar.jsx](app/menu/CategoryBar.jsx) | `CategorySidebar` | Day 33's buttons with an `onSelectCategory` callback. The callback is passed client → client, which is fine |
| [app/menu/SearchBar.jsx](app/menu/SearchBar.jsx) | `FilterShell` | A controlled input. `onChange` comes from `FilterShell`, also client → client |
| [app/checkout/Field.jsx](app/checkout/Field.jsx), [validate.js](app/checkout/validate.js), [placeOrder.js](app/checkout/placeOrder.js), [customerCookie.js](app/checkout/customerCookie.js) | `Checkout` | `validate.js`'s `AREAS` and `customerCookie.js`'s parser are *also* imported by the server page. Plain modules can be on both sides |
| [cart/cartStore.js](cart/cartStore.js) | `Providers`, `CartBadge`, `AddToCartButton`, `CartContents`, `Checkout` | Creates a React context, so it must never be imported by a server component, and none does |
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
| [app/checkout/page.js](app/checkout/page.js), [layout.js](app/checkout/layout.js) | `await cookies()` can only run on the server. `force-dynamic` is segment config |
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
| `app/checkout/page.js` | `Checkout` | `returningCustomer` (`{name, area}` or `null`) | yes |
| server components | `Link` | `href`, `className`, text children | yes |

No function crosses. Every callback (`onSelectCategory`, `onChange`, `onClick`,
`reset`) is created on the client side of the boundary. Day 37's `DishList`
received `onRetry` from `MenuBrowser`. That was fine while both were client,
but a server `DishList` could not accept it, so the prop was removed along with
the states it served.
