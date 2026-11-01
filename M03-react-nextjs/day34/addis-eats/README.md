# Addis Eats — Day 34: error boundaries, lazy loading, profiling & portals

The Day 33 application, hardened. A damaged dish takes down the menu and
nothing else. The checkout is not downloaded by someone who only browses. One
re-render was profiled, fixed and measured again. The dish modal gets out of
the card that opened it, and it works from the keyboard.

## Run it

```bash
npm install
npm run dev
npm run check:validate && npm run check:store
npm run build && npm run preview   # the production build, for the Network tab
```

| Try | What happens |
| --- | --- |
| Menu → tick **Serve Kitfo without a price** | The menu is replaced by *The menu could not be shown*. Header and basket keep working |
| Then **Load the menu again** | The menu remounts and the toggle resets |
| Open `/menu?crash=cart` | The basket panel breaks on its own. The menu still adds dishes |
| Network tab on `/menu`, then go to Checkout | `Checkout-….js` downloads only now, behind a skeleton |
| **Details** on any dish | A dialog in `#modal-root`. Tab stays inside, Escape closes, focus goes back to **Details** |

## The six steps, and where each one landed

| Step | Where it is |
| --- | --- |
| 1. An ErrorBoundary around the menu and the cart panel, separately | [ErrorBoundary.jsx](src/ErrorBoundary.jsx), placed in [App.jsx](src/App.jsx) |
| 2. Force a render error in one dish | [Dish.jsx](src/components/Dish.jsx) throws on a missing price. `?corrupt=1` in [menuApi.js](mock/menuApi.js) serves one |
| 3. Lazy checkout and receipt behind a Suspense skeleton | [App.jsx](src/App.jsx), [ui/Skeleton.jsx](src/ui/Skeleton.jsx) |
| 4. Profile while adding dishes, note the slowest | [PROFILE.md](PROFILE.md) §1 |
| 5. Fix one unnecessary re-render | `memo(Dish)`, measured in [PROFILE.md](PROFILE.md) §2 |
| 6. A dish modal through a portal | [ui/Modal.jsx](src/ui/Modal.jsx), opened from Dish |

## Boundaries: where and why

```
<ErrorBoundary "app">                 last resort, outside the router
  Layout
    <ErrorBoundary "page" resetKey=pathname>   any screen, incl. a failed chunk
      /menu
        <ErrorBoundary "menu">        a damaged dish lands here
        <ErrorBoundary "cart-panel">  a broken basket lands here
```

The question for each one was what should survive if this part breaks. A bad
dish should not cost the person their basket, so the menu and the basket are
separate regions with separate boundaries. Every fallback says what failed and
offers a way forward: reload the menu, open the cart page, or go back to the
menu.

**Why the dish throws.** `typeof dish.price !== "number"` throws on purpose.
Rendering `undefined ETB`, or letting the dish into the basket at 0, is the
half-rendered interface that React's white screen exists to prevent. The
`fallback` is a function, `({ error, reset }) => …`, so a fallback can offer
*Try again*. `resetKey` clears the page boundary when you navigate away.

**What they do not catch,** and what covers it instead:

| Not caught | Handled by |
| --- | --- |
| A fetch that fails | `useFetch`'s error state (Day 29). *Simulate a broken kitchen* still shows that |
| A failed order | Checkout's `try/catch` (Day 33) |
| Event handlers, timers | Code at the place it happens |

## Lazy loading, measured

| Build | Files | Main bundle |
| --- | --- | --- |
| Day 33 (one bundle) | `index.js` | 267.2 kB, 84.2 kB gzipped |
| Day 34 | `index.js` + `Checkout.js` + `Receipt.js` | 270.2 kB, 84.9 kB gzipped |
| | `Checkout-….js` | 5.2 kB, 2.3 kB gzipped |
| | `Receipt-….js` | 1.2 kB, 0.6 kB gzipped |

To be honest about it: **the split saves very little here.** The main bundle
grew by about 3 kB because today also added the boundary, modal, cart panel
and skeletons. Moving the checkout out saves about 2.3 kB gzipped off the
first load. The 270 kB is React DOM and the router, which the first screen
needs anyway. This is the split the exercise asks for, and the seam is right:
someone browsing never downloads the checkout. On this application it is not
yet a meaningful performance win. It would become one the day the checkout
pulls in a payment SDK or a map.

**Placement.** Each lazy route has its own `<Suspense>`, directly around it,
with a skeleton the shape of the page. A single Suspense around `<Routes>`
would swap the whole Layout for a skeleton on every chunk load. `Suspense`
sits outside `RequireAuth`, so a signed-out visitor is redirected before
`<Checkout />` renders and never downloads its chunk.

**A chunk that fails to download** rejects its `import()`. React treats that as
a render error, so the page boundary catches it. `lazy()` caches the
rejection, so *Try again* in place cannot work. The fallback recognises the
error and offers **Reload the page** instead.

## The modal

Rendered with `createPortal` into `<div id="modal-root">` in
[index.html](index.html), outside `#root`. The dish card has
`overflow: hidden`, so a dialog rendered inside it would be clipped at the
card's edge, whatever its z-index.

It stays a child of the card in every way that matters. It reads and writes
the same cart store (**Add one** updates the count inside the dialog), and its
events bubble up the React tree to the card, not to `#modal-root`. A click on
the backdrop closes it only when `event.target` *is* the overlay, so clicks
inside the panel do not count.

| Requirement | How |
| --- | --- |
| Focus moves in | The first focusable control, on open |
| Focus is trapped | Tab and Shift+Tab wrap at the ends, and `#root` gets `inert`, so neither the keyboard nor a screen reader reaches the page behind |
| Escape closes | A `keydown` listener for the dialog's lifetime |
| Focus returns | To `document.activeElement` from open time, which is the **Details** button |
| Announced | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the dish name |

The open state lives in the one card it belongs to, so opening Tibs re-renders
Tibs and nothing else.

## Verified

Against `npm run build && npm run preview` in headless Chromium:

- `/menu` loads with no `Checkout` or `Receipt` chunk. Clicking Checkout
  fetches `Checkout-….js`, the skeleton shows while it loads (artificially
  delayed by 800 ms), and the header stays.
- Kitfo without a price shows the menu fallback. The basket panel and header
  badge are untouched, and **Load the menu again** brings all 13 dishes back
  with the toggle reset.
- `?crash=cart` shows the basket fallback. The menu still renders 13 dishes,
  and adding one updates the badge.
- Blocking the `Receipt` chunk shows *This screen did not download* with the
  header intact. Navigating to the menu clears it.
- The dialog is in `#modal-root` and labelled by the dish name. Focus starts
  on Close. Four Tabs cycle Add → Full page → Close → Add without leaving it,
  and Shift+Tab stays inside. Escape closes it and returns focus to *Details*
  of the same dish. A backdrop click closes it.
- No uncaught page errors.

## Files

| File | Job |
| --- | --- |
| [src/ErrorBoundary.jsx](src/ErrorBoundary.jsx) | The class: fallback (element or function), report, reset, `resetKey` |
| [src/App.jsx](src/App.jsx) | Lazy routes, per-route Suspense, boundary placement |
| [src/ui/Modal.jsx](src/ui/Modal.jsx) | `createPortal`, focus in, trap, Escape, focus return |
| [src/ui/Fallbacks.jsx](src/ui/Fallbacks.jsx) | What each boundary shows, including the chunk-failure case |
| [src/ui/Skeleton.jsx](src/ui/Skeleton.jsx) | Checkout and receipt skeletons |
| [src/components/CartPanel.jsx](src/components/CartPanel.jsx) | The basket beside the menu, its own region |
| [src/dev/Probe.jsx](src/dev/Probe.jsx) | `<Profiler>` into `window.__profile`, dev only |
| [PROFILE.md](PROFILE.md) | Before and after, and why memo rather than moving state |
