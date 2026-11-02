# Authentication and authorisation — Addis Eats, screen by screen

Day 42. Until yesterday every request was anonymous: an order belonged to
nothing but the phone number typed into the form, `GET /api/orders/1001`
answered anyone who asked, and `/orders` was the same page for every visitor.
Today the application knows who is asking.

The reading sheet's sentence is the whole design: **guarding a screen is not
the same as guarding the data behind it.** Three layers do three different
jobs, and only the innermost one is security.

## Day 48: the idempotency key is not a credential

Day 48 gave placing an order an idempotency key (ACCESSIBILITY.md, "One
order per tap"): a random value in a hidden field of the checkout, or an
`Idempotency-Key` header on `POST /api/orders`. A repeated key returns the
order it already placed instead of placing another. Two things keep that
from becoming a way in:

- **The key is looked up per person.** `createOrder` searches for
  `userId === session's id && idempotencyKey === key`
  (lib/orders.js, `orderForKey`), *after* `getSession()` has said who is
  asking. Someone else's key, sent with your session, matches nothing and
  places a new order of your own. Tested: Almaz sending the key Bereket had
  just used got `201` and a new order, not Bereket's.
- **It is not sent back.** `publicOrder()` (and so `orderView()`) drops
  `idempotencyKey` along with `userId`, so the API's answers, the receipt
  and its stream never carry it; the CSV lists named columns only. Checked:
  the body of a replayed `POST /api/orders` has no `idempotencyKey`.

It does nothing for authentication or authorisation: every check above runs
before it, unchanged.

## Day 47: the stream and the export, behind the same checks

Two new endpoints, and both are route handlers under `/api`, which the
proxy's matcher does not cover (a fetch or an EventSource redirected to an
HTML sign-in page is no use to the code that opened it). So, like every
handler since Day 42, each one is its own authentication. Line numbers are in
the Day 47 files.

```
GET /api/orders/[id]/stream   handler -> getSession() or 401                    stream/route.js:86
                                         getOrder(id) or 404                     :92
                                         order.userId === user.id or 403         :96
                              then, every 3 s while open:
                                         sessionFromCookie(the same cookie)      :171
                                         + the order still exists and is theirs  :173
                                         else close the stream (no `end`)
GET /api/orders/export        handler -> getSession() or 401                    export/route.js:56
                                         ?scope= "mine" or "all", else 400       :62
                                         "all" needs role === "staff", else 403  :65
                                         the rows: listOrdersFor(user.id), or listOrders() for "all"   :69
```

**The stream makes the same three checks as `GET /api/orders/[id]`, in the
same order, with the same answers**, before a single byte of the stream is
sent. A refusal is an ordinary JSON response with its status. That matters
for EventSource: any status but `200` (or any type but `text/event-stream`)
is fatal to it, so a refused browser stops instead of reconnecting every
three seconds. The receipt then falls back to the poll, which gets the same
answer and shows its sentence.

**And it checks again while it is open.** A route handler normally checks
once, at the start of a request that lasts milliseconds. This request lasts
minutes. So every tick it re-verifies the cookie it was opened with
(`sessionFromCookie`, the uncached half of `getSession`, split out of
`lib/session.js` today: signature, session row, expiry, account — the same
checks) and re-reads the order's owner. Signing out in another tab deletes
the session row; within one tick the stream closes, the browser reconnects,
and meets the `401`. `cookies()` is not used for this: the ticks run after
the handler has returned its `Response`, so the value is read once from
`request.cookies` and kept.

Checked on the production build (`next start -p 3047`), order 1426 (Almaz's):

| Who | `GET /api/orders/1426/stream` |
| --- | --- |
| Signed out | `401 application/json {"error":"Not signed in."}` — no stream |
| Bereket (another customer) | `403 application/json {"error":"That order is not yours."}` — no stream |
| Almaz, an order that does not exist (`99999`) | `404 {"error":"No such order."}` |
| Almaz (the owner) | `200 text/event-stream`, `retry: 3000`, then the order every 3 s |
| Almaz with a second session, then that session signed out in a browser | The stream ended **1,994 ms** after *Sign out* (log: `closed (session no longer valid)`); reconnecting with the same cookie: `401` |

The receipt page itself is unchanged (Bereket at `/orders/9003`: `404`; the
API: `403`; signed out: `307` to `/login?next=%2Forders%2F9003`). The
receipt's map and facts are rendered from the same scoped read, and the
stream sends exactly what `GET /api/orders/[id]` sends — `orderView()`, with
no `userId` — so nothing new about the order leaves the server. The
simulated positions are not anyone's address: a landmark in the order's
neighbourhood, moved by a few hundred metres.

**The export is scoped like the list it exports.** The owner comes from
the session, never the URL: the only thing the URL can ask for is the wider
scope, and the role decides whether it gets it. Checked: signed out `401`;
Almaz `200`, 47 rows, every one hers; Bereket `200`, 10 rows, every one his;
`?scope=all` as Almaz or Bereket `403`; as Selam (staff) `200`, 426 rows;
`?scope=everyone` `400`. The links to it (`/orders`, `/dashboard`) are
interface; the role check in the handler is what holds, exactly as for the
`/kitchen` link. No phone numbers in either file, first names only in the
staff one; `Cache-Control: private, no-store`.

## Day 46: the dashboard, behind the same three layers

`/dashboard` is revenue across every customer, and its order table names
whose order is whose. That is a staff view, so it was given exactly
`/kitchen`'s protection, and the order tables kept the customer's own
scoping. Line numbers are in the Day 46 files.

```
/dashboard       proxy  -> cookie exists ("/dashboard/:path*" added)    proxy.js:27, matcher :62
                 page   -> session verified, role === "staff" or 403    app/dashboard/page.js:52, 55
                 data   -> read only after both checks; nothing writes, so no action to re-check
/orders          page   -> session verified                             app/orders/page.js:54
                 query  -> pageOrdersFor(user.id, { sort, dir, page })   app/orders/page.js:88
                           (the sort and page come from the URL, the owner never does)
/kitchen         page   -> unchanged; now lists today's orders only      app/kitchen/page.js:51
```

Checked on the production build (`next start -p 3046`, DASHBOARD.md):

| Who | `/dashboard` | Why |
| --- | --- | --- |
| Signed out | `307` → `/login?next=%2Fdashboard`, `x-addis-eats-proxy: redirected` | The proxy's matcher |
| A forged cookie of the right shape | Proxy `passed`, then `307` → `/login?next=/dashboard` | `getSession()` in the page refused it |
| Almaz, Bereket (customers) | `403`, the Staff-only page; the revenue heading is not in the body | `forbidden()` |
| Selam (staff) | `200` | — |
| A customer with `?state=empty` | `403` | The demo switch is read after the role check (lib/demoState.js) |

**The status code depends on where the skeleton is.** The course puts the
loading state in `loading.js`. That file wraps the whole page in a Suspense
boundary, so the response is already a streamed `200` by the time the page
calls `forbidden()`. Tried: with an `app/dashboard/loading.js`, a customer's
`/dashboard` was a **`200`** carrying the Staff-only page; without it, a
**`403`**. Next.js 16's `loading.md` ("Status codes") says the same. So the
check comes first and the `<Suspense>` boundary goes around the data only —
in `/orders` too, where a `loading.js` would also have turned every
stranger's receipt `404` into a `200`. Re-checked: Bereket at one of
Almaz's receipts is still a `404`.

Customers' own orders: Almaz's `/orders?sort=total&page=3` lists only her
orders (6 rows, all hers), Bereket's lists his 10 and never hers. Hiding the
dashboard link from customers (on `/kitchen`, `/orders`, `/login`) is the
interface half; the `403` is the half that holds. `robots.txt` disallows
`/dashboard` and the page is `noindex`.

## Day 45: every route and action, one line per layer

The project sheet asks AUTH.md for "one line per layer": every route and
action, its layers, and what each one proves. This is that list, checked
against the code on Day 45; the sections after it are Day 42's reasoning.
Line numbers are in the Day 45 files.

```
/checkout        proxy  -> a cookie shaped like a session exists        proxy.js:27
                 page   -> the session is live: getSession()            app/checkout/page.js:30
                 action -> placeOrder: getSession() again; owner = user.id, never a field   app/actions.js:154
/orders          proxy  -> cookie exists                                proxy.js:27
                 page   -> session verified                             app/orders/page.js:38
                 query  -> listOrdersFor(user.id)                       app/orders/page.js:41
/orders/[id]     proxy  -> cookie exists                                proxy.js:27
                 page   -> session verified                             app/orders/[id]/page.js:44
                 query  -> getOrderFor(user.id, id); not yours = 404    app/orders/[id]/page.js:56
                 action -> cancelOrder: session, then owner or staff    app/actions.js:218, 236
/kitchen         proxy  -> cookie exists                                proxy.js:27
                 page   -> session verified, role === "staff" or 403    app/kitchen/page.js:44, 46
                 action -> cancelOrder re-checks the role itself        app/actions.js:236
/login, /signup  public -> safeNext() on the link, and again in signIn/signUp   app/login/page.js:34, app/actions.js:67, 104
/menu, /, /cart  public -> nothing to protect; indexable (the cart is browser state)

POST /api/orders     handler -> getSession() before the body; owner = user.id    app/api/orders/route.js:36
GET /api/orders/[id] handler -> getSession(), then order.userId === user.id      app/api/orders/[id]/route.js:25, 35
GET /api/dishes[/id] public  -> the menu, nothing private in it
signOut              action  -> needs no check: it can only end the caller's own session
```

`/api/*` is outside the proxy's matcher on purpose (a fetch redirected to an
HTML sign-in page is useless to its caller), so the handlers' own
`getSession()` is their first layer as well as their last. And a server
action can be posted to *any* page that uses it — `cancelOrder` is also
registered on `/login`, which the proxy never sees — which is why the action
checks for itself.

### The three attacks, run again on Day 45

Production build (`npm run build && npm run start -p 3045`), headless
Chromium plus raw HTTP, the demo accounts below. Each action call is what the
sheet's console line `await cancelOrder("1001")` sends: a `POST` with the
action's id in the `Next-Action` header and `["1001"]` as the body. 31 of 31
checks passed; Almaz's order 1001 was still `placed` at the end.

| # | Attack | Answer | The line that refused it |
| --- | --- | --- | --- |
| 1a | `cancelOrder("1001")` signed out, posted to `/orders/1001` | `307` → `/login?next=%2Forders%2F1001`, `x-addis-eats-proxy: redirected`; the action never ran | `proxy.js:27`, the `looksLikeSession` check (the matcher covers `/orders`) |
| 1b | The same call signed out, posted to **`/login`** (outside the proxy) | `200` with `{ ok: false, status: 401, error: "Not signed in." }`; no proxy header | `app/actions.js:219`, `if (!user)` after `getSession()` — the layer that cannot be bypassed |
| 1c | The same call with a **forged cookie** of the right shape | Proxy `passed`; action answered `401 "Not signed in."` | `app/actions.js:219` (`getSession()` refuses a bad HMAC, `lib/session.js:69`) |
| 1d | `GET /api/orders/1001`, `POST /api/orders` signed out | `401 {"error":"Not signed in."}` both | `app/api/orders/[id]/route.js:25`, `app/api/orders/route.js:36` |
| 1e | Customer Almaz opens `/kitchen` (wrong role) | `403`, the forbidden page; staff Selam gets `200` | `app/kitchen/page.js:46`, `forbidden()` |
| 2a | Bereket opens `/orders/1001` (Almaz's) | `404` | `app/orders/[id]/page.js:56`, `getOrderFor(user.id, id)` returns `null` |
| 2b | Bereket `GET /api/orders/1001` | `403 {"error":"That order is not yours."}` | `app/api/orders/[id]/route.js:35` |
| 2c | Bereket's `/orders` | Lists his order 1002 only, never 1001 | `app/orders/page.js:41`, `listOrdersFor(user.id)` |
| 2d | Bereket calls `cancelOrder("1001")` | `{ ok: false, status: 403, error: "That order is not yours." }` | `app/actions.js:236`, `!isOwner && !isStaff` — refused on ownership, not on session |
| 3a | `/login?next=https://example.com` (also `//example.com`, `/\example.com`, `/login`) | The hidden `next` field is `/menu` for all four | `lib/safeNext.js:29` (not a path) and `:36` (`url.origin !== HERE`) |
| 3b | Sign in from that crafted link | Lands on `http://localhost:3045/menu` | `app/actions.js:67`, `safeNext(formData.get("next"))` |
| 3c | Sign in after editing the hidden field to `https://example.com` in devtools | Lands on `/menu` | The same line: the action does not trust the page's check |

The sheet expects attack 3 to land on `/`; here it lands on `/menu`
(`DEFAULT_NEXT`), which is the same result — this site, not the other one.

Also checked the same run: the cookie is `HttpOnly`, `Secure`,
`SameSite=Lax`, seven days; `document.cookie` does not contain it; a copy of
the cookie taken before signing out is redirected to `/login` afterwards
(the row is gone); the API's order body has no `userId`.

## The three layers

| Layer | Where it lives here | What it proves | Is it security? |
| --- | --- | --- | --- |
| Middleware — `proxy.js` (Next.js 16's new name for `middleware.js`) | project root, matcher `["/checkout/:path*", "/orders/:path*", "/kitchen/:path*"]` | A cookie of the right shape is present | **No.** It does not verify the signature, read the session table or know the role |
| Page — `getSession()` while rendering | `/checkout`, `/orders`, `/orders/[id]`, `/kitchen`, `/login`, `/signup` | The cookie is a live session, and here is the person | **Partly.** It gives the right screen to the right person |
| Action or handler — `getSession()`, then ownership or role | `placeOrder`, `cancelOrder`, `POST /api/orders`, `GET /api/orders/[id]` | This person may touch this record | **Yes.** This is the check that cannot be bypassed |
| Hiding a link or a button | `NavTabs`, the staff links, `CancelOrderButton` | Nothing; it is a tidy interface | **No.** Every hidden control is refused again on the server |

`proxy.js` never imports `lib/session.js`. It imports only
`lib/sessionCookie.js`, which is the cookie's name and a regular expression for
its shape — no Node, no secret, no database. That is deliberate: the proxy runs
before every matching request, and it must stay cheap.

A signed-out request to `/checkout` is therefore answered with a `307` before
a layout renders, a cookie is parsed or a basket is priced:

```
$ curl -i localhost:3042/checkout
HTTP/1.1 307 Temporary Redirect
location: /login?next=%2Fcheckout
x-addis-eats-proxy: redirected
```

The page would also redirect, but only after doing that work. The proxy skips
it. The response header `x-addis-eats-proxy` says which requests were seen by
the proxy (`passed` or `redirected`) and which never touched it.

## The session

### Database session, not a token

The slides offer two shapes. This one is a **database session**: the cookie
holds a random key, and the truth is a row in `.data/sessions.json`.

| | Database session (chosen) | Signed token (JWT) |
| --- | --- | --- |
| Cookie holds | A random token | The claims |
| Every request | One table lookup | Signature check only |
| Revoke | Delete the row — immediate | Wait for expiry |
| The truth lives | On the server | In the token |

Revocation is the reason. Signing out deletes the row, so a copy of the cookie
stops working at once. A signed token would keep working until it expired.

### What the cookie contains

```
addis-eats-session=<43 base64url chars>.<43 base64url chars>
                     random 32 bytes      HMAC-SHA256 of those bytes
```

- The first half is the session key.
- The second half is its signature, made with `SESSION_SECRET` (an environment
  variable, no `NEXT_PUBLIC_` prefix, so it never reaches the browser).
- The session table stores **`sha256(token)`**, not the token. A copy of
  `.data/sessions.json` therefore contains nothing anyone can put in a cookie.
- A made-up or altered value is refused before the table is read. The
  comparison uses `timingSafeEqual`.

`lib/session.js` sets it with the three flags that matter, plus a path and an
expiry:

```js
cookieStore.set(SESSION_COOKIE, `${token}.${sign(token)}`, {
  httpOnly: true,   // no script on the page can read it
  secure: true,     // HTTPS only; localhost counts as secure in browsers
  sameSite: "lax",  // not sent with another site's form, image or fetch
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // one week
});
```

The verified response header:

```
set-cookie: addis-eats-session=…; Path=/; Expires=Sun, 01 Nov 2026 …;
            Max-Age=604800; Secure; HttpOnly; SameSite=lax
```

`Secure` is on even in development. Browsers treat `http://localhost` as a
secure origin, so the local production build still signs in.

### The six steps, in this code

| # | The reading sheet | Addis Eats |
| --- | --- | --- |
| 1 | The person posts a phone number and password | `signIn` in [app/actions.js](app/actions.js), called by [LoginForm.jsx](app/login/LoginForm.jsx) |
| 2 | The server checks them against the stored hash | `findAccountByPhone` + `verifyPassword` ([lib/password.js](lib/password.js)) |
| 3 | The server creates a session and sets a cookie | `startSession` ([lib/session.js](lib/session.js)); a **new** token every time, never one the browser brought |
| 4 | The browser sends the cookie with every later request | `httpOnly` + `sameSite: "lax"`; sent on navigation and same-site fetches |
| 5 | The server reads it and knows who is asking | `getSession()` — pages, actions, handlers, all the same call |
| 6 | Signing out clears the cookie and invalidates the session | `signOut` → `endSession`: delete the row **and** the cookie |

### Passwords

Passwords are never stored. [lib/password.js](lib/password.js) uses Node's
`scrypt` with `N=16384, r=8, p=1` (OWASP's minimum work factors), a 16-byte
random salt per account, and a 32-byte derived key:

```
scrypt$16384$8$1$<salt>$<hash>
```

The parameters travel with the hash, so raising `N` later only affects new
passwords; old hashes still say how they were made, and still verify.

Two details that are easy to miss:

- **The same answer for every failure.** An unknown number and a wrong
  password both return *"That phone number and password do not match an
  account."* An unknown number still spends the time a real check would
  (`burnTime` against a dummy hash), so the clock does not reveal which
  numbers have accounts.
- **Never echo the password.** A failed attempt returns the phone number so
  the field can be refilled, but not the password.

### The one helper

```js
const user = await getSession(); // { id, name, phone, role } or null
```

`getSession` is exported from [lib/session.js](lib/session.js) and is the only
way the rest of the application asks who is calling. It returns `null` for:

- no cookie,
- a malformed cookie,
- a bad signature,
- a row that was deleted (signed out),
- a row past `expiresAt`,
- a user id whose account no longer exists.

It is wrapped in React's `cache()`, so a page, its layout and the components
inside it read the table once per request. Reading `cookies()` makes the caller
dynamic, which is correct: a page that depends on who is asking cannot be
prerendered (see [STRATEGY.md](STRATEGY.md)).

`lib/session.js`, `lib/accounts.js` and `lib/password.js` all begin with
`import "server-only"`. If a client component ever imports one, the build
fails.

## Every protected route, and what each layer proves

### Pages

| Route | Proxy | Page | Action or handler | What each layer proves |
| --- | --- | --- | --- | --- |
| `/checkout` | `307` to `/login?next=/checkout` when the cookie is missing or not shaped like one | `getSession()` and `redirect("/login?next=/checkout")` | `placeOrder` calls `getSession()` again and refuses with a returned error | Proxy: a cookie is there. Page: it is a live session, and the basket can be priced for this person. Action: the POST itself belongs to a signed-in account |
| `/orders` | `307` to `/login?next=/orders` | `getSession()`; the query is `listOrdersFor(user.id)` | — (read-only page) | Proxy: cheap redirect. Page: the list can only contain the session's own orders |
| `/orders/[id]` | `307` to `/login?next=/orders/1001` | `getSession()`; the read is `getOrderFor(user.id, id)` | Cancel is `cancelOrder`, below | Proxy: cheap redirect. Page: someone else's receipt and a missing receipt are both a `404` |
| `/kitchen` | `307` to `/login?next=/kitchen` | `getSession()`, then `user.role !== "staff"` → `forbidden()` (`403`) | The Refuse buttons post `cancelOrder`, which checks the role again | Proxy: a cookie is there. Page: a live session **and** the staff claim. Action: a button's action can be posted from anywhere, so it checks again |
| `/login` | Not matched — a signed-out visitor must reach it | `getSession()` only to show "Already signed in"; `safeNext(searchParams.next)` | `signIn` / `signOut` | The page is public by design; the action still validates its input and `next` |
| `/signup` | Not matched | `getSession()` only to send a signed-in person on; `safeNext(searchParams.next)` | `signUp` | Public by design. The new account's role is always `customer`; there is no role field to forge |
| `/menu`, `/menu/[id]`, `/`, `/cart` | Not matched | No session read | `POST` writes still check | Public content; the cart is the browser's own state |

The matcher is narrow on purpose:

```js
export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/kitchen/:path*", "/dashboard/:path*"], // Day 46: /dashboard
};
```

`/menu`, images, `_next/static` and `/api` never wait for the proxy. A fetched
API request that was answered with an HTML sign-in redirect would be useless to
the code that called it, so the handlers answer `401` themselves.

### Endpoints

| Endpoint | Check | Failure | Why this shape |
| --- | --- | --- | --- |
| `POST /api/orders` | `getSession()` before the body is read; the owner is `user.id`, never a field | `401 {"error":"Not signed in."}` | A route handler is a real public endpoint. Its action id is not secret, and curl does not run the form |
| `GET /api/orders/[id]` | `getSession()`; order must exist and `order.userId === user.id` | `401` signed out, `404` no such order, `403` someone else's | The receipt polls this every five seconds. It has no page to hide behind, so it says `403` where the page says `404`. Always `Cache-Control: private, no-store` |
| `GET /api/orders/[id]/stream` (Day 47) | The same three checks as the row above, before the stream opens; then the session and the owner again every 3 s | The same `401` / `404` / `403`, as JSON; a session that stops being valid closes the stream | EventSource gives up on a non-`200`, so a refused browser stops knocking. A request that lasts minutes has to keep asking |
| `GET /api/orders/export` (Day 47) | `getSession()`; `?scope=all` needs `role === "staff"` | `401`, `403` for a customer asking for everything, `400` for any other scope | The rows are `listOrdersFor(user.id)`; the URL can only ask for more, and the role answers |

`publicOrder()` removes `userId` before an order leaves the server. The owner is
how the server decides; nobody needs to be told it.

## Authorisation: queries scoped to the session

The reading sheet's most important line is the query, not the redirect:

```js
// app/orders/page.js
const user = await getSession();
if (!user) redirect("/login?next=/orders");
const orders = await listOrdersFor(user.id); // never listOrders(someId)
```

The same rule, in four places:

| Function | Where | What it does |
| --- | --- | --- |
| `listOrdersFor(userId)` | [lib/orders.js](lib/orders.js) | Filters the whole file by the session's id. A URL, query string or form field cannot widen it |
| `getOrderFor(userId, id)` | [lib/orders.js](lib/orders.js) | Returns the order only when its `userId` matches. Someone else's order and no order are the same `null` |
| `createOrder({ userId, … })` | [lib/orders.js](lib/orders.js) | Both doors pass the session's id. There is no `userId` field in either form |
| `cancelOrder(orderId)` | [app/actions.js](app/actions.js) | The id from the page is only *where to look*. The session and the record decide whether it may be touched |

`cancelOrder` is authentication **then** authorisation, in that order:

```js
const user = await getSession();
if (!user) return { ok: false, status: 401, error: "Not signed in." };

const order = await getOrder(orderId);
if (!order) return { ok: false, status: 404, error: "No such order." };

const isOwner = order.userId === user.id;
const isStaff = user.role === "staff";
if (!isOwner && !isStaff) {
  return { ok: false, status: 403, error: "That order is not yours." };
}

if (orderStage(order) !== "kitchen") {
  return { ok: false, status: 409, error: "…already on the way / delivered / cancelled." };
}

await markCancelled(order.id);
```

A staff member may refuse any order still in the kitchen. A customer may cancel
only their own. The check is inside the action, so hiding the button in the
interface changes nothing.

### 404 or 403?

- The **page** says `404` for both "no such order" and "not yours". A receipt
  has a name, a phone number and an address on it; telling a stranger that an
  order exists is already telling them something.
- The **API** says `403` for someone else's order, because the caller is code,
  not a person reading a page, and the distinction is useful to it.
- `cancelOrder` says `403` for the same reason: it has no page to hide behind.

## Returning the person: the `next` parameter

The proxy writes the destination into the URL, so it survives a refresh and
works before any JavaScript runs:

```js
const signIn = new URL("/login", request.url);
signIn.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
return NextResponse.redirect(signIn); // 307
```

After a successful sign-in, `redirect(next)` would be an open redirect if
`next` came straight from the address bar. [lib/safeNext.js](lib/safeNext.js)
does not pattern-match; it parses the value the way a browser will, against a
stand-in origin, and accepts it only if it is still on that origin:

```js
const HERE = "http://addis-eats.invalid";

export function safeNext(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return DEFAULT_NEXT;
  const url = new URL(value, HERE);
  if (url.origin !== HERE) return DEFAULT_NEXT;
  if (url.pathname === "/login" || url.pathname === "/signup") return DEFAULT_NEXT;
  return `${url.pathname}${url.search}${url.hash}`;
}
```

The slides' one-line check (`!next.startsWith("/")`) is not enough for three
spellings that also start with a slash and that a browser reads as another
host. All of them are rejected:

| `?next=` | The login form's hidden field | Why |
| --- | --- | --- |
| `https://evil.example` | `/menu` | Absolute URL |
| `//evil.example` | `/menu` | Protocol-relative: another host, same scheme |
| `/\evil.example` | `/menu` | Browsers treat `\` as `/` |
| `/%09/evil.example` | `/%09/evil.example` | Still a path on this origin; the tab is inside the path, not a new host |
| `/login` | `/menu` | Signing in only to return to sign-in helps nobody |
| `/signup` | `/menu` | The same |
| `/orders` | `/orders` | Accepted: a real page on this site |

The value is checked again in the action, because the hidden field is just as
easy to change as the URL. What `redirect()` receives is the parsed path that
was checked, not the string that arrived.

## Roles

| Role | Can do | How it is enforced |
| --- | --- | --- |
| `customer` | Sign in, order, read and cancel **their own** orders | `getOrderFor`, `listOrdersFor`, `cancelOrder`'s owner check |
| `staff` | Everything a customer can, plus `/kitchen`, `/dashboard` (Day 46) and refusing any cancellable order | The `/kitchen` and `/dashboard` page checks `user.role === "staff"`; `cancelOrder`'s `isStaff` branch |

A role is a claim the server reads, never something the browser sends:

- `signUp` always writes `role: "customer"`. Adding a `role` field to the form
  does nothing.
- The header does not show a Kitchen tab. It is on every page, static ones
  included, and reading the session to decide would make **every** route
  dynamic (see [STRATEGY.md](STRATEGY.md)). The staff link appears on `/orders`
  and `/login`, where the session is read anyway.
- Hiding the link is the interface half. `/kitchen` gives a signed-in customer
  a real `403` and [app/forbidden.js](app/forbidden.js), and `cancelOrder`
  refuses a customer trying to refuse someone else's order.

## The three attacks

Run against the production build (`npm run build && npm run start -p 3042`), in
headless Chromium, with the demo accounts below. All three failed, and the
order was still `placed` in `.data/orders.json` afterwards.

### 1. Call a server action while signed out (or with a forged cookie)

The cancel button is a form whose action is `cancelOrder.bind(null, orderId)`.
Its action id and the bound id are both in the page's HTML. Two versions were
tried:

| Attempt | What happened | The line that stopped it |
| --- | --- | --- |
| POST the cancel action with **no cookie** | The proxy answered `307` to `/login?next=/orders/1002` before the action ran | `proxy.js`, the matcher and the `looksLikeSession` check |
| Keep the page rendered for Almaz, then replace the cookie with a **shape-valid but unsigned** value, and press Cancel | The proxy let the request through (the shape matches); `cancelOrder`'s `getSession()` returned `null`, and the status line said **"Not signed in."** | `getSession()` inside `cancelOrder`, the layer that cannot be bypassed |

The first version proves why the proxy is not security: a cookie of the right
*shape* gets past it. The second proves what happens next.

### 2. Sign in as one account and cancel another account's order

The page was rendered for Almaz. The session cookie was then swapped for
Bereket's, and the already-rendered Cancel button was pressed. The action
received Almaz's order id and Bereket's session:

```js
const order = await getOrder("1002");      // exists
order.userId === "usr_almaz"               // the record's owner
user.id === "usr_bereket"                  // the session's person
// 403: "That order is not yours."
```

The status line said **"That order is not yours."**, and order 1002 was still
`placed`. The same account, asking the page or the endpoint directly, got a
`404` from `/orders/1002` and a `403` from `GET /api/orders/1002`. Changing the
number in the address bar is not enough, because the query is scoped to the
session's account.

### 3. Craft a sign-in link with `next` pointing at another site

A link to `http://localhost:3042/login?next=https%3A%2F%2Fevil.example` renders
its hidden `next` field as `/menu`. Signing in lands on `/menu`, not on
`evil.example`. The same is true for `//evil.example` and `/\evil.example`
(the table above).

The fix is one function, `safeNext`, called in three places: the login page
(the link it prints), the sign-up page, and the actions (the hidden field).

## Demo accounts

The seed file is committed at
[data/accounts.seed.json](data/accounts.seed.json); the first read copies it to
`.data/accounts.json`. Passwords are not in the file — only scrypt hashes.

| Name | Phone | Password | Role |
| --- | --- | --- | --- |
| Almaz Bekele | `0911223344` | `almaz1234` | customer |
| Bereket Haile | `0922334455` | `bereket1234` | customer |
| Selam Tesfaye | `0910101010` | `selam1234` | staff |

Any `09…` number used to sign in on Days 39–41. That shortcut is gone: the
number must have an account, and the password must match. Create another
account at `/signup`; every new account is a customer.

## What is deliberately not here

This is a teaching implementation, and the reading sheet is explicit that
writing the flow yourself is "an excellent exercise and a poor production
decision". Known limits:

- **File storage, not a database.** `.data/accounts.json` and
  `.data/sessions.json` are read and rewritten whole. A real database replaces
  them in Module 4. The JSON store is one process only; two server instances
  would not share it reliably. Day 45: on Vercel this is worse than unreliable —
  the function's filesystem is read-only outside `/tmp`, so the first
  sign-in fails writing `.data/` (README, "Deploying to Vercel").
- **No rate limiting or lockout.** Sign-in spends ~50 ms in scrypt, which makes
  guessing slow but not impossible. A production flow needs per-IP and
  per-account limits.
- **No password reset, email verification or 2FA.** Sign-up says when a number
  already has an account, because there is no email or SMS channel with which
  to hide it. A production flow should not leak that.
- **No CSRF token of our own.** `SameSite=Lax` plus Next.js's server-action
  origin checks cover the forms here. A cross-site form cannot read the
  response, and the session cookie is not sent on another site's form POST.
- **No session list or remote sign-out.** Signing out revokes the current
  session; other devices keep theirs until they expire or are deleted by hand.
- **One secret, no rotation.** Changing `SESSION_SECRET` invalidates every
  cookie's signature at once (the rows remain but no cookie can use them),
  which is useful in an incident and disruptive otherwise.
- **Auth.js is the production answer.** It handles providers, rotation, CSRF
  and the edge cases. The value of doing it by hand once is knowing what it is
  doing, and where to put the checks.

## Check yourself

| Question from the sheet | Answer |
| --- | --- |
| Can any script on the page read the session cookie? | No. `httpOnly` is set, and `document.cookie` in the browser does not contain `addis-eats-session`. Verified |
| Does the orders page work if the id in the URL is changed to someone else's? | No. `/orders/1002` as Bereket is a `404`, and `GET /api/orders/1002` is a `403`. The query is `getOrderFor(user.id, id)` |
| Does middleware run on your image files? | No. The matcher is only `/checkout/:path*`, `/orders/:path*` and `/kitchen/:path*`. `/menu` was measured at `200` with no `x-addis-eats-proxy` header |
| Did all three attacks fail, and can you name the line that stopped each one? | Yes: `looksLikeSession`/matcher (proxy), `getSession()` + owner comparison in `cancelOrder`, and `safeNext`'s origin check |
| Is the staff link merely hidden, or actually refused server-side? | Refused: `/kitchen` calls `forbidden()` for a customer (`403`), and `cancelOrder` checks `user.role === "staff"` again |
| Is the signing secret absent from the JavaScript the browser downloads? | Yes. `SESSION_SECRET` has no `NEXT_PUBLIC_` prefix, lives in `.env.local`, and `lib/session.js` is `server-only`. `grep -r "SESSION_SECRET" .next/static` finds nothing |

## Verified

| Check | Result |
| --- | --- |
| `npm run build` | Passes. Route table in the [README](README.md#route-table) |
| `npm run lint` | No warnings, no errors |
| `curl /checkout`, `/orders`, `/orders/1001`, `/kitchen` signed out | `307` to `/login?next=…` on all four |
| `curl -X POST /api/orders` signed out | `401 {"error":"Not signed in."}` |
| `curl /api/orders/1001` signed out | `401` |
| Customer `/kitchen` | `403`, "Staff only" |
| Staff `/kitchen` | `200`, the board, including the test order |
| No JavaScript on the receipt | `200`, the full order and the cancel form in the HTML |
| A signed-out cookie reused later | Redirected to `/login`; the row is deleted |
| A shape-valid forged cookie on `/orders` | Proxy passes (`x-addis-eats-proxy: passed`), page redirects to `/login` |

In headless Chromium, **24 checks passed**:

- sign-in returns to `?next`; the API answers `201` and omits `userId`;
- the cookie is `HttpOnly`, `Secure` and `SameSite=Lax`; `document.cookie`
  cannot see it;
- the receipt's first paint has the stage; the owner sees Cancel;
- another account's receipt is `404`, its API `403`;
- attack 1 (forged cookie) → "Not signed in.";
- attack 2 (another account's id) → "That order is not yours.";
- attack 3 (`https://`, `//`, `/\`, `/login`) → all land on `/menu`;
- staff `/kitchen` `200`; customer `/kitchen` `403`;
- the receipt works with JavaScript off;
- a signed-out cookie is dead; `/menu` is outside the proxy; a forged shape
  passes the proxy and fails the page.

The only console errors were the ones the checks cause on purpose: the `403`
from the forged cookie's poll and the `401` after sign-out.

## Files

| File | What it is |
| --- | --- |
| [proxy.js](proxy.js) | The proxy (Next 16's `middleware.js`), with the narrow matcher |
| [lib/sessionCookie.js](lib/sessionCookie.js) | The cookie's name and shape; safe for the proxy, no secret |
| [lib/session.js](lib/session.js) | `getSession`, `startSession`, `endSession`; HMAC, database session |
| [lib/safeNext.js](lib/safeNext.js) | The only place a `next` value is accepted |
| [lib/password.js](lib/password.js) | scrypt hashing, constant-time verification, `burnTime` |
| [lib/accounts.js](lib/accounts.js) | Accounts, `publicAccount`, sign-up; always a customer |
| [lib/jsonStore.js](lib/jsonStore.js) | The small JSON table behind accounts and sessions |
| [app/signup/](app/signup) | The sign-up page and its client form |
| [app/kitchen/page.js](app/kitchen/page.js) | The staff board; `forbidden()` for a customer |
| [app/forbidden.js](app/forbidden.js) | The `403` page, `noindex` |
| [app/orders/page.js](app/orders/page.js) | One person's orders, scoped to the session |
| [app/orders/[id]/page.js](app/orders/\[id\]/page.js) | The receipt; `getOrderFor(user.id, id)` |
| [app/actions.js](app/actions.js) | `signIn`, `signUp`, `signOut`, `placeOrder`, `cancelOrder` |
| [app/api/orders/route.js](app/api/orders/route.js) | `POST` requires a session; the owner is the session |
| [app/api/orders/[id]/route.js](app/api/orders/\[id\]/route.js) | `GET` requires the owner; `401` / `403` / `404` |
| [app/api/orders/[id]/stream/route.js](app/api/orders/\[id\]/stream/route.js) | Day 47. The same checks, then re-checked every tick |
| [app/api/orders/export/route.js](app/api/orders/export/route.js) | Day 47. Your own orders, or every order for staff |
