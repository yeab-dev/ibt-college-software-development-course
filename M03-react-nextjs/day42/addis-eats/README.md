# Addis Eats — Day 42: middleware and authentication

Week 9. Until yesterday every request to Addis Eats was anonymous. An order
belonged to a phone number typed into a form; `/orders` was the same kitchen
board for every visitor; `GET /api/orders/1001` answered anyone who asked, and
the poll that keeps a receipt current had no idea whose order it was returning.

Today the application learns who is asking. A real sign-in and sign-up, a
session in a cookie with the three flags that matter, three layers of
protection — and only one of them is actually security.

- [AUTH.md](AUTH.md) is the required document: every protected route, its
  layers, what each layer proves, and the three attacks with what happened.
- [STRATEGY.md](STRATEGY.md), [BOUNDARY.md](BOUNDARY.md) and [DATA.md](DATA.md)
  are updated for the new routes and the now-authenticated endpoint.

## Run it

```bash
npm install
cp .env.example .env.local   # then replace the value: openssl rand -base64 32
npm run build
npm run start                # http://localhost:3000
npm run dev                  # for working on it
npm run lint
```

`.data/` is gitignored and holds the runtime data (`accounts.json`,
`sessions.json`, `orders.json`). Delete it to start from the seed again.

### Demo accounts

| Name | Phone | Password | Role |
| --- | --- | --- | --- |
| Almaz Bekele | `0911223344` | `almaz1234` | customer |
| Bereket Haile | `0922334455` | `bereket1234` | customer |
| Selam Tesfaye | `0910101010` | `selam1234` | staff |

`/signup` creates a customer account. There is no way to make yourself staff
from a form.

## The seven exercises, and where each landed

| # | Exercise | Where |
| --- | --- | --- |
| 1 | A `getSession` helper that reads and verifies the cookie | [lib/session.js](lib/session.js). HMAC-SHA256 over a random token, `timingSafeEqual`, a database session row, one React `cache()` per request |
| 2 | Set the cookie with `httpOnly`, `secure`, `sameSite` and a sensible `maxAge` | `startSession` in [lib/session.js](lib/session.js): a week, `path: "/"` |
| 3 | Middleware for `/checkout` and `/orders`, narrow matcher | [proxy.js](proxy.js) (Next.js 16's new name for `middleware.js`), matcher `["/checkout/:path*", "/orders/:path*", "/kitchen/:path*"]` |
| 4 | Carry the intended destination in `next` and return to it | The proxy writes it; `/login` shows it; `signIn`/`signUp` redirect to it |
| 5 | Reject a `next` that does not start with a slash, and test a crafted link | [lib/safeNext.js](lib/safeNext.js). It parses the value instead of pattern-matching, so `//host`, `/\host` and `/login` are rejected too |
| 6 | Scope the orders query to the session id | `listOrdersFor(user.id)`, `getOrderFor(user.id, id)` ([lib/orders.js](lib/orders.js)); `cancelOrder` checks the record's owner |
| 7 | A staff role and a `/kitchen` route, checked server-side | [app/kitchen/page.js](app/kitchen/page.js): `forbidden()` for a customer, a real `403`; `cancelOrder` checks the role again |

The mini-project's extra requirements:

| Requirement | Where |
| --- | --- |
| A session cookie with `httpOnly`, `secure`, `sameSite`, and a `getSession` helper | `lib/session.js`; verified from the `Set-Cookie` header |
| Middleware with a narrow matcher, redirecting signed-out visitors and remembering the destination | `proxy.js`; `/menu` was measured at `200` with no proxy header |
| The `next` parameter validated so an absolute URL cannot be used | `lib/safeNext.js`; the three attacks in AUTH.md |
| Every private page verifying the session while rendering | `/checkout`, `/orders`, `/orders/[id]`, `/kitchen` |
| Queries scoped to the session id, not an id from the request | `lib/orders.js`'s `listOrdersFor` and `getOrderFor` |
| Session and ownership both checked inside every writing action | `placeOrder`, `cancelOrder`, `POST /api/orders` |
| `AUTH.md` listing each protected route, its layers, and what each proves | [AUTH.md](AUTH.md) |
| The three attacks, documented | [AUTH.md](AUTH.md#the-three-attacks) |

## Decisions

**A database session, not a signed token.** The reading sheet allows either.
Revocation chose it: signing out deletes the row, so a copied cookie stops
working at once. A token would stay valid until it expired. The price is one
JSON lookup per request, which this application can afford.

**The cookie holds a token and its HMAC.** The token is 32 random bytes. The
HMAC (with `SESSION_SECRET`, server-only) means a made-up or altered value is
refused before the session table is read. The table stores `sha256(token)`, so
a copy of `.data/sessions.json` holds no usable cookie. Comparisons use
`timingSafeEqual`. A new token is created on every sign-in, so a session id
chosen before sign-in (session fixation) is never promoted.

**`scrypt`, because Node has it.** The sheet says bcrypt or argon2. Neither is
built in; `scrypt` is the same kind of deliberately slow, memory-hard function,
and adding a native password package for a teaching project is a build risk for
no gain. `N=16384, r=8, p=1` is OWASP's minimum, with a 16-byte salt per
account. The parameters travel inside the stored hash, so they can be raised
later without invalidating old passwords.

**Two different answers, on purpose.** An unknown phone and a wrong password
both say the same thing, and an unknown phone spends the time a real check
would (`burnTime`). Sign-up does say when a number already has an account;
there is no email or SMS channel with which to hide it, and pretending
otherwise would only make the form confusing.

**`/orders` became the person's list; the board moved to `/kitchen`.** The
slides put the page check on `/orders` and a staff-only `/kitchen` beside it.
That is a product change: for three days `/orders` was the public kitchen
board, static and rebuilt by `revalidatePath`. A board that shows every
customer's order and lets staff refuse one is not for everyone, so it now sits
behind a role. `/orders` is the reading sheet's own example — *"your orders,
and nobody else's"* — and is dynamic because it reads the session.

**The proxy checks shape, never truth.** `proxy.js` imports only
`lib/sessionCookie.js`: the cookie's name and a regular expression for
`<43>.<43>`. It does not import `lib/session.js`, because that would pull
`node:crypto`, the session table and the secret into the edge runtime, and
because middleware is the wrong place for the only check. It can be fooled by
a forged value of the right shape (measured: the proxy says `passed`, the page
says `307` to `/login`), which is exactly why every page and every write
checks again.

**Next.js 16 calls it `proxy.js`.** The course says `middleware.js`; the
framework renamed the convention and the export to `proxy`. The file sits in
the same place, runs at the same moment and exports the same `config.matcher`;
only the name changed. The comment at the top points at the installed docs.

**`next` is parsed, not pattern-matched.** The sheet's one-line
`startsWith("/")` stops `https://evil.example` but not `//evil.example`,
`/\evil.example` or `/<TAB>/evil.example`, all of which a browser reads as
another host. `safeNext` parses the value against `http://addis-eats.invalid`
and accepts it only if the origin is still that one. What the redirect receives
is the parsed path, not the string that arrived.

**`forbidden()` needs `experimental.authInterrupts`.** In Next.js 16.4 it is
still experimental. Without it, `/kitchen` would have to answer `404`, or
render a `200` that says "no" — both worse than a real `403` for a signed-in
customer who is simply not staff. The flag is in
[next.config.mjs](next.config.mjs), and the deviation is named here because it
is experimental.

**A server action posts to a real endpoint.** The cancel button's action id
and the bound order id are both in the HTML. Hiding the button is interface;
`cancelOrder` re-establishes the session and the owner every time. The same is
true of `placeOrder`, whose page guard is not its door.

**No new dependency.** The account, password and session code is `node:crypto`
and two small JSON files. Auth.js is the production answer; this is the
exercise that teaches what Auth.js is doing. The README says so rather than
pretending the file store is a database.

## The three attacks

The full transcript is in [AUTH.md](AUTH.md#the-three-attacks). In short:

| Attack | Result | Stopped by |
| --- | --- | --- |
| Call the cancel action while signed out, or with a forged shape-valid cookie | No cookie: `307` to `/login` before the action ran. Forged cookie: proxy passes, action says **"Not signed in."** Order unchanged | The proxy's matcher, then `getSession()` inside `cancelOrder` |
| Sign in as one account and cancel another account's order | **"That order is not yours."** The page is `404`, the API is `403`, the order stays `placed` | `cancelOrder`'s owner comparison; `getOrderFor` scopes the reads |
| Craft a sign-in link with `next` pointing at another site | `https://evil.example`, `//evil.example` and `/\evil.example` all land on `/menu`; `/orders` still works | `safeNext`'s origin check |

## Route table

`npm run build`, Next.js 16.4.2:

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
├ ƒ /kitchen
├ ƒ /login
├ ○ /menu                           1h      1y
├   /menu/[id]
│ ├ ● /menu/doro-wat                1h      1y
│ ├ ● /menu/shiro                   1h      1y
│ ├ ● /menu/tibs                    1h      1y
│ └ ● [+10 more paths]
├ ƒ /orders
├ ƒ /orders/[id]
└ ƒ /signup


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

The rows that changed from Day 41:

| Route | Day 41 | Day 42 | Why |
| --- | --- | --- | --- |
| `/orders` | `○` static, on-demand | `ƒ` dynamic | It reads the session and shows one person's orders |
| `/kitchen` | — | `ƒ` dynamic | Reads the session and the role; staff only |
| `/signup` | — | `ƒ` dynamic | Reads the session and `?next=` |
| `/checkout` | `ƒ` | `ƒ` | Still dynamic; the guard now verifies a real session |
| `/orders/[id]` | `ƒ` | `ƒ` | Still dynamic; the read is scoped to the session |
| `/api/orders` | `ƒ` | `ƒ` | Still dynamic; now `401` without a session |
| `/api/orders/[id]` | `ƒ` | `ƒ` | Still dynamic; now `401` / `403` / `404` |

Every query the browser makes is still in [DATA.md](DATA.md). Day 42 added no
client-side query: the poll's key is unchanged, but the endpoint behind it now
answers only the owner.

## What the browser and curl show

Signed out, before any page renders:

```
$ for p in /checkout /orders /orders/1001 /kitchen; do curl -s -o /dev/null \
    -w "$p -> %{http_code} %{redirect_url}\n" localhost:3042$p; done
/checkout -> 307 http://localhost:3042/login?next=%2Fcheckout
/orders -> 307 http://localhost:3042/login?next=%2Forders
/orders/1001 -> 307 http://localhost:3042/login?next=%2Forders%2F1001
/kitchen -> 307 http://localhost:3042/login?next=%2Fkitchen

$ curl -s -X POST -H 'content-type: application/json' \
    -d '{"name":"X"}' localhost:3042/api/orders
{"error":"Not signed in."}          # 401

$ curl -s localhost:3042/api/orders/1001
{"error":"Not signed in."}          # 401
```

The session cookie, as the server sets it:

```
set-cookie: addis-eats-session=…; Path=/; Expires=Sun, 01 Nov 2026 …
            Max-Age=604800; Secure; HttpOnly; SameSite=lax
```

`document.cookie` in the browser does not contain it.

## Check yourself

| Question | Answer |
| --- | --- |
| Can any script on the page read the session cookie? | No: `HttpOnly`. Measured with `document.cookie` |
| Does `/orders` work if the id in the URL is changed to someone else's? | No. `/orders/1002` as Bereket is `404`; the API is `403`. The query is `getOrderFor(user.id, id)` |
| Does the proxy run on image files? | No. The matcher is three paths; `/menu` is `200` with no `x-addis-eats-proxy` header |
| Did the three attacks fail, and can you name the line that stopped each? | Yes. `looksLikeSession`/matcher; `getSession()` + owner comparison in `cancelOrder`; `safeNext`'s origin check |
| Is the staff link merely hidden, or actually refused server-side? | Refused. `/kitchen` gives a customer a `403`; `cancelOrder` checks the role again |
| Is the signing secret in the browser's JavaScript? | No. No `NEXT_PUBLIC_`, `.env.local` is gitignored, and `lib/session.js` is `server-only` |

## Verified

On the production build (`npm run build && npm run start -p 3042`, `.data/`
seeded from the accounts seed and cleared of test orders afterwards):

| Check | Result |
| --- | --- |
| `npm run build` | Passes; the route table above |
| `npm run lint` | No warnings, no errors |
| Signed-out pages | `307` to `/login?next=…` on `/checkout`, `/orders`, `/orders/1001`, `/kitchen` |
| Signed-out endpoints | `401` on `POST /api/orders` and `GET /api/orders/[id]` |
| Customer `/kitchen` | `403`, "Staff only" |
| Staff `/kitchen` | `200`, the board lists the test order |
| Receipt with JavaScript off | `200`, the full order and the cancel form in the HTML |
| Reusing a signed-out cookie | Redirected to `/login`; the row is gone |
| A forged shape-valid cookie on `/orders` | The proxy passes it; the page redirects to `/login` |

In headless Chromium, **24 checks passed**:

- sign-in returns to `?next`; `POST /api/orders` is `201` and omits `userId`;
- the cookie is `HttpOnly`, `Secure` and `SameSite=Lax`, and `document.cookie`
  cannot see it;
- the receipt's first paint has the stage; the owner sees Cancel;
- another account's receipt is `404`, its API `403`;
- attack 1 (forged cookie) → "Not signed in.";
- attack 2 (another account's id) → "That order is not yours.";
- attack 3 (`https://`, `//`, `/\`, `/login`) → all land on `/menu`;
- staff `/kitchen` `200`, customer `/kitchen` `403`;
- the receipt works with JavaScript off;
- a signed-out cookie is dead; `/menu` is outside the proxy; a forged shape
  passes the proxy and fails the page.

The only console errors were the ones the checks cause on purpose: the `403`
from the forged cookie's poll and the `401` after sign-out.

## Deviations, honestly

- **`proxy.js`, not `middleware.js`.** Next.js 16 renamed it. Same file
  position, same matcher, same export contract; only the name changed. The
  course's slides are written for Next.js 15.
- **A `/signup` page exists.** The slides assume accounts already exist, or
  use a library's provider. Addis Eats has no provider, so without a form
  there would be no way to create the second account the ownership tests need.
  It is the same six steps as sign-in, with a name and a uniqueness check.
- **Sign-up can enumerate phone numbers.** It has to, without email or SMS.
  Sign-in does not: one answer for both failures, and `burnTime` for the
  unknown number.
- **`scrypt`, not bcrypt or argon2.** See Decisions. The format is
  self-describing, so a later migration is possible.
- **`forbidden()` is experimental.** `authInterrupts` in `next.config.mjs`.
  The alternative was a `404` or a `200` that says no.
- **The order's owner is an account id, not a phone number.** Day 39–41 stored
  the phone number in `userId`. A number can change, and an account id can go
  in a log without putting a phone number in the log. A `.data/orders.json`
  left over from Day 41 will not show its orders to the new accounts; a fresh
  clone never sees that.
- **No rate limiting, password reset, email verification or session list.**
  Named in [AUTH.md](AUTH.md#what-is-deliberately-not-here). A production flow
  needs all four, and Auth.js is the sensible place to get them.
- **The file store is one process.** `.data/accounts.json` and
  `.data/sessions.json` are read and rewritten whole. Module 4 replaces them
  with a database.

## What changed from Day 41

| File | Change |
| --- | --- |
| `proxy.js` | New: Next 16's middleware, narrow matcher, shape check only |
| `lib/sessionCookie.js` | New: the cookie name and shape, no secret |
| `lib/session.js` | Replaced the Day 39 signed-phone stand-in with a database session, HMAC, `startSession`/`endSession`, `cache()` |
| `lib/password.js`, `lib/accounts.js`, `lib/jsonStore.js` | New: scrypt hashes, accounts, the JSON table |
| `lib/safeNext.js` | New: parsed-origin validation for `next` |
| `data/accounts.seed.json` | New: three demo accounts, hashes only |
| `lib/orders.js` | `listOrdersFor`, `getOrderFor`, `publicOrder`; `createOrder` requires `userId` |
| `app/actions.js` | `signIn`, `signUp`, `signOut`; `placeOrder` requires a session; `cancelOrder` checks the owner or staff |
| `app/login/LoginForm.jsx`, `app/login/page.js` | Password field; `next`; the signed-in state and staff link |
| `app/signup/` | New: the customer sign-up page and form |
| `app/kitchen/page.js` | New: the staff board, moved from `/orders` |
| `app/forbidden.js` | New: the `403` page |
| `app/orders/page.js` | The person's own orders, scoped to the session |
| `app/orders/[id]/page.js` | `getOrderFor(user.id, id)`; staff paths unchanged |
| `app/checkout/page.js` | Verifies the session and passes the account's name and phone |
| `app/api/orders/route.js` | `401` without a session; the owner is the session's id |
| `app/api/orders/[id]/route.js` | `401` / `403` / `404`; the owner is an account id |
| `components/NavTabs.jsx` | "Your orders" instead of the board; no Kitchen tab |
| `app/globals.css` | The board, forbidden and sign-up styles |
| `next.config.mjs` | `experimental.authInterrupts` for `forbidden()` |
| `AUTH.md` | New: the required authentication document |
| `STRATEGY.md`, `BOUNDARY.md`, `DATA.md` | Updated for the new routes, the role check and the authenticated endpoint |
