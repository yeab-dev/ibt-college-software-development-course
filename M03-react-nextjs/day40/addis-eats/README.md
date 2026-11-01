# Addis Eats — Day 40: the Next.js foundations project

Addis Eats as one complete Next.js application, using everything from Days 36
to 39:

- file-based routing with nested layouts and every special file;
- a rendering strategy per route, written down and matched against the build
  output;
- server components that read their own data, with `"use client"` only on the
  interactive leaves;
- its own endpoints and server actions, validated with the shared Day 33
  schema and authorised inside the action.

The checkout places orders with JavaScript switched off. All of it is
verified on the production build, with curl and in a browser, and from a
fresh clone.

[STRATEGY.md](STRATEGY.md) gives the reason for every route's strategy.
[BOUNDARY.md](BOUNDARY.md) says which side every component runs on, and why.

> **The capstone.** Day 40 also asks for the capstone to be migrated to
> Next.js. That migration lives in the separate **Hakim** repository, with
> its own STRATEGY.md and BOUNDARY.md. It is not part of this folder.

## Run it

```bash
npm install
cp .env.example .env.local   # then replace the value: openssl rand -base64 32
npm run build
npm run start                # http://localhost:3000, the build you are assessed on
npm run dev                  # for working on it
npm run lint
```

Orders are written to `.data/orders.json`, which is gitignored. Delete it to
start again from order 1001. Any `09…` number signs you in. Real
authentication is Day 42.

## The brief, route by route

| Route | Brief | Built | What it does |
| --- | --- | --- | --- |
| `/` | Static | `○` 1h | Landing page with today's three specials |
| `/menu` | ISR | `○` 1h | Server-rendered dishes, search, a category sidebar in the layout |
| `/menu/[id]` | Static via params | `●` 1h, 13 paths | One dish, *Add to order* |
| `/cart` | Client | `○` shell | The basket and its running ETB total, from the browser's store |
| `/checkout` | Dynamic | `ƒ` | Guarded. The `placeOrder` server action, validated on the server, working without JavaScript |
| `/login`, `/orders`, `/orders/[id]` | (Day 39) | `ƒ`, `○`, `ƒ` | The stand-in sign-in, the kitchen board (rebuilt by `revalidatePath`) and the owner-only receipt with live status |

### Decision 1: the folder tree

Written out before anything was added today, and built exactly like this:

```
app/
  layout.js  page.js  not-found.js  error.js  global-error.js  providers.jsx  actions.js
  menu/      layout.js  page.js  loading.js  error.js  not-found.js
             [id]/page.js
             AddToCartButton  CategoryBar  CategorySidebar  Dish  DishList
             DishSkeleton  FilterShell  MenuFilterProvider  SearchBar
  cart/      page.js  CartContents.jsx
  checkout/  layout.js (force-dynamic)  page.js  Checkout.jsx  customerCookie.js
  login/     page.js  LoginForm.jsx
  orders/    page.js
             [id]/page.js  CancelOrderButton.jsx  OrderStatus.jsx
  api/       dishes/route.js  dishes/[id]/route.js
             orders/route.js  orders/[id]/route.js
components/  SiteHeader  SiteFooter  CartBadge  NavTabs  Field
lib/         menu  orders  session  validate  orderStage  apiError  categories  formatTime
cart/        cartStore  basketCookie
```

Code shared by more than one route lives at the root, in `lib/`,
`components/` and `cart/`. Only route-specific components sit inside `app/`.
The layouts nest three deep: root → menu (sidebar), and root → checkout
(segment config only).

**The special files.** These are present: the root `layout`, `page`,
`not-found`, `error` and `global-error`, and the menu's `layout`, `loading`,
`error` and `not-found`. Two more were written today and then deleted:
`checkout/loading.js` and `orders/loading.js`. They broke the guard's 307 and
the no-JavaScript checkout ([STRATEGY.md](STRATEGY.md#a-special-file-that-was-tried-and-removed)
explains how).

### Decisions 2 and 3: the strategy and the boundary

In their own documents: [STRATEGY.md](STRATEGY.md), one line of reasoning per
route, checked row by row against the build output below; and
[BOUNDARY.md](BOUNDARY.md), one line per client component. It counts 12
interactive client components plus 3 error boundaries, groups them by what
they serve, and lists what Day 40 removed.

### Decision 4: how data moves

| What | How | Where |
| --- | --- | --- |
| Menu and dish data | Server component | `app/menu/page.js` and `[id]/page.js` await `lib/menu.js` directly. There is no endpoint in between |
| The kitchen board, a receipt | Server component | `app/orders/page.js`, `app/orders/[id]/page.js` read `lib/orders.js` |
| Placing an order | Server action | `placeOrder`, from the checkout form |
| Cancelling, signing in and out | Server actions | `cancelOrder`, `signIn`, `signOut` |
| Order status polling | Client fetch to a handler | `OrderStatus.jsx` → `GET /api/orders/[id]` every 5 s |
| Orders and dishes for callers outside the UI | Route handlers | `POST /api/orders`, `GET /api/dishes`, `GET /api/dishes/[id]` |
| Cart contents | Client store | localStorage. Only ids and quantities reach the server, in a cookie, for the checkout to price |

**Who calls `/api/dishes`?** Nothing in this application. The menu is a
server component and reads the file itself. Calling our own endpoint from
our own server would be the mistake the reading sheet warns about. The
dishes API is for outside callers (a mobile app, a partner listing), and
today that is curl. The handler that *is* called by the UI is
`GET /api/orders/[id]`, built because the polling client needs it.

## Route table

`npm run build`, Next.js 16.4.2. This is the build output the brief asks for
in the README:

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


○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

Every marker matches STRATEGY.md (its last table puts them side by side).
One row changed today because of what the strategy table said:
`/api/dishes/[id]` went from `ƒ` to `●`.

## The endpoints

One error shape for every failure: `{ "error": "…" }`, plus `fieldErrors`
when a field is to blame ([lib/apiError.js](lib/apiError.js)).

| Method | Path | Status codes | Called by |
| --- | --- | --- | --- |
| `GET` | `/api/dishes` (`?category=`) | **200** · **400** unknown category | outside callers |
| `GET` | `/api/dishes/[id]` | **200** · **404** `{"error":"No such dish"}` | outside callers |
| `POST` | `/api/orders` | **201** the order · **400** not JSON, or not an object · **422** `fieldErrors` · **503** `?fail=1` | outside callers |
| `GET` | `/api/orders/[id]` | **200** with `stage` · **401** no session · **403** not yours · **404** no such order | the receipt's `OrderStatus` |
| other methods | the paths above | **405** (Next.js; the method is not exported) | |

| Server action | Status it reports | Called by |
| --- | --- | --- |
| `placeOrder(prev, formData)` | not signed in; `fieldErrors`; kitchen offline; on success, a redirect to the receipt | the checkout form |
| `cancelOrder(orderId)` | `{ ok, status: 401 \| 403 \| 404 \| 409, error }` | the receipt's button |
| `signIn(prev, formData)`, `signOut()` | `fieldErrors`, or a redirect | `/login`, checkout |

Both write paths validate with the same schema. `POST /api/orders` and
`placeOrder` both end in `createOrder()` ([lib/orders.js](lib/orders.js)),
which runs Day 33's `validate()` from [lib/validate.js](lib/validate.js), the
same file the checkout runs in the browser on every keystroke.

### Proved with curl

Against `npm run start -p 3040`, response headers trimmed:

```
$ curl -i localhost:3040/api/dishes/kitfo
HTTP/1.1 200 OK
x-nextjs-cache: HIT
cache-control: s-maxage=3600, stale-while-revalidate=31532400
{"id":4,"slug":"kitfo","name":"Kitfo","price":260,"currency":"ETB","category":"Main","spicy":true,…}

$ curl -i localhost:3040/api/dishes/not-a-dish
HTTP/1.1 404 Not Found
{"error":"No such dish"}

$ curl -i "localhost:3040/api/dishes?category=Pizza"
HTTP/1.1 400 Bad Request
{"error":"Unknown category \"Pizza\". Use Main, Side, Drink or Dessert."}

$ curl -i -X POST localhost:3040/api/orders -H "Content-Type: application/json" \
    -d '{"name":"Almaz","phone":"0912"}'
HTTP/1.1 422 Unprocessable Entity
{"error":"Validation failed","fieldErrors":{"phone":"Use 09… or +2519… — a TeleBirr number has 10 digits","area":"Choose a delivery area"}}

$ curl -i -X POST localhost:3040/api/orders -H "Content-Type: application/json" -d 'nope'
HTTP/1.1 400 Bad Request
{"error":"The body must be JSON."}

$ curl -i -X POST localhost:3040/api/orders … -d '{…,"items":[{"id":999,"quantity":1}]}'
HTTP/1.1 422 Unprocessable Entity
{"error":"Validation failed","fieldErrors":{"items":"The basket is empty — add a dish from the menu first"}}

$ curl -i -X POST "localhost:3040/api/orders?fail=1" … -d '{}'
HTTP/1.1 503 Service Unavailable
{"error":"The kitchen is not taking orders right now. Nothing was charged — try again in a minute."}

$ curl -i -X POST localhost:3040/api/orders -H "Content-Type: application/json" \
    -d '{"name":"Dawit Haile","phone":"+251 944 55 66 77","area":"Megenagna","notes":"",
         "items":[{"id":3,"quantity":1},{"id":12,"quantity":2}]}'
HTTP/1.1 201 Created
{"id":"1004","status":"placed","name":"Dawit Haile","phone":"0944556677","area":"Megenagna","notes":"","lines":[…Tibs 180 ×1, Baklava 80 ×2…],"total":340,"currency":"ETB",…}

$ curl -i -X DELETE localhost:3040/api/orders
HTTP/1.1 405 Method Not Allowed

# B signed in by posting /login's form with curl: 303 → /menu (and C the same way)
$ curl -i localhost:3040/api/orders/1002                 # no cookie
HTTP/1.1 401 Unauthorized
{"error":"Not signed in."}
$ curl -i -b B.jar localhost:3040/api/orders/1002        # B's own
HTTP/1.1 200 OK
cache-control: private, no-store
{"id":"1002","status":"placed","name":"Bereket",…,"stage":"kitchen","stageLabel":"In the kitchen"}
$ curl -i -b B.jar localhost:3040/api/orders/1003        # C's
HTTP/1.1 403 Forbidden
{"error":"That order is not yours."}
$ curl -i -b B.jar localhost:3040/api/orders/99999
HTTP/1.1 404 Not Found
{"error":"No such order."}
```

### Attacking my own action

`cancelOrder` is a POST endpoint whose id is printed in the HTML of every
receipt. The form needs it to work without JavaScript. From the console of
their **own** receipt, B takes the id and sends it with somebody else's order:

```js
const { id } = JSON.parse(document.querySelector('input[name="$ACTION_1:0"]').value);
await (await fetch(location.href, {
  method: "POST",
  headers: { "Next-Action": id, "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify(["1001"]),            // A's order
})).text();
// → '…1:{"ok":false,"status":403,"error":"That order is not yours."}'
```

The same attack from curl, with the id read from B's receipt:

```
B → cancelOrder("1003") (C's)        1:{"ok":false,"status":403,"error":"That order is not yours."}
no cookie → cancelOrder("1003")      1:{"ok":false,"status":401,"error":"Not signed in."}
forged cookie (C's phone, B's sig)   1:{"ok":false,"status":401,"error":"Not signed in."}
B → cancelOrder("99999")             1:{"ok":false,"status":404,"error":"No such order."}
B → cancelOrder("1002") (own)        1:{"ok":true,"message":"Order 1002 is cancelled. Nothing will be charged."}
B → cancelOrder("1002") again        1:{"ok":false,"status":409,"error":"Order 1002 is already cancelled."}
```

The check is inside the action: the session comes from a signed `httpOnly`
cookie, and it is compared with the order's owner before anything is
written. The page also hides the button from everyone but the owner. That is
interface, and the attack does not go through it.

## The six failure checks, on the production build

| Do this | And check | Result |
| --- | --- | --- |
| Throttle to Slow 3G | `loading.js` appears; the shell is already there | **Pass, with a finding.** Every `/menu` page is prerendered, so under Slow 3G `/menu/doro-wat` paints finished at 2.1 s, with no loading state to show. The menu route that renders on request is a slug the build did not know. Cold-loading one under Slow 3G painted the header, the sidebar and `menu/loading.js`'s skeleton at 2.2 s, and the not-found page replaced them at 8.5 s |
| Throw inside the menu page | `error.js` renders, header and cart survive | **Pass.** *Simulate a broken kitchen* throws during the menu page's render. `app/menu/error.js` replaces the page, and the header, the sidebar and the badge (still *1 item*) stay. *Try again* brings the menu back. Also checked: a server-side throw outside the menu (an unreadable order store under `/orders/1001`) lands in the new `app/error.js`. The header and basket are kept, the message is hidden, a digest is shown, and *Try again* (`retry`) recovers once the store is back |
| Open `/menu/not-a-dish` | `not-found.js`, not a crash | **Pass.** 404 status, and the new `app/menu/not-found.js` (*No such dish*) inside the menu layout with the sidebar. `/some/bad/url` gets the root `not-found.js` |
| Post an invalid phone number | 422, and the message beside the field | **Pass.** curl gets 422 with `fieldErrors.phone`. The form shows the server's message under the phone field, focus moves there, and every value is kept |
| Disable JavaScript, submit | The server action still places the order | **Pass.** In a context with `javaScriptEnabled: false`, the checkout lists the basket from the cookie. An invalid phone comes back as a server-rendered error beside the field, and a valid order lands on its receipt and on the board. Sign-in, sign-out and the guard also work without scripts |
| Search the bundle for a secret | Nothing sensitive is there | **Pass.** In `.next/static`: the `SESSION_SECRET` value, 0 files. Its name, 0. `createHmac`, `orders.json`, `0900000000`, *That order is not yours*: 0 each. The value is not in `.next/server` either, because it is read at request time |

## Requirements, and where each is met

| Project requirement | Met by |
| --- | --- |
| Five routes as folders, layouts nested, all special files present | The tree above. Root and menu layouts nest. The special files are listed under Decision 1 |
| A rendering strategy per route matching the build marker exactly | STRATEGY.md's last table, against the route table above |
| Server components fetching data, `"use client"` only on interactive leaves | Every page is a server component that reads its own data. BOUNDARY.md lists the 15 directive files and why each one has it |
| One route handler and one server action, both validating with the shared schema | `POST /api/orders` and `placeOrder`, both through `createOrder()` → `lib/validate.js` |
| Authorisation inside the action | `cancelOrder` (session, then owner) and `placeOrder` (session). Attacked above |
| STRATEGY.md, BOUNDARY.md and the build output in the README | Both files, and [Route table](#route-table) |

| From day | Must appear | Where |
| --- | --- | --- |
| 36 | Folder routing, a dynamic segment, loading and error files | `app/` folders. `menu/[id]`, `orders/[id]`, `api/*/[id]`. `menu/loading.js`, three `error` files, two `not-found` files |
| 37 | Nested layouts, a justified strategy for every route | `app/menu/layout.js` inside the root layout; STRATEGY.md |
| 38 | Server components fetching data; `"use client"` on leaves only | BOUNDARY.md |
| 39 | One route handler, one server action, server-side validation | Four handlers, four actions, one schema |
| Earlier | The cart, the form, the guard, carried across and working | The Day 32 cart store and Day 33's form, rules and `Field` markup are reused as they were. Day 31's guard runs on the server now. All are exercised by the browser checks |

| Not done | Done | Here |
| --- | --- | --- |
| It works in `npm run dev` | It works from `npm run build` and `start` | Every check below ran on `start` |
| Every route says λ | Each marker matches the written intent | 5 static rows, 2 prerendered-from-params groups, 6 dynamic, each justified |
| `"use client"` everywhere | A boundary you can defend line by line | BOUNDARY.md |
| The form posts and hopes | Status codes handled, errors shown | 401/403/404/409/422/503 all reach the person as words |
| Validation only in the browser | The same schema enforced server-side | `lib/validate.js` on both sides |
| A secret in the bundle | Nothing sensitive readable by the client | The bundle search |

## First Load JS for `/menu`: Day 35 against today

There is no Day 35 folder in this repository. The last Vite build of Addis
Eats is Day 34's (`day34/addis-eats/dist`), so it stands in for the before. A
Vite single-page app loads one entry chunk for `/menu`. For the Next.js days,
every `<script src>` in the `/menu` HTML was summed (leaving out the `noModule`
polyfill), fetched gzipped from `next start`, with one script used for all
three days:

| Build | Scripts | Raw | Gzip |
| --- | --- | --- | --- |
| Day 34, Vite (`index-….js`; Checkout and Receipt are lazy) | 1 | 270.2 kB | **84.0 kB** |
| Day 38, Next.js | 9 | 475.3 kB | 143.3 kB |
| Day 39 | 9 | 475.9 kB | 143.5 kB |
| **Day 40** | 10 | 476.3 kB | **144.2 kB** |

**It went up, by 60 kB gzipped.** Honestly, the framework costs more than it
saves on a page this small. About 129 kB of today's figure is React plus the
Next.js runtime and router (the App Router's client, which reads RSC
payloads), against React DOM plus React Router on Vite. What the browser gets
for it is different, not smaller:

- the menu's HTML arrives rendered, thirteen cards included, so the first
  paint does not wait for any of that JavaScript;
- the cards' code is not in the bundle at all (Day 38's proof still holds);
- there are no fetching hooks and no loading flags, because the data was read
  on the server.

Today's +0.7 kB is two small chunks every page now loads: the root
`app/error.js` and `app/global-error.js`, which are client components by
necessity. (Day 38's README measured 139.9 kB with a slightly different
script. All four rows above were measured the same way, on the same machine.)

## Check yourself

| Question | Answer |
| --- | --- |
| Does every marker in the build output match STRATEGY.md? | Yes, row by row, in STRATEGY.md's last table |
| How many client components, and can you defend each one? | 12, plus 3 error boundaries. Each has its one line in BOUNDARY.md, grouped as cart (4), menu filter (3), forms with server answers (3), the poller and the tabs |
| Which part of the application actually calls `/api/dishes`? | None. Server components read the menu directly. `/api/orders/[id]` is the one handler the UI calls, from the polling status line |
| What did First Load JS for `/menu` do between Day 35 and today? | Up from 84.0 kB (Vite, Day 34's build) to 144.2 kB gzip. Above, with why |
| Does the checkout still work with JavaScript disabled? | Yes: errors beside the fields, the order placed, the receipt shown |
| Can you find any secret in the JavaScript the browser downloaded? | No |
| Does it build and run from a fresh clone? | Yes: the same route table, and all 60 checks passed on the clone's build. See [Verified](#verified) |

The slides' review questions:

1. **Which route changed strategy once the justification was written down?**
   `/api/dishes/[id]`, from `ƒ` to `●`. STRATEGY.md tells the story. Two
   special files were also removed once their effect on a dynamic route was
   written down.
2. **How many client components, and can you defend each?** Above.
3. **Which part calls `/api/dishes`?** Nothing. That is the honest answer, and
   it is why the UI's one handler call is the status poll.
4. **First Load JS for `/menu`?** Up. See the table.
5. **The curl command that proves the orders endpoint validates:**
   `curl -i -X POST localhost:3040/api/orders -H "Content-Type: application/json" -d '{"name":"Almaz","phone":"0912"}'`
   → `422` with `fieldErrors.phone`.
6. **What broke first in the capstone migration?** That is answered in the
   Hakim repository, where the migration lives.

## Walkthrough (eight minutes, from `npm run start`)

| Minutes | Show |
| --- | --- |
| 0–1 | The brief's five routes, plus `/login`, `/orders`, `/orders/[id]` and the four handlers |
| 1–3 | Menu → search → a category → a dish (the category stays) → add → cart → checkout (redirects to sign-in) → `0900 000 000` (the server's error beside the field) → a real order → the receipt's live status → the kitchen board |
| 3–5 | The route table next to STRATEGY.md, and `/api/dishes/[id]`, the route that changed its mind |
| 5–7 | BOUNDARY.md's twelve, and the First Load JS table |
| 7–8 | The 422 curl, and the console attack on `cancelOrder` |

## Verified

On the production build (`npm run build && npm run start -p 3040`, with
`.data/` cleared first):

| Check | Result |
| --- | --- |
| `npm run build` | Passes; the route table above |
| `npm run lint` | No warnings, no errors |
| `curl` every endpoint | Every status code in the endpoint table: 200, 400 (×3 kinds), 401, 403, 404, 405, 422 (×2 kinds), 201, 503. The `●` dish endpoint answers `HIT` |
| `curl` the actions | `cancelOrder`: 403, 401, 401 for a forged cookie, 404, 200, then 409. `signIn` posted as a plain form → 303 |
| `server-only` | Importing `lib/session.js` into `OrderStatus.jsx` fails the build (then reverted) |
| Bundle search | See the sixth failure check |

In headless Chromium (playwright-core), **60 checks, all passed**:

- **39**, the Day 39 suite carried over, plus the poller. Guard, sign-in and
  the httpOnly session. The basket cookie and the server-priced lines. Client
  validation stopping the action. The server's 422 beside the field with
  focus and every value kept, the select included. `?fail=1`. The redirect to
  the receipt, and the cart, cookie and localStorage all emptied. The
  returning-customer greeting. The board updated at once. B's 404 on A's
  receipt, and B's 403 from `GET /api/orders/[id]`. The console attack
  refused, as B and with no session. A cancelling their own order. The full
  no-JavaScript checkout. The receipt polling `GET /api/orders/[id]` (200s,
  about every 5 s, no `userId` in the body).
- **8**, the failure checks above.
- **3** on order stages. An order aged to 117 s shows *In the kitchen* and the
  cancel button. Within one poll it shows *On the way*, `router.refresh()`
  re-renders the receipt without the button, and the API agrees.
- **10** regressions. Search hides cards in the server HTML. The category
  sidebar and the URL. `menu/error.js` with *Try again*. The cart after a
  reload, and *Remove one* (the cookie follows). `/menu/pizza` showing the
  menu's not-found. The category chosen in the layout surviving a visit to a
  dish and still applied back on `/menu`.

The only console errors were the two the suite causes on purpose: B's 404
and B's 403.

**From a fresh clone.** After committing (`c22018d`), the repository was
cloned into a scratch directory. In `day40/addis-eats` the steps were exactly
those in [Run it](#run-it): `npm ci` (341 packages), then
`cp .env.example .env.local` with a new random secret, then `npm run build`,
then `npm run start -p 3040`.

- The clone holds no `.env.local`, `.data/`, `.next/` or `node_modules/`, only
  `.env.example`.
- Its route table is identical to the one above.
- The same suites ran against it: 39 + 8 + 3 + 10, all passed.
- The curl transcript is identical apart from timestamps and the action id,
  which a new build changes. That includes the attack: 403, 401, 401, 404,
  200, 409.
- Its bundle does not contain its secret.

## Deviations, honestly

- **Two loading files written and removed**, and `menu/loading.js` kept. The
  reasons are in STRATEGY.md. One more consequence, found while testing:
  with JavaScript off, a dish slug the build did not know shows the menu's
  skeleton rather than *No such dish*. The streamed page is in the HTML, but
  it needs an inline script to swap it in. The status is still a correct 404,
  and every prerendered page is complete HTML.
- **Error boundaries use `retry`** (stable since Next.js 16.3), where the
  course knows only `reset`. The menu's boundary keeps `reset` on purpose,
  because its failure is browser state that a fresh mount clears.
- **The slow-3G check** is shown on a cold load of an on-demand slug, because
  prerendered pages have nothing to stream (see the table).
- **Day 33's schema is not zod**, so `fieldErrors` values are strings.
  `params` is a Promise in Next.js 15 and later. Actions return `{ error }`
  rather than throwing, because production would hide a thrown message.
  (All carried over from Day 39.)
- **Removed:** the sidebar's layout counter and the render counters. These
  were teaching instruments, not product (BOUNDARY.md).
- **Stages are simulated** from the time an order was placed: 2 minutes in
  the kitchen (cancellable), then on the way, then delivered after 5 minutes.
  There is no kitchen to report them.
- **No payment webhook.** The slides list it as the example route handler for
  a caller we do not control. Without a payment provider there is nothing to
  receive.

## What changed from Day 39

| File | Change |
| --- | --- |
| `app/api/orders/[id]/route.js` | New: `GET`, with 401/403/404, `no-store` |
| `app/orders/[id]/OrderStatus.jsx` | New: the polling status line |
| `lib/orderStage.js` | New: stages from the clock, and their labels |
| `app/orders/[id]/page.js` | The status line; cancel only while in the kitchen |
| `app/actions.js` | `cancelOrder` answers 409 once the order has left the kitchen |
| `app/api/dishes/[id]/route.js` | `generateStaticParams` + `revalidate = 3600`: `ƒ` → `●` |
| `app/error.js`, `app/global-error.js`, `app/menu/not-found.js` | New special files |
| `app/menu/LayoutCounter.jsx`, `hooks/useRenderCount.js` | Deleted, with their uses in `menu/layout.js`, `CartBadge` and `AddToCartButton`, and their CSS |
| `components/SiteHeader.jsx`, `SiteFooter.jsx`, `app/globals.css` | Tagline, footer, status-line styles |
| `STRATEGY.md`, `BOUNDARY.md`, `README.md` | Rewritten for the project |
