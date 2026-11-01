# Addis Eats — Day 30: hooks deep dive

Day 29 had one component doing everything: `Menu.jsx` held the fetch, the
loading flag, the error, the abort controller, the filter and the running
total. Day 30 takes that component apart with the rest of the hook set —
a custom hook, a reducer, context, and `useMemo`.

## Run it

```bash
npm install
npm run dev
npm run check:reducer   # the reducer, tested without React
```

## 1. `useFetch` — logic out of the component

[src/hooks/useFetch.js](src/hooks/useFetch.js) is Day 29's effect, moved
into a function whose name begins with `use`. It returns `{ data, isLoading,
error, refetch }`, and `Menu` now says:

```js
const { data: dishes, isLoading, error, refetch } = useFetch(`/api/menu?${query}`);
```

A custom hook shares **logic, never data**. Two components calling `useFetch`
get two independent sets of `data`, `isLoading` and `error` — the hook is a
recipe that runs again per caller, not a shared box.

`refetch` is wrapped in `useCallback` so its identity is stable across renders.
That is what lets a caller put it in a dependency array without causing the
re-render it was trying to avoid.

## 2. `cartReducer` — a pure function, tested on its own

[src/cart/cartReducer.js](src/cart/cartReducer.js) is `(state, action) =>
newState`. No fetch, no `setState`, no `Date.now()`. Because of that it can be
checked with plain Node and no browser at all:

```bash
npm run check:reducer
```

[src/cart/cartReducer.check.mjs](src/cart/cartReducer.check.mjs) imports the
reducer, calls it with plain objects, and asserts on the results — including
that the state it started from was never mutated. Build the reducer first, get
it right in isolation, and the component work afterwards is very short.

| Action | What it does |
| --- | --- |
| `{ type: "add", dish }` | New line at quantity 1, or `+1` on the line that exists |
| `{ type: "remove", id }` | `−1`, and drops the line when it reaches zero |
| `{ type: "clear" }` | Back to `{ items: [] }` |
| anything else | Throws — a typo becomes an error that names itself |

`total` and `count` are **derived** from `items`, never stored. Two sources of
truth can disagree; one cannot.

## 3. Context — the cart without prop drilling

[src/cart/CartProvider.jsx](src/cart/CartProvider.jsx) holds the `useReducer`
and provides `{ items, total, count, dispatch }`. Three components read it, and
none of them received a single prop to do so:

| Component | Reads |
| --- | --- |
| [CartBadge](src/components/CartBadge.jsx) | `count`, `total` — in the header |
| [CheckoutPanel](src/components/CheckoutPanel.jsx) | `items`, `total`, `dispatch` — beside the menu |
| [Dish](src/components/Dish.jsx) | `items`, `dispatch` — three levels deep in the list |

The badge and the panel are siblings. There is no common parent that could have
passed the cart to both without every component in between carrying it along.

The context object lives in its own file,
[CartContext.js](src/cart/CartContext.js), so that `CartProvider.jsx` exports
nothing but a component — a module that mixes components with plain values
makes Vite's fast refresh give up and reload the page.

Its default value is `null` rather than `{}`, so a component rendered without a
provider fails loudly instead of quietly showing an empty cart. Day 32 turns
that into a real error message.

## 4. `useMemo` on the provider value

```js
const value = useMemo(
  () => ({ items: state.items, total, count, dispatch }),
  [state.items, total, count],
);
```

Without it, that object literal is rebuilt on every render of `CartProvider`.
A new object is a new context value, and a new context value re-renders every
consumer — even when nothing about the cart changed.

`dispatch` is deliberately absent from the dependency array: `useReducer`
guarantees the same function for the life of the component.

## 5. `useMemo` on the dish list

[Menu.jsx](src/components/Menu.jsx) filters by search term and sorts by name or
price inside a `useMemo` keyed on `[dishes, search, sort]`.

The honest note: thirteen dishes is not expensive work, and the Profiler will
not show a difference. The habit being practised is recognising *which* renders
would repeat the work — every keystroke re-renders `Menu`, and without the memo
every keystroke re-filters and re-sorts. Measure before assuming it helps.

`toSorted` rather than `sort`, because `sort` mutates in place and `dishes`
is state this component does not own.

## Files

| File | Job |
| --- | --- |
| [src/hooks/useFetch.js](src/hooks/useFetch.js) | The custom hook: data, loading, error, refetch, cleanup |
| [src/cart/cartReducer.js](src/cart/cartReducer.js) | The pure reducer plus `cartTotal` and `cartCount` |
| [src/cart/cartReducer.check.mjs](src/cart/cartReducer.check.mjs) | Assertions run by plain Node, no React |
| [src/cart/CartContext.js](src/cart/CartContext.js) | The context object, alone in its module |
| [src/cart/CartProvider.jsx](src/cart/CartProvider.jsx) | `useReducer` + the memoised provider value |
| [src/components/CartBadge.jsx](src/components/CartBadge.jsx) | Header consumer |
| [src/components/CheckoutPanel.jsx](src/components/CheckoutPanel.jsx) | Order lines, total, remove and clear |
| [src/components/Menu.jsx](src/components/Menu.jsx) | `useFetch`, the filter, and the `useMemo` list |

## What Day 31 does to this

Nothing is thrown away. The provider moves above a router so the cart survives
navigation between screens, and the single page becomes six URLs.
