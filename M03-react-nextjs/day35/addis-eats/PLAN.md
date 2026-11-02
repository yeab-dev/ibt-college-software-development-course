# PLAN — the mini-project, planned on paper

Day 35's four planning exercises, written for the build that is actually in
this folder rather than for an empty one. The plan was drawn after the code
this time, because the code already existed from Days 26–34. That made it an
audit: each place where the code and the sketch disagreed was either a gap to
close (see the README) or a decision to write down.

## 1. The component tree, with ownership

**owns** is state that lives in that component. **receives** is props.
**reads** is something that comes from outside the tree: the URL, a context or
the store.

```
App                         owns nothing; arranges providers, router, boundaries
└─ ErrorBoundary "app"      the last resort, outside the router
   └─ AuthProvider          owns: user, loading            → AuthContext
      └─ ThemeProvider      owns: theme                    → ThemeContext
         └─ BrowserRouter
            └─ Layout       reads: auth (user, signOut), pathname
               │            header, nav, <Outlet />, footer
               ├─ ThemePicker      reads: theme context
               ├─ CartBadge        reads: store → item count
               └─ ErrorBoundary "page"   receives: resetKey = pathname
                  ├─ Home          owns: specials (fetched)
                  ├─ /menu
                  │  ├─ ErrorBoundary "menu"
                  │  │  └─ Menu    reads: category (URL ?category=)
                  │  │     │       owns: dishes (fetched), search, the two demo
                  │  │     │             switches, a ref to the search input
                  │  │     ├─ CategoryBar  receives: categories, selectedCategory, onSelectCategory
                  │  │     ├─ SearchBar    receives: value, onChange, ref
                  │  │     └─ DishList     receives: dishes, isLoading, error, searchTerm, category, onRetry
                  │  │        └─ Dish      receives: dish
                  │  │           │         reads: store → its own quantity, addItem
                  │  │           │         owns: showDetails (is the modal open)
                  │  │           └─ Modal  receives: title, onClose, children  (portal → #modal-root)
                  │  └─ ErrorBoundary "cart-panel"
                  │     └─ CartPanel       reads: store → items, total
                  ├─ DishDetail    reads: :slug   owns: dish (fetched)   reads: store → addItem
                  ├─ Cart          reads: store → items, total, removeItem
                  ├─ Suspense → RequireAuth (reads: auth) → Checkout   [lazy]
                  │                owns: form, touched, submitting, serverErrors, failure
                  │                reads: store → items, total, clear; ?fail=
                  │  └─ Field ×4   receives: name, label, hint, error, value, onChange, onBlur
                  ├─ Suspense → Receipt                                  [lazy]
                  │                reads: :id   owns: order (fetched)
                  ├─ Login         owns: phone   reads: location.state.from
                  └─ NotFound      reads: pathname
```

What the drawing settled:

- **Nothing is owned twice.** Every row that says *owns* is the only place
  that piece of state exists. Everything else reads it or receives it.
- **Leaves receive, they do not own,** apart from two cases where owning is
  right. `Dish` owns `showDetails` because no other component cares whether
  that dialog is open. `Field` owns nothing: `Checkout` holds the values and
  each Field is a pure function of its props.
- **The store skips the middle.** `CartBadge`, `CartPanel`, `Dish`, `Cart`,
  `DishDetail` and `Checkout` all read the cart, and none of them gets it as a
  prop. No component passes it through to another.

## 2. Where state lives

One line per piece of state, as the brief asks. *Who reads* and *who
changes* decide the place: the lowest component that contains all of them, or
somewhere outside the tree when nothing in it is low enough.

| State | Who reads / who changes | Where it lives | Why there |
| --- | --- | --- | --- |
| Selected category | Menu, CategoryBar / CategoryBar via Menu | **The URL**, `?category=Drink` ([Menu.jsx](src/menu/Menu.jsx)) | Shareable, bookmarkable, survives a refresh and the Back button |
| Search term | Menu, SearchBar, DishList / SearchBar | `useState` in **Menu** | Half-typed text is not an address. Menu is the lowest parent of the input and the list |
| Fetched dishes | DishList (via Menu) | **Menu**, through `useFetch` | Only the screen that shows them needs them. A second copy in a store would go stale |
| One dish | DishDetail | **DishDetail**, through `useFetch` | Read from `:slug`, so a cold load or a shared link works |
| Today's specials | Home | **Home**, through `useFetch` | Same reasoning, its own request |
| The order (cart lines) | badge, panel, cards, Cart, DishDetail, Checkout / cards, DishDetail, Cart, Checkout | **Zustand store** ([cartStore.js](src/cart/cartStore.js)), persisted | Read on four screens and in the header. Narrow selectors mean each reader re-renders only for its own value |
| Sign-in session | Layout, RequireAuth, Login, Checkout / Login, Layout | **AuthContext** ([AuthProvider.jsx](src/auth/AuthProvider.jsx)) | Changes rarely, needed by the guard. `loading` stops a cold `/checkout` bouncing a signed-in person |
| Theme | ThemePicker | **ThemeContext**, saved to localStorage | A separate provider, so changing it re-renders only the picker |
| Checkout form values | Checkout / Checkout | `useState` in **Checkout** | Nobody else reads half-filled delivery details. They are dropped when the person leaves |
| Touched fields | Checkout | `useState` in **Checkout** | Belongs with the values it describes |
| Validation errors | Checkout, Field | **Not stored**: `validate(form)` runs every render | Derived state cannot disagree with the values it is derived from |
| Submitting / in flight | Checkout | `useState` + a `useRef` guard in **Checkout** | The state drives the button text. The ref stops a double press in the same tick |
| Server errors, failure message | Checkout, Field | `useState` in **Checkout** | What the server said, kept apart from what `validate` says |
| Is the dish modal open | Dish, Modal | `useState` in **that Dish** | Opening one dialog re-renders one card |
| Placed order | Receipt | **The server**, fetched by `:id` | A refresh of `/orders/1001` still shows it. Router state would not survive one |
| Where to go after sign-in | Login | **Router location state** (`state.from`) | Exists only for the one redirect |

Checked against the brief's warning about making everything global: two
things are global (the cart and the session) and both are read in places with
no common parent below `Layout`. Everything else lives in one screen.

## 3. The folders, by feature

```
src/
  App.jsx, Layout.jsx, main.jsx    the frame: routes, providers, header, nav
  api/        orders.js            fetch helpers that do more than GET (one so far)
  hooks/      useFetch.js          reusable, mentions no dish and no order
  ui/         ErrorBoundary, Modal, Skeleton, Fallbacks
  menu/       Menu, CategoryBar, SearchBar, DishList, Dish, DishDetail
  cart/       cartStore, Cart, CartPanel, CartBadge   (+ cartSlice.redux.js, read-only comparison)
  checkout/   Checkout, Field, validate, Receipt       (+ validate.check.mjs)
  auth/       AuthProvider, AuthContext, useAuth, RequireAuth, Login
  theme/      ThemeProvider, ThemeContext, useTheme, ThemePicker
  pages/      Home, NotFound       screens that belong to no feature
  dev/        Probe.jsx            <Profiler> for PROFILE.md, a no-op in production
```

Up to Day 34 this was `components/` (seven files) plus `pages/` (eight). Day
35 moved each file to the feature it belongs to. Nothing was renamed and no
code changed in the move, only import paths. The test is the one the sheet
gives: deleting the checkout now means deleting `checkout/` and two lines in
`App.jsx`.

Where this differs from the sheet's sketch, and why:

- **`/menu/:slug`, not `/menu/:id`.** The parameter is the dish's slug
  (`/menu/doro-wat`). It is still a dynamic route reading its parameter. A
  readable URL is worth more here than a numeric one, and the slug is unique.
- **`Dish`, not `DishCard`.** The name dates from Day 26.
- **No `api/menu.js`.** The menu is a plain GET, so `useFetch(url)` is the
  whole helper. `api/orders.js` exists because a POST has a body, a 422 with
  field errors and a 503, and turns them all into one `OrderError`.
- **`ui/Fallbacks.jsx` knows about features.** *The menu could not be shown*
  mentions dishes, which breaks the rule that `ui/` is generic. It stays as
  one file because it is the catalogue of every boundary's fallback, and it is
  easier to review in one place. Moving `MenuUnavailable` into `menu/` and
  `CartUnavailable` into `cart/` would be the fix if it grows.
- **`theme/` and `dev/`** are not in the sheet. The theme is a feature of its
  own (Day 32), and `dev/` makes it obvious that `Probe` is not product code.

## 4. The six build steps

The order the sheet asks for, ticked against this build. Each step was a
separate day here rather than a separate afternoon, so the commits are the
day snapshots `day26/` … `day34/`.

- [x] **1. Routes and Layout: every screen reachable, even if empty.**
      [App.jsx](src/App.jsx), [Layout.jsx](src/Layout.jsx),
      [NotFound.jsx](src/pages/NotFound.jsx). Day 31.
- [x] **2. The menu: fetch, loading, error, list.**
      [useFetch.js](src/hooks/useFetch.js), [Menu.jsx](src/menu/Menu.jsx),
      [DishList.jsx](src/menu/DishList.jsx). Days 29–30, with Day 35's
      useful server messages and the empty-category note.
- [x] **3. The filter, and the dish detail route.**
      `?category=` in [Menu.jsx](src/menu/Menu.jsx),
      [DishDetail.jsx](src/menu/DishDetail.jsx). Day 31.
- [x] **4. The cart store, and adding from the menu.**
      [cartStore.js](src/cart/cartStore.js), [Dish.jsx](src/menu/Dish.jsx),
      [Cart.jsx](src/cart/Cart.jsx). Day 32.
- [x] **5. The checkout form with validation.**
      [Checkout.jsx](src/checkout/Checkout.jsx),
      [validate.js](src/checkout/validate.js),
      [Field.jsx](src/checkout/Field.jsx). Day 33.
- [x] **6. Guard, error boundary, lazy route, polish.**
      [RequireAuth.jsx](src/auth/RequireAuth.jsx),
      [ErrorBoundary.jsx](src/ui/ErrorBoundary.jsx), `lazy()` in
      [App.jsx](src/App.jsx). Day 34, then Day 35's failure checks (README).

## Where each of Days 26–34 appears

The sheet's first *check yourself* question. If a row here had no file, that
would be the gap to close first.

| Day | Topic | Where it is in this build |
| --- | --- | --- |
| 26 | Components, props, JSX | [Dish.jsx](src/menu/Dish.jsx) and [CategoryBar.jsx](src/menu/CategoryBar.jsx) take props. [Layout.jsx](src/Layout.jsx) composes the frame |
| 27 | Lists, keys, conditional rendering, `children` | `dishes.map` with `key={dish.id}` in [DishList.jsx](src/menu/DishList.jsx). The loading → error → empty → list chain there. `children` in [RequireAuth.jsx](src/auth/RequireAuth.jsx) and [Modal.jsx](src/ui/Modal.jsx) |
| 28 | State, events, a controlled form | `search` in [Menu.jsx](src/menu/Menu.jsx) drives the controlled input in [SearchBar.jsx](src/menu/SearchBar.jsx). `phone` in [Login.jsx](src/auth/Login.jsx) |
| 29 | Fetching in an effect, with cleanup | `AbortController` and `controller.abort()` cleanup in [useFetch.js](src/hooks/useFetch.js). The `cancelled` flag in [AuthProvider.jsx](src/auth/AuthProvider.jsx) |
| 30 | A custom hook; useRef, useMemo, useCallback | [useFetch.js](src/hooks/useFetch.js) (called by Home, Menu, DishDetail, Receipt). `useRef` + focus and `useMemo` filter in [Menu.jsx](src/menu/Menu.jsx). `useCallback` for `refetch` |
| 31 | Nested routes, dynamic route, guarded route | `<Route path="/" element={<Layout />}>` with an `<Outlet />`, `menu/:slug`, `orders/:id` and `<RequireAuth>` around checkout in [App.jsx](src/App.jsx). `?category=` via `useSearchParams` |
| 32 | Context, and a store | [AuthProvider.jsx](src/auth/AuthProvider.jsx) and [ThemeProvider.jsx](src/theme/ThemeProvider.jsx) (context). [cartStore.js](src/cart/cartStore.js) (Zustand, persisted, narrow selectors) |
| 33 | Forms: validation, touched, submit states | [Checkout.jsx](src/checkout/Checkout.jsx) (`touched`, `submitting`, server errors, focus on the first bad field), [validate.js](src/checkout/validate.js) (pure, shared with the mock server), [Field.jsx](src/checkout/Field.jsx) |
| 34 | Error boundary, lazy route, profiling, portal | [ErrorBoundary.jsx](src/ui/ErrorBoundary.jsx) around the app, each page, the menu and the cart panel. `lazy(() => import("./checkout/Checkout"))` and Receipt in [App.jsx](src/App.jsx). [PROFILE.md](PROFILE.md). [Modal.jsx](src/ui/Modal.jsx) |

## A note on the material and React 19

The course sheets still teach `Component.propTypes`. This build keeps the
`propTypes` blocks as documentation of each component's props, but **React 19
no longer checks them**: a wrong prop type produces no console warning at
all. The checks that actually run here are the ones written as code, such as
`Dish` throwing on a missing price and `validate()` on every render.
