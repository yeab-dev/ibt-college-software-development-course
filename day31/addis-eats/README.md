# Addis Eats — Day 31: React Router v6

Day 30 was one screen. Day 31 is six, each with a real URL, sharing one frame,
none of them ever reloading the browser — and the cart survives every hop.

## Run it

```bash
npm install
npm run dev
npm run check:reducer
```

> Installed as `react-router-dom@^6` to match the course material. Everything
> used here — `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `Outlet`,
> `useParams`, `useSearchParams`, `useNavigate`, `Navigate`, `useLocation` —
> has the same API in v7.

## The route table

Design the URLs first. The route table is the shape of the application.

| Path | Screen | Notes |
| --- | --- | --- |
| `/` | [Home](src/pages/Home.jsx) | `index` route — the parent's own path |
| `/menu` | [Menu](src/pages/Menu.jsx) | Category filter lives in `?category=` |
| `/menu/:slug` | [DishDetail](src/pages/DishDetail.jsx) | One route, thirteen dishes |
| `/cart` | [Cart](src/pages/Cart.jsx) | Lines, total, remove |
| `/checkout` | [Checkout](src/pages/Checkout.jsx) | Behind `RequireAuth` |
| `/login` | [Login](src/pages/Login.jsx) | Returns you where you came from |
| `*` | [NotFound](src/pages/NotFound.jsx) | Always include it |

All of it is in [src/App.jsx](src/App.jsx).

## Where the providers go

```jsx
<AuthProvider>
  <CartProvider>
    <BrowserRouter>
```

**Outside** the router, above everything that reads them, outside anything a
navigation can unmount. Day 30's cart survives the trip from `/menu` to
`/menu/kitfo` to `/cart` because of where those two lines are — not because of
anything the router itself does.

## Nesting and `Outlet`

[src/Layout.jsx](src/Layout.jsx) renders the header, the tab bar, the footer,
and an `<Outlet />` in the middle. Every screen is a child route of `/`, so the
frame is built **once**. Navigating from `/menu` to `/cart` swaps only what is
inside the outlet — the header is never rebuilt, so anything it holds stays put.

Child paths have **no leading slash**:

| Written as | Means |
| --- | --- |
| `index` | The parent's own path, nothing more — here `/` |
| `path="menu"` | Relative — parent path plus `/menu` |
| `path="/menu"` | Absolute — escapes the parent entirely |

## `Link`, never `<a href>`

An anchor asks the server for a file that does not exist, reloads everything,
and empties the cart. `Link` hands the click to the router, which changes the
URL with the History API and re-renders.

`NavLink` is a `Link` that also knows whether it is the open page — its
`className` accepts a function receiving `{ isActive }`. The `/` tab needs
`end`, or it matches every URL that starts with a slash, which is all of them.

Normal anchors are still correct for addresses outside the app — a TeleBirr
payment page, Ethiopian Airlines. `Link` is only for routes you own.

## Dynamic segments

`path="menu/:slug"` matches anything in that position and hands you the value:

```js
const { slug } = useParams();                       // "kitfo", always a string
const { data: dish, isLoading, error } = useFetch(`/api/menu/${slug}`);
```

Because `slug` is in the URL passed to `useFetch`, it is in that hook's
dependency array too. Navigating from Doro Wat to Kitfo refetches on its own.

The data grew a `slug` field for this — `doro-wat` reads better than `1` and is
easier to share. Whatever you choose, **the route and the data must agree**.

### Two different kinds of missing

- `/menuu/kitfo` — nobody claimed that path, so the `*` route catches it.
- `/menu/pizza` — a *valid* path with a slug that does not exist. It matches
  `menu/:slug` perfectly, so `DishDetail` has to notice and say so itself.

The mock API returns `404 {"message": "No dish called pizza"}` for the second.

## The filter in the query string

```js
const [params, setParams] = useSearchParams();
const category = params.get("category") ?? "All";
setParams({ category: next }, { replace: true });
```

`useSearchParams` works like `useState` except the value lives in the URL, so
`/menu?category=Drink` is shareable, bookmarkable and survives a refresh.
`replace: true` keeps the back button useful — without it, clicking through
five categories means five presses of Back to leave the menu.

The **search box stays in ordinary state**. A URL is public and permanent;
filters and pagination belong there, half-typed text does not.

## Navigating from code

| Use | When |
| --- | --- |
| `<Link>` | The person clicks to go somewhere |
| `useNavigate` | Your code decides, after an event |
| `<Navigate>` | Redirect while rendering |

Calling `navigate()` during render is a side effect. `<Navigate />` is a
component — returning it is an ordinary render that happens to change the URL.

`navigate("/menu", { replace: true })` after a placed order stops the back
button returning to a checkout form for an order that is already gone.

## The guard

[src/auth/RequireAuth.jsx](src/auth/RequireAuth.jsx) is an ordinary component
using Day 27's `children` prop and Day 30's context:

```jsx
if (loading) return <p className="state">Checking your session…</p>;
if (!user)   return <Navigate to="/login" replace state={{ from: location }} />;
return children;
```

**Check `loading` first.** This is the one that bites. Session reads are
asynchronous — [AuthProvider](src/auth/AuthProvider.jsx) deliberately makes its
`localStorage` read take 400 ms so the state is real rather than already
resolved by the first paint. During that window `user` is `null`. Redirect on
that and a signed-in student is thrown to the login screen on every refresh of
`/checkout`.

`state={{ from: location }}` is how [Login](src/pages/Login.jsx) knows where to
send them afterwards:

```js
const from = location.state?.from?.pathname ?? "/menu";
navigate(from, { replace: true });
```

| The student does | What happens |
| --- | --- |
| Opens `/checkout` signed out | Sent to `/login`, destination remembered |
| Signs in with `09…` | Returned straight to `/checkout` |

## One deviation from the slide

The slide wraps each whole dish card in a `Link`. That puts the **Add** button
inside an anchor — a control inside a control, which keyboards and screen
readers both handle badly. [Dish.jsx](src/components/Dish.jsx) links the title
instead: same destination, no nested interactive elements.

## Test it the way the tip says

Type each URL into the address bar and press enter. Clicking through hides
mistakes that a cold load exposes immediately:

```
/                      /menu                  /menu?category=Drink
/menu/kitfo            /menu/pizza            /menuu/kitfo
/cart                  /checkout              /nonsense
```

Then swap one `Link` for an `<a href>`, add a dish, and click it. The page
reloads, the whole tree remounts, `CartProvider` starts again from
`{ items: [] }`, and the order is gone.

## Files

| File | Job |
| --- | --- |
| [src/App.jsx](src/App.jsx) | Providers, `BrowserRouter`, the full nested route table |
| [src/Layout.jsx](src/Layout.jsx) | Header, tabs, `Outlet`, footer — rendered once |
| [src/pages/](src/pages/) | One file per screen |
| [src/auth/AuthProvider.jsx](src/auth/AuthProvider.jsx) | The async session, with a real `loading` state |
| [src/auth/RequireAuth.jsx](src/auth/RequireAuth.jsx) | The guard |
| [src/cart/](src/cart/) | Day 30's reducer, context and provider — unchanged |
| [mock/menuApi.js](mock/menuApi.js) | Now serves `/api/menu` **and** `/api/menu/:slug` |

## What Day 32 does to this

Nothing about the routing changes. The cart moves out of the tree into a
Zustand store, and survives navigation because it no longer lives in the tree
at all — not because the layout stays mounted.
