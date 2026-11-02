# Every query in Addis Eats: its key, its refresh rule, and why

Two questions decided every row, the same two as STRATEGY.md: **can the
server fetch it?** If yes, it does, and nothing below changes that. Only what
is typed, repeated or paged by the person in this tab is fetched by the
browser. Then: **how stale may it be before someone is misled?** That answer
belongs to the data, not to the library. It sets the refresh rule.

SWR is the library ([the slides' recommendation](README.md#decisions) for an
app whose browser-side work is a poll and a search box). Every client query
goes through one fetcher, [lib/fetcher.js](lib/fetcher.js), which throws on a
non-OK response, so a `401`, `403` or `400` arrives as `error` with the
endpoint's own sentence and never as data. Day 42 made the order endpoint
answer `401` without a session and `403` for someone else's order; the query's
key did not change, but the answer now depends on the cookie.

SWR has no `staleTime`. Its equivalents are listed with each query:
`revalidateIfStale` (does a cached answer get refetched when a component asks
for it again?), `revalidateOnFocus`, `revalidateOnMount`,
`refreshInterval` and `dedupingInterval` (2 s, the default, for all of them).

## On the client (SWR)

| # | Query | Key | Fetched by | Refresh rule | Why, in one line |
| --- | --- | --- | --- | --- | --- |
| 1 | The order's live stage | `/api/orders/1001` ([useOrder.js](app/orders/[id]/useOrder.js), `orderKey(id)`) | `OrderStatus`, and `CancelOrderButton` with the same key (one request between them) | `fallbackData`: the server's render, which is already scoped to the session. `refreshInterval: 5000` until the stage is final, then 0. `revalidateOnMount: false`. `revalidateOnFocus: true` (default). Paused while the tab is hidden (default). Stops retrying on a 4xx (`401` signed out, `403` someone else's, `404`) | The stage changes on its own, minutes apart, so five seconds late is fine and a delivered order never changes again; the server rendered it a moment ago, so asking again at hydration would only fetch what is on screen. The endpoint now authenticates every poll and scopes it to the owner ([AUTH.md](AUTH.md)) |
| 2 | Menu search, one page of results | `/api/dishes?q=beef`, plus `&category=Main` and `&page=2` when they are not the defaults ([useDishSearch.js](app/menu/useDishSearch.js), `searchKey()`) | `FilterShell` | **`null` while the box is empty** (no request). The term is debounced 300 ms before it reaches the key. `keepPreviousData: true`. `revalidateIfStale: false`, `revalidateOnFocus: false`. Reconnect: default (on) | A menu changes a few times a day and the list the results sit in is itself up to an hour old, so an answer is good for as long as the tab is open: a term typed twice is asked for once. |
| 3 | Pages two onward of a search | the same key, with `&page=N` | `FilterShell`, from `Pager` | As row 2. The page is part of the key and of the address (`/menu?q=on&page=2`) | A page is the same question as the search it belongs to, so it gets the same rule; `keepPreviousData` holds page 1 while page 2 loads. |

What each option means for the person:

- **Row 1.** The first paint already says *In the kitchen*, in the HTML. Every
  five seconds one `GET /api/orders/1001` goes out, never two, though two
  components ask. When the poll says *On the way*, the cancel button goes at
  once (it reads the same cache entry) and `router.refresh()` lets the server
  re-render the rest. On *Delivered* or *Cancelled* the interval becomes 0 and
  the polling stops. A 401, 403 or 404 is shown beside the last good stage,
  and is not retried, because asking again will not change who you are.
  Anything else (the network, a 500) is retried on the poll's rhythm, five
  times.
- **Row 1, after a write.** `cancelOrder` revalidates the page, so the server
  renders the receipt again, and `useOrder` writes that new server answer
  into the cache with `mutate(initial, { revalidate: false })`. The line says
  *Cancelled* in the same response, without waiting up to five seconds for
  the next poll. The same write also covers a receipt opened again later:
  whatever SWR cached on an earlier visit, the server's render replaces it.
- **Row 2.** Typing *kitfo* at normal speed is one request
  ([measured](README.md#what-the-network-tab-shows-while-typing)). Clearing the
  box makes the key `null`: no request, and the server-rendered list is back.
  While *beef* is loading, the answer for *chickpea* stays on screen with
  *Searching for "beef"…* beside it. The list is never empty between terms,
  and never the whole menu either.
- **Race safety, row 2.** If *tib* is answered after *tibs*, the screen
  still shows *tibs*: SWR only returns data for the current key. The browser
  suite slows *tib* to 2 s and *tibs* to 100 ms to check this.

## On the server (no library, nothing to configure in the browser)

| Query | Where | Key or cache entry | Refresh rule | Why |
| --- | --- | --- | --- | --- |
| The menu list on arrival | `app/menu/page.js` → `getMenu()` | the route `/menu` | ISR, `revalidate = 3600` | Same for everyone, indexable, changes a few times a day. Its first paint needs no client fetch at all |
| One dish | `app/menu/[id]/page.js` → `getDish()` | `/menu/[id]`, 13 paths | `generateStaticParams` + 1 h | Prerendered. It shows the list's price, so it shares the list's window |
| One dish, for its `<head>` | `generateMetadata` in `app/menu/[id]/page.js` → `getDish()` | the same render as the page | same as the page | Day 44. `getDish` is wrapped in React `cache()`, so the metadata and the page share one read and one 900 ms wait (26 calls → 13 in a build, measured). The slides say the framework dedupes it; that is only automatic for `fetch` |
| One dish, for its preview picture | `app/menu/[id]/opengraph-image.js` → `readDish()` | `/menu/[id]/opengraph-image`, 13 paths | `generateStaticParams` + 1 h | Day 44. No teaching delay: a separate request nobody watches load. Same window as the page, because the card prints the price |
| The sitemap, the menu's preview | `app/sitemap.js`, `app/menu/opengraph-image.js` → `readMenu()` | `/sitemap.xml`, `/menu/opengraph-image` | 1 h | Day 44. A dish added to the file appears in both within the menu's own hour |
| The home page's specials | `app/page.js` → `readMenu()` | `/` | 1 h | Quotes menu prices |
| The receipt, first paint | `app/orders/[id]/page.js` → `getOrderFor(user.id, id)` → `orderView()` | none, read per request | dynamic | Private to one person, and scoped to the session's account. Someone else's id and a missing id are both `null` → `404`. Its output is handed to query 1 as `fallbackData`, with exactly the endpoint's shape |
| Your orders | `app/orders/page.js` → `listOrdersFor(user.id)` | none, read per request | dynamic | The query is filtered by the session's id; a URL cannot widen it |
| The kitchen board | `app/kitchen/page.js` → `listOrders()` | none, read per request | dynamic | Staff only: `getSession()` and `user.role === "staff"`, or `forbidden()` (`403`). Every order, newest first |
| The checkout's basket and greeting | `app/checkout/page.js` | none, cookies | dynamic | Read from this person's cookies, after `getSession()` verifies the session |
| `GET /api/dishes/[id]` | route handler | 13 paths | `●` 1 h | For outside callers. Same window as the dish page |
| `GET /api/orders/[id]` | route handler | none, read per request | `private, no-store` | The poll's server half. `401` without a session, `403` for someone else's order, `404` for none |
| The session | `getSession()` in pages, actions and handlers | none | read per request; React `cache()` dedupes it inside one request | One JSON lookup, and a page that reads it can no longer be prerendered ([STRATEGY.md](STRATEGY.md)) |

## Considered, and left alone

- **The cart.** It is the browser's own state (a zustand store in
  localStorage), not a server read, so there is no query to write. The
  server sees it only as the basket cookie.
- **TanStack Query.** Its precision (structured keys, `invalidateQueries`)
  pays off with many writes. Addis Eats writes through server actions, and
  the one client cache that a write makes stale is invalidated in one line
  (`mutate`), so the smaller library suits it.
- **`useSWRInfinite`.** Numbered pages were asked for, with the page in the
  address. Infinite scroll has no address for "page 3".
- **Polling the board.** `/kitchen` is rendered on request and staff act on
  it; a client poll would add a request every few seconds for every viewer to
  learn what a refresh already shows. The receipt is the opposite case: its
  stage changes on its own, while nobody is touching the page.
- **Photos in the API (Day 43).** The dish photographs' paths, alt text and
  credits live in `data/photos.json`, not `data/menu.json`, so
  `GET /api/dishes` — the search's only client query — returns exactly what it
  did on Day 42. Only server components read them; they arrive as HTML.
