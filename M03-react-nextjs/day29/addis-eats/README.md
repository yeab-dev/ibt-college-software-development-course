# Addis Eats — Day 29: fetching the menu

The Day 28 menu kept its dishes in a `const dishes = [...]` array inside
`Menu.jsx`. Day 29 moves that array behind an HTTP request, which means the
component now has to deal with everything a network brings with it: waiting,
failing, changing its mind, and cancelling.

## Run it

```bash
npm install
npm run dev
```

## Where the data lives

The dishes moved out of the component and into [mock/menu.json](mock/menu.json).
[mock/menuApi.js](mock/menuApi.js) is a small Vite middleware that serves that
file as a real endpoint:

| Request | Answer |
| --- | --- |
| `GET /api/menu?category=All` | `200` — every dish |
| `GET /api/menu?category=Drink` | `200` — only the drinks |
| `GET /api/menu?category=Poison` | `404` — `{ "message": "No such category: Poison" }` |
| `GET /api/menu?category=All&fail=1` | `503` — `{ "message": "The kitchen is offline." }` |

Every response is held back by 900 ms on purpose. A local JSON file answers
faster than React can paint, and then the loading state — and the cancelled
request — would never be visible.

## What the effect does

All of it lives in [src/components/Menu.jsx](src/components/Menu.jsx#L33).

**It fetches on mount.** The effect started life with `[]`, ran once, and put
the result in `useState`.

**It checks `res.ok`.** `fetch` only rejects when the network itself fails, so a
404 or a 503 arrives as a perfectly resolved promise. The check turns a bad
status into a thrown error with a message worth reading:

```js
if (!res.ok) {
  throw new Error(
    `Could not load the ${category} menu — the server answered ${res.status}.`,
  );
}
```

**It refetches when the category changes.** `category` is in the dependency
array, so picking *Drink* tears the old effect down and runs a new one. The
search box deliberately is **not** in that array: the category is a question for
the server, the search term is a filter over dishes already in hand, so typing
never touches the network.

**It cancels the previous request in cleanup.** The effect creates an
`AbortController`, passes `controller.signal` to `fetch`, and returns
`() => controller.abort()`. Without it, a slow answer for *Main* could land
after a fast answer for *Drink* and overwrite the list the user is looking at.
An `AbortError` is caught and ignored rather than shown — nothing went wrong, a
newer request simply took over.

## Loading, error, and empty

[src/components/DishList.jsx](src/components/DishList.jsx) renders each state
with an early return: one for loading, one for the error (with a **Try again**
button), one for a category or search that matches nothing.

The early returns sit in `DishList` rather than in `Menu` on purpose. If `Menu`
returned early, the category buttons would disappear on every refetch and the
search input would unmount — leaving the ref below with nothing to focus.

Tick **Simulate a broken kitchen** in the footer to see the error path; it adds
`fail=1` to the request and is in the dependency array, so ticking it refetches.

## The auto-focused search box

A second effect, also with `[]`, runs once after the first paint:

```js
const searchInput = useRef(null);

useEffect(() => {
  searchInput.current.focus();
}, []);
```

React 19 treats `ref` as an ordinary prop, so
[SearchBar](src/components/SearchBar.jsx) receives it by name and hands it to
its `<input>` — no `forwardRef` wrapper needed. The **Clear** button uses the
same ref to put the cursor back.

## Files

| File | Job |
| --- | --- |
| [mock/menu.json](mock/menu.json) | The 13 dishes, formerly a const in `Menu.jsx` |
| [mock/menuApi.js](mock/menuApi.js) | Mock API: filtering, latency, 404s and 503s |
| [src/components/Menu.jsx](src/components/Menu.jsx) | State, both effects, the fetch |
| [src/components/DishList.jsx](src/components/DishList.jsx) | Early returns for loading / error / empty |
| [src/components/SearchBar.jsx](src/components/SearchBar.jsx) | The input that takes the ref |
| [src/components/CategoryBar.jsx](src/components/CategoryBar.jsx) | Buttons that change the fetched category |
| [src/components/Dish.jsx](src/components/Dish.jsx) | One dish card |
| [src/components/Timer.jsx](src/components/Timer.jsx) | The in-class warm-up on effect cleanup |
