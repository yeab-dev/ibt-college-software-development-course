# Addis Eats — Day 35: the React mini-project, finished

Days 26–34 put together as the mini-project brief asks: six routes, a fetched
menu with its category in the URL, a page per dish, a cart kept in a store,
and a guarded, validated checkout. Today added no new features. It was
planning on paper ([PLAN.md](PLAN.md)), regrouping `src/` by feature, and
running the brief's *test the paths that fail* list. Four of those checks
found real gaps, and they are fixed here.

## Run it

```bash
npm install
npm run dev                                   # http://localhost:5173
npm run check:validate && npm run check:store
npm run lint
npm run build && npm run preview              # the production build
```

No `.env` is needed. The menu and orders "server" is the Vite middleware in
[mock/](mock/), which runs under both `dev` and `preview`.

| Screen | Route | What it does |
| --- | --- | --- |
| Home | `/` | Three of today's dishes, linking into the menu |
| Menu | `/menu?category=Drink` | Fetched dishes. The category is in the query string. Search, add, Details dialog |
| Dish | `/menu/:slug` | One dish, fetched by its slug, with **Add to order** |
| Cart | `/cart` | Order lines, remove one, running ETB total |
| Checkout | `/checkout` | Guarded by sign-in, lazy-loaded, validated with touched tracking |
| Receipt | `/orders/:id` | The placed order, fetched by id, so a refresh still shows it |
| Not found | `*` | Names the address that did not match, with a link back to the menu |

`/login` is the sign-in the guard sends you to. Any `09…` number works.

## The brief, line by line

| Requirement | Where |
| --- | --- |
| All six routes, catch-all included, each loading cold | [App.jsx](src/App.jsx). Checked below |
| Menu fetched with loading, error **and empty** states on screen | [useFetch.js](src/hooks/useFetch.js), [DishList.jsx](src/menu/DishList.jsx) |
| Category in the query string; a dynamic route reading its parameter | `useSearchParams` in [Menu.jsx](src/menu/Menu.jsx); `useParams` in [DishDetail.jsx](src/menu/DishDetail.jsx) |
| A cart readable from at least two screens | [cartStore.js](src/cart/cartStore.js), read by the badge, menu panel, dish cards, Cart, DishDetail and Checkout |
| Checkout form with validation and touched tracking | [Checkout.jsx](src/checkout/Checkout.jsx), [validate.js](src/checkout/validate.js) |
| Guarded checkout, an error boundary, one lazy route | [RequireAuth.jsx](src/auth/RequireAuth.jsx), [ErrorBoundary.jsx](src/ui/ErrorBoundary.jsx) (four of them), `lazy()` for Checkout and Receipt |
| A custom hook, and context or a store | `useFetch`, plus both: AuthContext and a Zustand store |
| A clean console | Fixed today, see below |

Where each of Days 26–34 shows up, file by file, is the last table in
[PLAN.md](PLAN.md).

## Testing the paths that fail

Every check ran against `npm run build && npm run preview` in headless
Chromium. The console check also ran on `npm run dev`.

| Do this | Check | Result |
| --- | --- | --- |
| Throttle to Slow 3G (2 s latency, 50 kB/s) | A loading state, never a blank screen | **Was blank** for several seconds while the 85 kB bundle downloaded. **Fixed:** *Loading Addis Eats…* is now in `index.html`. On `/menu`, `/menu/tibs` and `/` the sequence is boot message → *Loading the menu…* → dishes, with no blank frame |
| Rename the data file (`mock/menu.json`) | A useful error message | **Was a crash:** the rejected `readFile` went uncaught and Node **stopped the dev server**. Every later request failed. **Fixed:** the mock answers 500 with a reason, and `useFetch` now shows the server's `message`. The menu says *Could not load the menu. The kitchen could not read its menu…* with **Try again**, and the server keeps running |
| Filter to an empty category | A friendly note, not an error | **Could not be tried:** every category had dishes. **Added** a Breakfast category with none. It shows *Nothing in Breakfast yet…* and a link to the whole menu. It is not `role="alert"` and has no error styling |
| Type a nonsense URL | NotFound renders | `/this/is/nonsense` shows *Nothing at /this/is/nonsense* inside the normal Layout. `/menu/pizza` is a valid path with an unknown slug, so it shows *We could not open "pizza". There is no dish called pizza.* |
| Open `/checkout` signed out | Redirect, then return after signing in | Redirects to `/login`, and signing in returns to `/checkout`. **Fixed:** the query string was being dropped, so `/checkout?fail=1` came back as `/checkout`. It now survives the detour |
| Reload on every screen | Each loads cold without crashing | `/`, `/menu`, `/menu?category=Drink`, `/menu/kitfo`, `/cart`, `/checkout` (signed out → login; signed in → the form), `/login`, `/orders/1001`, `/orders/9999`, and the nonsense URL all load cold |
| Keyboard only (Day 33) | Complete the checkout without a mouse | Done with Tab and Enter only: two **Add**s on the menu, the panel's **Checkout** link, sign in, Enter on an empty form (focus goes to *Name* and both errors appear), type, Enter. Ends at *Order 1002 is in the kitchen* |
| Greyscale (Day 33) | Every error readable without colour | With `filter: grayscale(1)` each error is still a ⚠ mark plus a sentence in bold under its own field. The fields also carry `aria-invalid` |

The lazy checkout still shows its skeleton under the header while its chunk
downloads (checked with the chunk delayed by 1.5 s). That needed checking
after the router change below.

### The console

| Before (Day 34) | After |
| --- | --- |
| Two **React Router future-flag warnings** on every page load | Gone: `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` on `<BrowserRouter>`. Opting in now also means the v7 upgrade changes nothing |
| `render #n · Dish · …` logged on every render: 34 lines for one visit to `/menu` in dev | Gone: `useRenderCount` and the "N renders" counters in the header badge, cards and footer are removed |

What is left in the console:

- In dev only, Vite's `[vite] connected` debug lines and React's *Download
  the React DevTools* note. Both come from the tools, not from the app.
- `Failed to load resource: 404` on `/menu/pizza` and `/orders/9999`. That is
  Chromium logging a real 404 response, and the screen handles it. An API
  should answer 404 for something that does not exist.
- `[menu] crashed: …` when you deliberately break a dish or `?crash=cart`.
  `componentDidCatch` reports it on purpose.

`Probe` (the `<Profiler>` wrapper from Day 34) stays. It writes nothing to
the console, renders nothing, and does nothing in a production build.
[PROFILE.md](PROFILE.md) still uses it.

## What else changed today

- **`src/` grouped by feature:** `menu/`, `cart/`, `checkout/`, `auth/`,
  `theme/`, `ui/`, with `pages/` left for Home and NotFound. Only files moved
  and import paths changed. The layout and the reasons for it are in
  [PLAN.md](PLAN.md) §3.
- **Error messages say what happened.** `useFetch` passes on the API's
  `message` instead of *The server answered 404.*, and a request that never
  reaches the server says *Addis Eats could not be reached. Check your
  connection.* instead of the browser's *Failed to fetch*. Both mock servers
  catch their own failures and answer 500 instead of dying.
- **Small wording fixes:** *Loading the menu…*, not *Loading the all
  menu…*. Home shows a note if the kitchen sends no specials.

## Try it

| Try | What happens |
| --- | --- |
| Menu → **Breakfast** | The empty-category note and a way back |
| Rename `mock/menu.json` while `npm run dev` runs, then reload `/menu` | The error state with the server's reason. Rename it back and press **Try again** |
| DevTools → Network → *Slow 3G*, reload `/menu` | *Loading Addis Eats…*, then *Loading the menu…*, then dishes |
| Sign out, open `/checkout?fail=1` | Sign in and you land back on `/checkout?fail=1` |
| Menu → tick **Serve Kitfo without a price** | Day 34's boundary: the menu fails on its own, and the basket keeps working |

## Files

| File | Job |
| --- | --- |
| [PLAN.md](PLAN.md) | Component tree with ownership, state placement, folders, the six steps, Days 26–34 |
| [src/App.jsx](src/App.jsx) | Routes, lazy checkout and receipt, boundary placement, router future flags |
| [src/Layout.jsx](src/Layout.jsx) | Header, nav, page boundary around `<Outlet />`, footer |
| [src/hooks/useFetch.js](src/hooks/useFetch.js) | Loading / error / data with abort cleanup and `refetch`, plus server messages |
| [src/menu/](src/menu/) | Menu, CategoryBar, SearchBar, DishList, Dish, DishDetail |
| [src/cart/](src/cart/) | The store and everything that shows the cart |
| [src/checkout/](src/checkout/) | Checkout, Field, `validate` (shared with the mock server), Receipt |
| [src/auth/](src/auth/) | Session context, `useAuth`, `RequireAuth`, Login |
| [src/ui/](src/ui/) | ErrorBoundary, Fallbacks, Modal, Skeleton |
| [index.html](index.html) | `#modal-root`, and the boot message shown before the bundle arrives |
| [mock/](mock/) | The pretend menu and orders API, now answering 500 instead of crashing |
| [PROFILE.md](PROFILE.md) | Day 34's measured re-render, unchanged apart from a note and a path |
