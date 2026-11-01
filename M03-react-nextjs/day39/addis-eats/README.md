# Addis Eats — Day 39: API routes & route handlers

The Day 38 application, now with a server half in the same repository. A
dishes API with a dynamic segment. `POST /api/orders`, validated on the server
by the same Day 33 rules the form uses. The checkout first called that
endpoint with `fetch`, then was rewritten as a `placeOrder` server action
driven by `useActionState`. That form works with JavaScript switched off.
There is a static kitchen board at `/orders` that `revalidatePath` rebuilds
after every write. A `cancelOrder` action checks the session *and* who owns
the order before it writes anything. The session is a signed, httpOnly cookie
whose secret lives in `.env.local` and never reaches the browser.

## Run it

```bash
npm install
cp .env.example .env.local   # then put a real secret in it: openssl rand -base64 32
npm run dev                  # http://localhost:3000
npm run build                # production build (route table below)
npm run start                # serves that build
npm run lint
```

Orders are written to `.data/orders.json`, which is gitignored. Delete the
folder to start again from order 1001.

| Try | What happens |
| --- | --- |
| Open `/checkout` signed out | Redirected to `/login?next=/checkout`. Sign in with any `09…` number |
| Add Kitfo, go to the checkout, use phone `0900 000 000` | *Sending your order — 260 ETB…* for 1.2 s, then *That number is not registered with TeleBirr* beside the field, which now has focus. Everything you typed is still there |
| Order with a real-looking number | Redirected to the receipt `/orders/1001`. The basket badge drops to 0 |
| Open `/orders` | Your order is on the kitchen board straight away. The page is static; its *Board built at* time changes only when an order is written |
| **Cancel this order** on the receipt | The receipt is re-rendered as *was cancelled* in the same response, and so is the board |
| Sign in with a second number in another browser and open `/orders/1001` | 404. It is not your order |
| DevTools → Settings → Disable JavaScript, then check out | The order is still placed, and the field errors still appear beside their fields |
| `/checkout?fail=1` | The kitchen is offline. The message shows and the form keeps its values |

## Route table

`npm run build`, Next.js 16.4.2:

```
Route (app)             Revalidate  Expire
┌ ○ /                           1h      1y
├ ○ /_not-found
├ ƒ /api/dishes
├ ƒ /api/dishes/[id]
├ ƒ /api/orders
├ ○ /cart
├ ƒ /checkout
├ ƒ /login
├ ○ /menu                       1h      1y
├   /menu/[id]
│ ├ ● /menu/doro-wat            1h      1y
│ ├ ● /menu/shiro               1h      1y
│ ├ ● /menu/tibs                1h      1y
│ └ ● [+10 more paths]
├ ○ /orders
└ ƒ /orders/[id]

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

Every Day 38 row is unchanged. [STRATEGY.md](STRATEGY.md) justifies each row,
the new ones included. `○ /orders` with no revalidate window is deliberate:
that page is rebuilt on demand, never on a timer.

## The endpoints

One error shape everywhere: `{ "error": "<a sentence>" }`, plus
`"fieldErrors": { "<field>": "<message>" }` when a field is to blame
([lib/apiError.js](lib/apiError.js)). A success is the resource itself, never
`200` with `{ ok: false }` inside.

| Method | Path | Body / query | Status codes |
| --- | --- | --- | --- |
| `GET` | `/api/dishes` | optional `?category=Main\|Side\|Drink\|Dessert` | **200** the dishes (an empty array if a real category has none) · **400** unknown category |
| `GET` | `/api/dishes/[id]` | `id` is the slug, as in `/menu/[id]` | **200** the dish · **404** `{"error":"No such dish"}` |
| `POST` | `/api/orders` | JSON `{ name, phone, area, notes, items: [{ id, quantity }] }`, optional `?fail=1` | **201** the order · **400** not JSON, or not a JSON object · **422** `fieldErrors` (`name`, `phone`, `area`, `notes`, or `items` for an empty basket) · **503** `?fail=1`, kitchen offline |
| any other | the three paths above | | **405**, answered by Next.js because the method is not exported |

The server actions are endpoints too, though they have no URL to design. They
are listed in [Decisions](#decisions-worth-explaining), and attacked
[below](#attacking-cancelorder).

| Action | Called by | Returns |
| --- | --- | --- |
| `placeOrder(prev, formData)` | the checkout form | on failure `{ error, fieldErrors, values, attempt }` · on success a redirect to `/orders/[id]` |
| `cancelOrder(orderId)` | the receipt's button, bound to the id | `{ ok: true, message }` or `{ ok: false, status: 401 \| 403 \| 404 \| 409, error }` |
| `signIn(prev, formData)` | `/login` | `{ fieldErrors, values }`, or a redirect to `?next=` |
| `signOut()` | checkout and `/login` | a redirect to `/` |

### curl proofs

Against `npm run start -p 3039` (response headers trimmed to the status line
and content type):

```
$ curl -i localhost:3039/api/dishes/not-a-dish
HTTP/1.1 404 Not Found
content-type: application/json

{"error":"No such dish"}

$ curl -i localhost:3039/api/dishes/kitfo
HTTP/1.1 200 OK
{"id":4,"slug":"kitfo","name":"Kitfo","price":260,"currency":"ETB","category":"Main","spicy":true,"description":"Minced raw beef folded into spiced niter kibbeh."}

$ curl -i "localhost:3039/api/dishes?category=Pizza"
HTTP/1.1 400 Bad Request
{"error":"Unknown category \"Pizza\". Use Main, Side, Drink or Dessert."}

$ curl -i -X POST localhost:3039/api/orders -H "Content-Type: application/json" \
    -d '{"name":"Almaz","phone":"0912"}'
HTTP/1.1 422 Unprocessable Entity
content-type: application/json

{"error":"Validation failed","fieldErrors":{"phone":"Use 09… or +2519… — a TeleBirr number has 10 digits","area":"Choose a delivery area"}}

$ curl -i -X POST localhost:3039/api/orders -H "Content-Type: application/json" -d 'nope'
HTTP/1.1 400 Bad Request
{"error":"The body must be JSON."}

$ curl -i -X POST localhost:3039/api/orders -H "Content-Type: application/json" \
    -d '{"name":"Dawit Haile","phone":"+251 944 55 66 77","area":"Megenagna","notes":"",
         "items":[{"id":3,"quantity":1},{"id":12,"quantity":2}]}'
HTTP/1.1 201 Created
content-type: application/json

{"id":"1004","status":"placed","name":"Dawit Haile","phone":"0944556677","area":"Megenagna","notes":"","lines":[{"id":3,"slug":"tibs","name":"Tibs","price":180,"quantity":1},{"id":12,"slug":"baklava","name":"Baklava","price":80,"quantity":2}],"total":340,"currency":"ETB","placedAt":"2026-10-23T08:20:43.643Z"}

$ curl -i -X DELETE localhost:3039/api/orders
HTTP/1.1 405 Method Not Allowed
```

The 201 shows two server-side rules a form could never enforce. The phone
was stored as one spelling (`0944556677`). The prices were looked up from the
menu: the body sent only ids and quantities, so a forged price has nowhere to
go.

### A new order on a cached page

`/orders` is static. Around the `POST` above:

```
$ curl -si localhost:3039/orders | grep x-nextjs-cache      # before
x-nextjs-cache: HIT              Board built at 11:20:27     orders 1003 1002 1001
$ curl -X POST …/api/orders …                               # 201, order 1004
$ curl -si localhost:3039/orders | grep x-nextjs-cache      # straight after
x-nextjs-cache: MISS             Board built at 11:20:43     orders 1004 1003 1002 1001
$ curl -si localhost:3039/orders | grep x-nextjs-cache      # and after that
x-nextjs-cache: HIT
```

The first request after the write regenerated the board, and it already
listed 1004. Every request after that is a cache hit again. Then the control
experiment: I commented out the `revalidatePath("/orders")` line in
`app/api/orders/route.js`, rebuilt, posted order 1005, and fetched the board
three times. All three were `HIT` and none listed 1005. Then I put the line
back. Without `revalidatePath`, a static page never learns about a write.

### Attacking `cancelOrder`

Every server action is a POST endpoint. Its id is in the page's HTML. A
progressively enhanced form has to carry it, and `cancelOrder.bind(null, id)`
puts the bound order id in the HTML too. So from the console of their **own**
receipt, person B reads the action id and sends it with **A's** order id:

```js
const { id } = JSON.parse(document.querySelector('input[name="$ACTION_1:0"]').value);
await (await fetch(location.href, {
  method: "POST",
  headers: { "Next-Action": id, "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify(["1001"]),          // A's order
})).text();
// → '…1:{"ok":false,"status":403,"error":"That order is not yours."}'
```

The same attack from curl (B signed in by posting the `/login` form by hand,
with no browser involved; order 1003 is someone else's):

```
B, cancelOrder("1003")                   1:{"ok":false,"status":403,"error":"That order is not yours."}
no cookie at all                         1:{"ok":false,"status":401,"error":"Not signed in."}
forged session: payload rewritten to
  1003's owner, B's signature kept        1:{"ok":false,"status":401,"error":"Not signed in."}
B, cancelOrder("99999")                  1:{"ok":false,"status":404,"error":"No such order."}
B, cancelOrder("1002") — B's own         1:{"ok":true,"message":"Order 1002 is cancelled. Nothing will be charged."}
```

The server log has a line for every refusal:
`cancelOrder refused: Guest 4455 asked to cancel order 1003, which is not theirs`.
A's order was still *in the kitchen* after both attacks.

## The seven exercises, and where each one landed

| Exercise | Where |
| --- | --- |
| 1. `GET /api/dishes` returning the menu | [app/api/dishes/route.js](app/api/dishes/route.js). Also takes `?category=`, read from `request.nextUrl`, and answers 400 for one that does not exist |
| 2. `GET /api/dishes/[id]`, 404 with the standard shape | [app/api/dishes/\[id\]/route.js](app/api/dishes/[id]/route.js). `params` is awaited (see Deviations) |
| 3. `POST /api/orders`, Day 33 schema, 422 with `fieldErrors` | [app/api/orders/route.js](app/api/orders/route.js) → [lib/orders.js](lib/orders.js) `createOrder` → [lib/validate.js](lib/validate.js), which is Day 33's `validate.js` moved to `lib/` |
| 4. Point the checkout at it, branch on the status code | Done first, and verified (below). Day 33's `src/api/orders.js` came back as `app/checkout/placeOrder.js`, changed only to read `error` instead of `message`: `if (res.status === 422) throw new OrderError(…, body.fieldErrors)`. A browser test saw `[422, 201]` and the 422's message beside the phone field |
| 5. Rewrite as a server action, delete the fetch | [app/actions.js](app/actions.js) `placeOrder`. `app/checkout/placeOrder.js` is deleted, and `grep -rn "fetch(" app components cart lib` finds only two comments |
| 6. `useActionState` for pending, `revalidatePath` after a write | [app/checkout/Checkout.jsx](app/checkout/Checkout.jsx): `const [state, formAction, pending] = useActionState(placeOrder, null)`. The button is `disabled={pending}` and reads *Sending your order — … ETB…*. `revalidatePath("/orders")` is called in `placeOrder`, in `cancelOrder` and in the route handler |
| 7. `cancelOrder` checks the session and the owner | [app/actions.js](app/actions.js): `getSession()` → 401. `getOrder(id)` → 404. `order.userId !== user.phone` → 403. Only then `markCancelled`. Attacked above |

| Mini-project requirement | Met by |
| --- | --- |
| `GET /api/dishes` and `/api/dishes/[id]`, an honest 404 and one error shape | Exercises 1–2; `apiError()` for every failure |
| `POST /api/orders`: 201 on success, 422 with `fieldErrors` | Exercise 3; curl proofs above |
| A `placeOrder` server action replacing the fetch, `useActionState` driving the button | Exercises 5–6 |
| `revalidatePath` after a successful write | Three call sites; [the before and after](#a-new-order-on-a-cached-page) |
| `cancelOrder` verifying the session and ownership | Exercise 7; [the attack](#attacking-cancelorder) |
| `.env.local` gitignored, no secret readable from client code | `.gitignore` has `.env*` (with `!.env.example`); `git check-ignore .env.local` confirms it. The secret is read only in `lib/session.js`, which imports `server-only`. Searched for below |
| README listing each endpoint, method and status codes | [The endpoints](#the-endpoints) |

## Decisions worth explaining

**One function behind both doors.** The route handler and the action are two
ways in to the same `createOrder()` in [lib/orders.js](lib/orders.js). It
coerces the input to four strings, runs Day 33's `validate()`, adds the one
rule only a server knows (`0900 000 000` is not a TeleBirr number), prices
the lines from the menu, rejects an empty basket and writes the order. It
answers `{ ok, status, error, fieldErrors }`. The handler turns that into a
status line. The action has no status line, so it hands `error` and
`fieldErrors` to the form. That is why the two cannot disagree on what a
valid order is.

**The basket had to become a cookie.** The cart store lives in localStorage,
and localStorage never leaves the browser. A `fetch` could carry the items in
its body. A plain `<form>` posting to a server action carries only its fields,
and with JavaScript off nothing can add more. So [app/providers.jsx](app/providers.jsx)
writes `addis-eats-basket=4.2-9.1` (ids and quantities only) after every change
to the store. The checkout page reads it to show the lines, priced on the
server, and `placeOrder` reads it to charge them. After an order the action
sets the cookie to `""`. The browser always writes the cookie when the cart
changes, so an empty cookie next to a full cart can only mean the server
emptied it. On the next navigation (or the next page load, if the order was
placed with JavaScript off) the provider sees that and clears the cart. One
consequence: `Checkout` no longer reads the cart store at all.

**Uncontrolled inputs, so the form survives a round trip without JavaScript.**
With JavaScript off, the browser posts the form and Next.js renders the page
again with the action's return value as `state`. No browser code takes part,
so the values have to come back in that state (`values`) and go into
`defaultValue`. With JavaScript on, React resets an action form after each
answer. Inputs and the textarea reset to their new `defaultValue`, which is
what was typed. A `<select>` only reads `defaultValue` when it mounts, and
it snapped back to *Bole*. A browser test caught that. The action now returns
an `attempt` counter, and the select is keyed by it, so it re-mounts once per
answer with the area that was sent. Day 33's live validation still works:
every keystroke is mirrored into state for `validate()`, and `onSubmit` calls
`preventDefault()` when the form knows it is wrong, which stops the action.

**Return, don't throw.** The slides' `cancelOrder` throws `"Not yours"`. In
production Next.js replaces a thrown error's message with a generic one,
because it might contain a secret, so the caller would only learn that
*something* failed. The actions return `{ error }` for anything the person
can act on. `cancelOrder` also returns the status code it would have used as
an endpoint (401, 403, 404, 409), and the attack output shows it.

**`placeOrder` redirects.** On success it sets the customer cookie (Day 37's,
written by the server now), empties the basket cookie, calls
`revalidatePath("/orders")` and then calls `redirect('/orders/1001')`. The
receipt has its own URL again, as on Day 31, and refreshing it re-reads the
order instead of posting it twice. That matters most without JavaScript,
where a re-rendered POST response is what the refresh button would repeat.

**A session, because `cancelOrder` needs one.** Day 31's sign-in is back as a
stand-in: any `09…` number signs you in as its owner. What is real is where
the session lives. [lib/session.js](lib/session.js) signs `{phone, name}` with
HMAC-SHA256 using `SESSION_SECRET`, compares signatures in constant time, and
sets the cookie `httpOnly` and `SameSite=Lax` (`Secure` in production). Day 31's
guard is back too. It runs on the server now (`redirect` before a byte of
the checkout is sent), so there is no *Checking your session…* state to get
wrong. It is still not the security: `placeOrder` checks the session again.
Real authentication is Day 42.

**The kitchen board is shared, so it is public.** A cached page is the same
for every visitor. So `/orders` shows what a restaurant screen would: order
number, first name, area, dish count, total and status. It never shows a
phone number or a note. The receipt, which has those, is dynamic and visible
only to its owner. Someone else's receipt is a 404, not a 403, because "it
exists but is not yours" already tells a stranger something. `cancelOrder`
has no page to hide behind, so it says 403.

**Orders placed through the API belong to nobody.** An outside caller has no
Addis Eats session, so `userId` is `null` and no browser can cancel those
orders. A real API would authenticate its callers.

**Who calls `/api/dishes`?** Nothing in this application. `/menu` is a server
component that imports `lib/menu.js`. Fetching our own endpoint from our own
server would add a network hop to reach a function it can already import.
The dishes API exists for callers outside the UI, as the slides' *Three
tools, three jobs* table says, and today that caller is curl.

## Secrets

`.env.local` holds `SESSION_SECRET` and is gitignored. `.env.example` (committed)
shows the name with a placeholder, and `lib/session.js` refuses to sign with
the placeholder or with anything shorter than 32 characters. After the build:

| Search in `.next/static` (everything the browser can download) | Files found |
| --- | --- |
| the secret's value from `.env.local` | 0 |
| the name `SESSION_SECRET` | 0 |
| `createHmac`, `orders.json`, `0900000000`, `That order is not yours` | 0 each |
| `We need a name` (a Day 33 message) | 1, on purpose: `validate.js` runs in the browser too |

The secret's value is not even in `.next/server`, because it is read from the
environment at request time and never inlined.

## Check yourself

| Question | Answer |
| --- | --- |
| Does `curl -X POST` with an invalid phone return 422 and named field errors? | Yes: `fieldErrors.phone` (and `area`, which that body also left out). Above |
| Does a valid order return 201, and an unknown dish id 404 rather than an empty 200? | Yes, both. Above |
| Does the form still show field errors after the switch to the server action? | Yes, beside the field and with focus moved there, with JavaScript on and with it off. Browser checks below |
| Does a new order appear immediately on a cached orders page? | Yes. The first request after the write is a `MISS` that already lists it. Without `revalidatePath` it never appears |
| Calling `cancelOrder` with someone else's id from the console? | `{"ok":false,"status":403,"error":"That order is not yours."}`, and the order is untouched |
| Can you find any secret value in the JavaScript the browser downloaded? | No. See [Secrets](#secrets) |

The slides' review questions:

1. **page.js versus route.js?** `page.js` renders a screen (HTML and an RSC
   payload). `route.js` answers HTTP methods with a `Response`. One folder
   cannot have both, which is why every handler is under `app/api/`.
2. **401 or 403?** 401 when signing in would fix it (`cancelOrder` with no
   session, or a forged one). 403 when the person is signed in and still not
   allowed (someone else's order).
3. **Why validate again on the server?** The browser's check is a courtesy.
   curl never runs it, and neither does a page with JavaScript off. The
   server's check is the only one that cannot be skipped.
4. **What does an action save you writing?** The URL, the method, the
   `JSON.stringify`, the `fetch`, the status branching and the JSON parsing.
   Exercise 4's `placeOrder.js` was 52 lines, and step 5 deleted it.
5. **How does an action form submit before JavaScript loads?** It is
   rendered as a real `<form method="POST">` with the action's id in hidden
   fields. The browser posts it, and Next.js runs the action and renders the
   result.
6. **What stops someone cancelling another person's order?** The check
   inside `cancelOrder`: the session from a signed cookie, compared with the
   order's owner. Not the button, which only the owner sees anyway.

## Verified

Against the production build (`npm run build && npm run start -p 3039`, with
`.data/` cleared first):

| Check | Result |
| --- | --- |
| `npm run build` | Passes; the route table above |
| `npm run lint` | No warnings, no errors |
| `curl` every endpoint | Every status code in the table: 200, 400 (bad category, not JSON, a JSON array), 404, 422 (bad fields; unknown dish ids → `fieldErrors.items`), 201, 503 (`?fail=1`), 405 |
| `curl` pages | `/`, `/menu`, `/menu/kitfo`, `/cart`, `/orders`, `/login` 200. `/checkout` and `/orders/1001` signed out → 307 to `/login?next=…`. `/menu/pizza`, `/menu/not-a-dish`, `/some/bad/url` 404 |
| Board revalidation | `HIT` → write → `MISS` (lists the new order) → `HIT`. Without `revalidatePath`: three `HIT`s, never listed |
| `cancelOrder` attacks | From the console and from curl: 403, 401 (no cookie), 401 (forged cookie), 404, and 200 for the owner |
| Bundle search | See Secrets |
| `git check-ignore` | `.env.local`, `.data/`, `.next/` and `node_modules/` are ignored. `.env.example` is not |

Exercise 4 (the `fetch` version) was verified before it was replaced. On a
build of that stage, headless Chromium added Kitfo, submitted `0900 000 000`
(→ 422, message beside the phone, focus on the phone) and then a valid number
(→ 201, receipt). The responses it saw from `/api/orders` were `[422, 201]`.

Then, in headless Chromium (playwright-core), on the final build: **36 checks,
all passed.**

- Signed out, `/checkout` → `/login?next=/checkout`. A bad phone shows its
  error. A good one goes back to the checkout, where an empty basket says
  so. The session cookie is `httpOnly`.
- Adding Kitfo ×2 and Buna writes `addis-eats-basket=4.2-9.1`. The checkout
  lists those lines and prices from the server. The phone defaults to the
  signed-in number.
- A blank name stops the submission in the browser: no action request is sent
  and focus moves to the name.
- `0900 000 000`: the button is disabled and reads *Sending your order…*, then
  the server's message appears beside the phone and focus moves there. Name,
  area (*Piassa*), notes and phone are all kept. Editing the phone dismisses
  the message.
- `?fail=1`: the kitchen-offline message, with the form intact.
- A valid order redirects to `/orders/1001`. The badge goes to 0, the basket
  cookie to `""` and localStorage to an empty cart. The customer cookie is
  set. `/orders` lists it at once. The next checkout greets *Almaz Bekele*.
- Person B, in a second browser context, places an order. Opening A's receipt
  gives 404. B's console attack on A's order is refused with *That order is
  not yours*. A context with no session gets *Not signed in*. A's order is
  still placed. A cancels it, and the receipt and the board both show it
  cancelled.
- **JavaScript disabled** (a context with `javaScriptEnabled: false`, carrying a
  basket added earlier): the checkout lists the basket from the cookie. An
  invalid phone comes back from the server with the message beside the field
  and the values kept. A valid one places the order and lands on the receipt,
  and the order is on the board. Turning JavaScript back on, the cart clears
  itself to match. Sign-out and the guard work without JavaScript too.
- Console errors: one, the expected 404 for B opening A's receipt.

Plus 8 regression checks on Day 38's behaviour: search filtering the server
HTML, the category sidebar and URL, `error.js` inside the menu layout with
*Try again*, the cart surviving a reload and *Remove one* (and the basket
cookie following it), and `/menu/pizza`. All passed. Both suites were then run
against `npm run dev`: 36 and 8 passed, with no hydration warnings.

## Deviations, honestly

- **No zod.** The course's schema is a zod object. This project's Day 33
  schema is a plain `validate()` that returns `{ field: "message" }`, and the
  brief is to reuse it, so `fieldErrors` values are strings, not zod's arrays
  of strings. The error shape is otherwise the slides' one:
  `{ error, fieldErrors }`.
- **`params` is a Promise.** The slides write `getDish(params.id)`, which is
  the Next.js 14 API. In 15 and later, `params` is awaited:
  `const { id } = await params`. The query string comes from
  `request.nextUrl.searchParams`, the `NextRequest` helper for the slides'
  `new URL(request.url).searchParams`. Both do the same job.
- **Actions return instead of throwing**, for the reason given above.
- **`app/actions.js` holds all four actions**, as in the slides' tree. The
  shared schema is `lib/validate.js` rather than `lib/schema.js`, keeping its
  Day 33 name.
- **New routes the slides do not list:** `/login` (the session `cancelOrder`
  needs), `/orders` (the cached page `revalidatePath` refreshes) and
  `/orders/[id]` (where the cancel button lives). The session is a stand-in
  with no password; Day 42 replaces `lib/session.js`.
- **No order-status polling, no payment webhook.** The slides' end-to-end
  table mentions both as examples of the remaining two tools. Neither is in
  today's exercises.
- **Known, from Day 33:** a field's message appears when it loses focus, and
  that pushes the Order button down. A mouse press that blurs a just-emptied
  field can therefore miss the button. The browser test tabs out of the field
  first.

## What changed from Day 38

| File | Change |
| --- | --- |
| `app/api/dishes/route.js`, `app/api/dishes/[id]/route.js`, `app/api/orders/route.js` | New: the three endpoints |
| `app/actions.js` | New: `placeOrder`, `cancelOrder`, `signIn`, `signOut` |
| `lib/orders.js`, `lib/session.js`, `lib/apiError.js`, `lib/formatTime.js` | New: the order store, the signed session, the error shape, server-side times |
| `lib/validate.js` | Was `app/checkout/validate.js`. Adds `toOrderForm`, `phoneError`, `localNumber` and a name length limit |
| `cart/basketCookie.js` | New: the basket as the server sees it |
| `app/providers.jsx` | Writes the basket cookie, and clears the cart when the server has emptied it |
| `app/checkout/Checkout.jsx` | `fetch` (step 4), then `useActionState(placeOrder)` (steps 5–6). Uncontrolled fields; the basket comes from the server; the receipt moved to `/orders/[id]`; the sign-in line |
| `app/checkout/page.js`, `layout.js` | The guard, the basket and the session; comments |
| `app/checkout/customerCookie.js` | Written by the server now |
| `app/checkout/placeOrder.js` | Deleted (step 5) |
| `app/checkout/Field.jsx` → `components/Field.jsx` | Moved: `/login` uses it too |
| `app/login/`, `app/orders/`, `app/orders/[id]/` | New pages and their two client leaves |
| `components/NavTabs.jsx` | An *Orders* tab |
| `components/SiteHeader.jsx`, `SiteFooter.jsx`, `app/globals.css` | Tagline, footer, styles for the board and the sign-in line |
| `.env.example`, `.gitignore` | The secret's template; `.data/` ignored, `.env.example` allowed |
| `STRATEGY.md`, `BOUNDARY.md` | The new routes, endpoints, client leaves and actions |

## Files

| File | Side | Job |
| --- | --- | --- |
| [app/api/dishes/route.js](app/api/dishes/route.js), [\[id\]/route.js](app/api/dishes/[id]/route.js) | server | The dishes API |
| [app/api/orders/route.js](app/api/orders/route.js) | server | `POST /api/orders` |
| [app/actions.js](app/actions.js) | server (`"use server"`) | The four actions |
| [lib/orders.js](lib/orders.js) | server only | Order store; `createOrder`, the one place an order is judged |
| [lib/session.js](lib/session.js) | server only | The signed session cookie |
| [lib/validate.js](lib/validate.js) | both | Day 33's rules |
| [lib/apiError.js](lib/apiError.js) | server | The error shape |
| [cart/basketCookie.js](cart/basketCookie.js) | both | Basket cookie format |
| [app/checkout/page.js](app/checkout/page.js) / [Checkout.jsx](app/checkout/Checkout.jsx) | server / client | `/checkout` |
| [app/login/page.js](app/login/page.js) / [LoginForm.jsx](app/login/LoginForm.jsx) | server / client | `/login` |
| [app/orders/page.js](app/orders/page.js) | server | `/orders`, the kitchen board |
| [app/orders/\[id\]/page.js](app/orders/[id]/page.js) / [CancelOrderButton.jsx](app/orders/[id]/CancelOrderButton.jsx) | server / client | The receipt |
| [app/providers.jsx](app/providers.jsx) | client | Cart store, rehydration, basket cookie |
| everything else | | As on Day 38. See [BOUNDARY.md](BOUNDARY.md) and [STRATEGY.md](STRATEGY.md) |
