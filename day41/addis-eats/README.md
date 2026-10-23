# Addis Eats — Day 41: data fetching with SWR

Week 8 moved most of Addis Eats' data onto the server, and none of that
changes today. What is left in the browser is the part the slides call the
hardest: an order status that **polls**, a menu search that runs **as you
type**, and **pages** of results. Day 41 gives those three a library (SWR) in
place of hand-written effects, and seeds the poll from the server so the
first paint never shows a spinner.

- [DATA.md](DATA.md) lists every query, client and server: its key, its
  refresh rule, and one line of reasoning.
- [STRATEGY.md](STRATEGY.md) and [BOUNDARY.md](BOUNDARY.md) are Day 40's,
  updated for today. No route changed its strategy, and no new client
  component was needed.

## Run it

```bash
npm install
cp .env.example .env.local   # then replace the value: openssl rand -base64 32
npm run build
npm run start                # http://localhost:3000
npm run dev                  # for working on it
npm run lint
```

Orders are written to `.data/orders.json`, which is gitignored. Any `09…`
number signs you in. Real authentication is Day 42.

## The steps, and where each landed

| # | Exercise | Where |
| --- | --- | --- |
| 1 | Install SWR, put the fetcher in a shared `lib/fetcher.js` | `swr@2.5.1`. [lib/fetcher.js](lib/fetcher.js) throws a `FetchError` (with `status` and the endpoint's `error` sentence) for every non-OK response. Both client queries use it |
| 2 | Convert the order status to `useSWR`, delete its effect and state | [OrderStatus.jsx](app/orders/[id]/OrderStatus.jsx). The `setInterval`, both `useState`s, the cleanup and the dependency array are gone. The query is [useOrder.js](app/orders/[id]/useOrder.js) |
| 3 | `refreshInterval`, confirmed in the network tab | 5000 ms while the order can still change, 0 once it is delivered or cancelled. Measured: requests at 5.2 s, 10.2 s and 15.2 s after load |
| 4 | Render the order on the server, pass it as `fallbackData` | [app/orders/\[id\]/page.js](app/orders/[id]/page.js) renders the receipt and hands `orderView(order)` to the leaves as `initial`. That is exactly the object `GET /api/orders/[id]` answers with ([lib/orders.js](lib/orders.js)) |
| 5 | A debounced search box with a `null` key for an empty term | [FilterShell.jsx](app/menu/FilterShell.jsx) debounces the term by 300 ms ([useDebounce.js](app/menu/useDebounce.js)). [useDishSearch.js](app/menu/useDishSearch.js) turns it into the key `/api/dishes?q=…`, or `null` |
| 6 | `keepPreviousData`, and the list stops flashing | On in `useDishSearch`. Sampled every 50 ms across a change of term, the list never had zero cards |
| 7 | Paging with the page in the query string, then DATA.md | `GET /api/dishes?q=on&page=2`, four dishes a page. [Pager.jsx](app/menu/Pager.jsx) links to `/menu?q=on&page=2`, and that address opens on page 2. [DATA.md](DATA.md) |

## Decisions

**SWR, not TanStack Query.** This follows the slides' recommendation for
Addis Eats. The browser-side work is one poll and one search box, and every
write is a server action. The one client cache that a write makes stale is
fixed with one `mutate`. TanStack Query's mutation system and devtools would
be paying for writes this app does not make in the browser. SWR's chunk is
5.7 kB gzipped, and only `/menu` and the receipt load it.

**The receipt: the server's answer, then the poll.** The page reads the
order, renders it, and passes it to `useOrder` as `fallbackData`. Two
options are set on purpose:

- `revalidateOnMount: false`. The server read this order a moment ago, so a
  request at hydration would only fetch what is already on screen. The
  measurement shows no request until the first 5-second tick.
- Every time the server renders the receipt again, `useOrder` writes the new
  server answer into the cache (`mutate(initial, { revalidate: false })`).
  That covers three cases: after a cancel (the action revalidates the page),
  after the poll's `router.refresh()`, and on a later visit, so a cached value
  can never be older than the page around it. Because of this, the line says
  *Cancelled* in the same response as the cancel, without waiting up to five
  seconds for the next poll.

**Two components, one key.** `CancelOrderButton` now reads the same query as
the status line. When a poll says *On the way*, the button hides itself at
once, without waiting for the server to re-render. This is also the
deduplication check: two `useSWR` calls with the key `/api/orders/1001`, and
one request every five seconds. `cancelOrder` still answers 409 by itself.
Hiding the button is interface only.

**Errors stop the poll.** The fetcher throws, so a 401 (signed out in another
tab), 403 or 404 becomes `error` and appears beside the last good stage:
*In the kitchen · Not signed in.* A 4xx is not retried, because asking again
will not make the order yours. SWR also skips interval ticks while the key is
in error. The suite counts exactly one request after the session disappears,
and none in the next 11 s.

**The search asks the server, but the cards stay server HTML.** Day 40
filtered by name in the browser, from an `index` of names the page sent.
Today the term goes to `GET /api/dishes?q=`, which also searches the
descriptions: *chickpea* finds Shiro, which the name filter could not do. The
answer only says *which* dishes. `FilterShell` shows and hides the
server-rendered cards by id, as it did for the category. A search never
draws a card in the browser, the cards' code still never ships (BOUNDARY.md),
and `index` lost its names. With an empty box the key is `null`, and the list
is the server's, filtered by category, exactly as before.

**Paging lives inside the search.** The list on arrival is all thirteen
dishes, server-rendered and static. That is the slides' "page one is still
the server's", and paging it would mean either reading `searchParams` (which
turns `/menu` into `ƒ`) or drawing cards in the browser. A search is where a
long result arrives, so a search is what pages: four dishes a page, and
`page` is part of the key and of the address. Choosing another category or
another term starts again from page 1. The page is stored together with the
search it belongs to, so no effect is needed to reset it.

**The address is the result.** `/menu?category=Main&q=on&page=2` is written
with `history.replaceState` once the debounce has settled. It is read back
after hydration, because the prerendered page cannot see the query string.
Day 40's category code rewrote the whole query string, and that would have
wiped the search, so [menuUrl.js](app/menu/menuUrl.js) lets each owner write
only its own keys. The pager's links are real `href`s, so Ctrl-click and
*Copy link* work, while a plain click only changes the key.

**An empty box is not debounced.** Clearing the box makes no request, so
there is nothing to wait for. Without this exception, clearing the box and
then clicking a category within 300 ms searched the old term in the new
category for a moment. The Day 40 regression suite caught it.

**The search's refresh rule.** `revalidateIfStale: false` and
`revalidateOnFocus: false`. The list these results sit in is up to an hour
old (ISR), so an answer is good for as long as the tab is open. Typing
*kitfo* a second time made no request. Reconnecting still revalidates (the
default), because on a dropped connection the answer on screen may be a
failure.

## What the network tab shows while typing

Measured in headless Chromium against `npm run start`, counting every
request to `/api/dishes`:

| Typed | Requests | What they were |
| --- | --- | --- |
| Arriving on `/menu` | **0** | The key is `null`. The list is the prerendered HTML |
| `kitfo`, five characters 120 ms apart (typing speed) | **1** | `?q=kitfo`, 300 ms after the last key |
| `garli`, five characters 450 ms apart (each pause longer than the debounce) | 5 | `?q=g`, `?q=ga`, `?q=gar`, `?q=garl`, `?q=garli` |
| Clearing the box | **0** | Back to the `null` key |
| `kitfo` again | **0** | From SWR's cache (`revalidateIfStale: false`) |
| `beef` with every answer slowed to 1.2 s | 1 | For 1.2 s the list keeps *chickpea*'s answer (Shiro) and the status line says *Searching for "beef"…*. Then Tibs and Kitfo replace it. The list is never empty |
| `tib`, a pause, then `s`, with `tib`'s answer slowed to 2 s | 2 | `tibs` answers first and `tib` arrives last. The screen stays on *1 dish matches "tibs"* |

So five characters typed at a normal pace fire **one** request, not five. A
request per keystroke appears only when every pause is longer than 300 ms,
and then each request is for a word the person paused on. During a slow
answer, the old answer stays visible (keepPreviousData). A late answer for
an old key never replaces the current one (race safety).

## The endpoint, changed

`GET /api/dishes` now answers with a page, always the same shape:

```
$ curl -s "localhost:3041/api/dishes?q=chickpea"
{"dishes":[{"id":2,"slug":"shiro","name":"Shiro",…}],"page":1,"pages":1,"pageSize":4,"total":1}

$ curl -s "localhost:3041/api/dishes?q=on&page=2"
{"dishes":[…Tej, Baklava, Kolo Cake…],"page":2,"pages":2,"pageSize":4,"total":7}

$ curl -s "localhost:3041/api/dishes?q=on&page=9"          # a stale link
{"dishes":[],"page":9,"pages":2,"pageSize":4,"total":7}       200

$ curl -s "localhost:3041/api/dishes?q=on&category=Main"
{"dishes":[…Shiro, Tibs, Beyaynetu…],"page":1,"pages":1,"pageSize":4,"total":3}

$ curl -s "localhost:3041/api/dishes?page=0"
{"error":"\"page\" must be a whole number from 1, not \"0\"."}  400
$ curl -s "localhost:3041/api/dishes?page=two"
{"error":"\"page\" must be a whole number from 1, not \"two\"."}  400
$ curl -s "localhost:3041/api/dishes?category=Pizza"
{"error":"Unknown category \"Pizza\". Use Main, Side, Drink or Dessert."}  400
$ curl -s "localhost:3041/api/dishes?q=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
{"error":"Search for at most 40 characters."}  400
```

Day 40's answer to *"which part of the application calls `/api/dishes`?"*
was *"none"*. Today it is the menu's search box, because what is typed can
only be fetched by the browser.

## Route table

`npm run build`, Next.js 16.4.2. It is identical to Day 40's: everything
added today runs in the browser, after the page has been served exactly as
before.

```
Route (app)                 Revalidate  Expire
┌ ○ /                               1h      1y
├ ○ /_not-found
├ ƒ /api/dishes
├   /api/dishes/[id]
│ ├ ● /api/dishes/doro-wat          1h      1y
│ ├ ● /api/dishes/shiro             1h      1y
│ ├ ● /api/dishes/tibs              1h      1y
│ └ ● [+10 more paths]
├ ƒ /api/orders
├ ƒ /api/orders/[id]
├ ○ /cart
├ ƒ /checkout
├ ƒ /login
├ ○ /menu                           1h      1y
├   /menu/[id]
│ ├ ● /menu/doro-wat                1h      1y
│ ├ ● /menu/shiro                   1h      1y
│ ├ ● /menu/tibs                    1h      1y
│ └ ● [+10 more paths]
├ ○ /orders
└ ƒ /orders/[id]
```

First Load JS for `/menu`, measured the same way as Day 40 (every
`<script src>` in the HTML, gzipped as served): **151.1 kB**, up from 144.2 kB.
The 6.9 kB is SWR's chunk (5.7 kB) and the search and pager code.

## Check yourself

| Question | Answer |
| --- | --- |
| Does typing five characters fire one request or five? | One, at typing speed: `?q=kitfo`. Five only if every pause is longer than 300 ms. [Table above](#what-the-network-tab-shows-while-typing) |
| Does the order page show data immediately, with no spinner? | Yes. The server's HTML already contains `<strong>In the kitchen</strong>`, and every early sample of the line during load was *In the kitchen*. There is no loading branch to show |
| Do two components asking for the same key produce one network call? | Yes. `OrderStatus` and `CancelOrderButton` both use `/api/orders/1001`: three requests in 16.5 s, 5.0 s apart, never two in the same tick |
| Does the list keep previous results visible while the next load runs? | Yes, for a new term and for the next page. Checked with every answer slowed to 1–1.2 s |
| Can you justify every refreshInterval and staleTime in one sentence? | Yes, one line each, in [DATA.md](DATA.md) |

The slides' review questions:

1. **Three kinds of fetching that stay in the browser, and what they share.**
   Polling an order, search as you type, pages after the first. Each is
   triggered by the person, repeated, or both, so the server cannot know in
   advance what to render.
2. **Two components, same key: how many requests?** One. The key is the
   cache entry, and calls within the deduplication window share the request
   already in flight.
3. **Why `null` instead of an `if` around the hook?** Hooks must be called in
   the same order on every render. `null` says "not now" and still calls the
   hook.
4. **`staleTime` against `gcTime`.** How long an answer counts as fresh, so
   it is not refetched, against how long an unused answer is kept at all.
   SWR's nearest equivalents are `revalidateIfStale` and the cache's lifetime,
   which for SWR is the tab's.
5. **"tib" answered after "tibs": what stops the wrong list?** SWR only
   returns data for the current key, and the late answer for `tib` is filed
   under `tib`. The suite slows `tib` to 2 s to check it.
6. **What does `fallbackData` change on first paint?** The hook returns the
   server's order instead of `undefined`, so there is no loading state. The
   HTML is complete before any JavaScript runs.

## Verified

On the production build (`npm run build && npm run start -p 3041`, `.data/`
cleared first):

| Check | Result |
| --- | --- |
| `npm run build` | Passes; the route table above, unchanged from Day 40 |
| `npm run lint` | No warnings, no errors |
| `curl` `/api/dishes` | Every answer in the transcript above: 200 pages, the stale page, 400 ×4 kinds |
| `"use client"` files | Still 15 (`grep -rln '^"use client"' app components cart lib`) |

In headless Chromium (playwright-core), **98 checks, all passed**:

- **38, today's suite** ([the three problems](#what-the-network-tab-shows-while-typing)):
  - The receipt's HTML has the stage, and its first paint is never a loading
    state.
  - No request at hydration, then three polls 5.0 s apart, shared by the two
    components.
  - Signed out underneath: the 401 is shown in words, and the poll stops.
  - An order aged to 117 s: the poll says *On the way* and the cancel button
    goes at once.
  - Cancelling shows *Cancelled* at once, and a cancelled order is not
    polled.
  - With JavaScript off, the receipt still shows its stage.
  - Search: 0 requests on arrival, 1 for five characters, 5 for slow typing,
    0 to clear, 0 from the cache. *chickpea* finds Shiro.
  - keepPreviousData, for a new term and for the next page, checked with
    every answer slowed. The race with `tib` answered last.
  - Paging and its addresses. A shared `?q=on&page=2` and
    `?category=Main&q=on` open as they were. A stale `?page=7` says so.
  - A category change keeps the term and drops the page. Clearing everything
    returns `/menu` with 13 cards. The 400 for a long term.
- **39, Day 40's suite, unchanged:** guard, sign-in, checkout, 422s, the
  no-JavaScript order, the console attack (403 and 401), and the receipt
  polling `GET /api/orders/[id]` with 200s every ~5 s. It passed against the
  SWR version without edits.
- **8, Day 40's six failure checks**, and **3 on order stages**.
- **10 regressions.** Day 40's, with one edit: the search check now waits
  for the server's answer instead of expecting the filter to be instant.

The only console errors were the ones the suites cause on purpose: the 401
after clearing the cookies, the 400 for the 41-character term, B's 404 and
B's 403.

## Deviations, honestly

- **`SearchBox.jsx` is not one file.** The slides list
  `app/menu/SearchBox.jsx` as "debounced, null key, keepPreviousData". Here
  the input is still Day 33's `SearchBar.jsx`. The query is
  `useDishSearch.js`, the debounce is `useDebounce.js`, and `FilterShell` uses
  both, because the results are shown by hiding and showing server HTML
  rather than drawn by the search box.
- **Paging is paging of search results**, not of the list on arrival. The
  reasons are under Decisions. A shared link to a search opens with the full
  list for one moment: the static HTML cannot know the query string, so the
  search starts after hydration, plus 300 ms of debounce.
- **The `GET /api/dishes` response changed shape** from an array to a page
  object. Its only caller is our own search box and curl, so nothing outside
  broke. A real public API would version this change.
- **`fallbackData` is used with `revalidateOnMount: false`** and an effect
  that writes each new server render into the cache. The slides show
  `fallbackData` on its own. On its own, SWR would refetch at hydration, and a
  cached answer from an earlier visit would win over a newer server render.
- **TanStack Query was read about, not installed.** There is one library, and
  DATA.md says why.

## What changed from Day 40

| File | Change |
| --- | --- |
| `package.json` | `swr` |
| `lib/fetcher.js` | New: the shared fetcher, throwing `FetchError` on non-OK |
| `app/orders/[id]/useOrder.js` | New: the order's query, key, poll, error rule and cache seeding |
| `app/orders/[id]/OrderStatus.jsx` | The effect and state replaced by `useOrder` |
| `app/orders/[id]/CancelOrderButton.jsx` | Reads the same query and hides itself when the order leaves the kitchen |
| `app/orders/[id]/page.js` | Passes `initial` (`orderView`) instead of `stage` and `label`; no `key` |
| `lib/orders.js`, `app/api/orders/[id]/route.js` | `orderView()`: one shape for the first paint and the poll |
| `lib/menu.js`, `app/api/dishes/route.js` | `searchDishes()`, `?q=` and `?page=`, the page envelope, 400s |
| `app/menu/useDishSearch.js`, `useDebounce.js`, `Pager.jsx`, `menuUrl.js` | New |
| `app/menu/FilterShell.jsx` | The server search, the page, the status line and the pager, plus restoring and writing the address |
| `app/menu/MenuFilterProvider.jsx` | Writes only `category` in the address |
| `app/menu/page.js` | `index` without names |
| `app/menu/SearchBar.jsx`, `app/globals.css` | Placeholder; status line and pager styles |
| `DATA.md` | New |
| `STRATEGY.md`, `BOUNDARY.md`, `README.md` | Updated for the day |
