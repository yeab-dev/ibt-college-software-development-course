# Addis Eats — Day 32: context in depth, and a Zustand store

The routed application from Day 31, with the cart moved out of the component
tree and into a store. The session stays in context — behind a `useAuth` hook
that throws without its provider.

## Run it

```bash
npm install
npm run dev
npm run check:store   # the store, driven from plain Node, no components
```

## The six steps, and where each one landed

| Step | Where it is |
| --- | --- |
| 1. Wrap `CartContext` in a `useCart` hook that throws | commit `aaf8c87` — then deleted by the migration |
| 2. Split auth and theme into their own providers | [src/auth/](src/auth/), [src/theme/](src/theme/) |
| 3. Rebuild the cart as a Zustand store | [src/cart/cartStore.js](src/cart/cartStore.js) |
| 4. Replace every `useCart` with a narrow selector | every consumer, one value at a time |
| 5. `persist` middleware | [cartStore.js](src/cart/cartStore.js) |
| 6. Count the re-renders | measured below |

Steps 1–2 are a separate commit on purpose. `git show aaf8c87` is the
application still on context, with the guarded hook in place — which is what
made step 4 a one-line change per consumer instead of a rewrite.

## Step 1 — the hook that throws

```js
export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === null) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}
```

Without the guard, a missing provider hands you `null` and the crash lands
somewhere unrelated — `Cannot destructure property 'items' of null`, in a
component that did nothing wrong. This fails immediately and names what is
missing.

The second benefit is the one that mattered here: **the context object stays
private to the module.** Every consumer imported the hook, nobody imported
`CartContext`, so replacing the implementation touched one line per file.

That pattern now lives in [src/auth/useAuth.js](src/auth/useAuth.js) and
[src/theme/useTheme.js](src/theme/useTheme.js) — the contexts that remain.

## Step 2 — one provider per concern

```jsx
<AuthProvider>
  <ThemeProvider>
    <BrowserRouter>
```

Not `<AppContext.Provider value={{ user, cart, theme }}>`. The theme changes
maybe twice in a session; the cart changed on every click. In one object they
change together, and the rare value pays the cost of the busy one.

## Step 3 — the store

```js
export const useCartStore = create(persist((set) => ({
  items: [],
  addItem: (dish) => set((state) => ({ … })),
  removeItem: (id) => set((state) => ({ … })),
  clear: () => set({ items: [] }),
}), { name: "addis-eats-cart", partialize: (s) => ({ items: s.items }) }));
```

> The brief calls the second action `remove`; it is `removeItem` here, to pair
> with `addItem`.

**No provider.** The store is a plain module, so any component imports it
directly. Nothing has to be mounted above you, and moving a component around
the tree cannot break its access to the cart.

What went away, and what replaced it:

| Gone | Replaced by |
| --- | --- |
| `CartProvider` in the tree | an import from `cartStore.js` |
| `cartReducer.js` and the action types | actions inside the store |
| `useMemo` on the provider value | selectors, per component |
| `dispatch({ type: "add", dish })` | `addItem(dish)` |

`set` **merges**, it does not replace: returning `{ items }` leaves every other
key untouched. Pass a function when the new value depends on the old one.

## Step 4 — narrow selectors, one value at a time

The selectors are defined once at module level in
[cartStore.js](src/cart/cartStore.js), so their identity is stable:

```js
export const selectCount = (s) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectQuantityOf = (id) => (s) =>
  s.items.find((i) => i.id === id)?.quantity ?? 0;
export const selectAddItem = (s) => s.addItem;
```

| Component | Subscribes to |
| --- | --- |
| [CartBadge](src/components/CartBadge.jsx) | `selectCount` — one number |
| [Dish](src/components/Dish.jsx) | its **own** quantity, plus `addItem` |
| [Cart](src/pages/Cart.jsx) | `items`, `total`, `removeItem` — three separate calls |
| [Checkout](src/pages/Checkout.jsx) | `total`, `count`, `clear` |
| [DishDetail](src/pages/DishDetail.jsx) | `addItem` only — it never reads |
| [Layout](src/Layout.jsx) | nothing. It does not touch the cart at all |

**Every value gets its own call.** The tempting version —

```js
const { items, total } = useCartStore((s) => ({ items: s.items, total: … }));
```

— builds a fresh object on every call, so Zustand's comparison always says
"changed" and the store behaves exactly like context. `npm run check:store`
asserts that mistake explicitly so you can see it fail.

Components that only *write* subscribe to an action. Actions never change
identity, so those components never re-render because of the cart.

## Step 5 — persistence

The `persist` wrapper saves to `localStorage` after every change and reads it
back on load. The order survives a refresh with no effect code.

`partialize` matters: without it the actions are written to storage too — as
nothing, because functions do not survive JSON — and rehydration puts those
nothings back over the real ones.

Verified in a real browser: add three dishes, navigate with a full page load,
badge still reads **3**.

## Step 6 — what actually re-renders

Every instrumented component shows its own render count on screen
([useRenderCount](src/hooks/useRenderCount.js) also logs to the console). Turn
on React DevTools → **Highlight updates when components render** as well; the
header not flashing is the clearest version of this.

Measured in headless Chromium, on `/menu` with all thirteen dishes shown,
adding three dishes. Numbers are **development renders, so `<StrictMode>` has
doubled them** — the ratio is the point, not the absolute value:

| Component | Context (Day 31) | Store (Day 32) |
| --- | --- | --- |
| The 3 cards you clicked | +6 each | **+2 each** |
| The other 10 cards | +6 each | **0** |
| `CartBadge` | +6 | +6 |
| `Layout` | 0 | 0 |

**The dish list is the whole story.** Thirteen cards each read the cart through
`useCart()`, so each got the entire value object and each re-rendered on every
click: 13 × 3 = **39 renders**. With a selector returning one number, adding
Doro Wat leaves the Shiro card's selector returning the same `0` it returned
before, React skips it, and the same three clicks cost **3 renders**.

`CartBadge` is unchanged, and should be — the count genuinely changes every
time. A selector does not make re-renders disappear, it makes them *correct*.

### The result that corrects the usual story

`Layout` did not re-render on an "Add" — **and it did not under context
either.**

"Context re-renders everything below the provider" is the version you will hear,
and it is not true. Only components that actually call `useContext` re-render.
`Layout` never read the cart, and it arrived as the `children` prop of a parent
that was not itself re-rendering, so React reused the element and skipped the
whole subtree.

So the cost of context was never the header, and moving the cart to a store did
not fix the header. It fixed the thirteen components that really were reading
state they mostly did not use. Measure before you believe a performance claim —
including this one.

## What is checkable without a browser

`npm run check:store` drives the store from plain Node. That is one of the
things a store buys you: a context value only exists while a provider is
mounted, so testing it means rendering something. A store is just a module.

It asserts the actions, the persisted payload, and the mechanism itself:

```js
const before = selectQuantityOf(shiro.id)(read());
addItem(doro);                                  // a different dish
assert.ok(Object.is(before, selectQuantityOf(shiro.id)(read())));
// -> the Shiro card's selector is unchanged, so that card does not re-render
```

That `Object.is` comparison is exactly the condition React uses. It is also why
a selector must return a primitive or a stable reference, never a fresh object.

One Node-specific wrinkle worth knowing: zustand's default storage is literally
`createJSONStorage(() => window.localStorage)`, so the test shim has to hang off
`window`. Shim the bare global and persist silently falls back to "storage
unavailable".

## Where context would still have been fine

Honestly: Addis Eats never needed a store. Thirteen dish cards is not a
performance problem, and `useReducer` plus a memoised provider value was a
perfectly good answer.

| Context handles it | You want a library |
| --- | --- |
| A handful of shared values | Dozens of pieces of shared state |
| Changes on user actions | Changes many times a second |
| Every consumer needs the change | Each screen needs a different slice |
| Reading state in components | Reading state outside React too |
| One team, one file | Middleware, devtools, persistence |

Two columns of that table are now genuinely true here: each screen wants a
different slice, and `persist` is middleware that would otherwise be code to
maintain. The rest was practice.

And server data stays out of all of it — the menu is still
[useFetch](src/hooks/useFetch.js). Putting fetched data in a global store means
owning caching, refetching and staleness by hand. Day 41 gives it a proper home.

## Homework: the same cart in Redux Toolkit

Not wired in — [src/cart/cartSlice.redux.js](src/cart/cartSlice.redux.js) is
there to read side by side with `cartStore.js`. `createSlice` generates the
action creators, and `state.items.push(dish)` is safe because Immer records the
change against a draft and produces a new object.

## Files

| File | Job |
| --- | --- |
| [src/cart/cartStore.js](src/cart/cartStore.js) | The store: items, actions, persist, and every selector |
| [src/cart/cartStore.check.mjs](src/cart/cartStore.check.mjs) | Node assertions, including the selector mechanism |
| [src/cart/cartSlice.redux.js](src/cart/cartSlice.redux.js) | The same cart in Redux Toolkit, to read |
| [src/auth/useAuth.js](src/auth/useAuth.js) | The guarded hook for the context that remains |
| [src/theme/](src/theme/) | The third concern, in its own provider |
| [src/hooks/useRenderCount.js](src/hooks/useRenderCount.js) | The on-screen render counter |
