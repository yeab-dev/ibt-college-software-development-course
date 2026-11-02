# Addis Eats — Day 48: event handling & deployment

Week 10, day 3, and the last Addis Eats day. The material has two halves,
and so does the day. **Interaction you can trust:** the whole app now works
with a keyboard and a thumb as well as a mouse. Every focusable element has
the same visible ring, a skip link starts every page, and every target is at
least 44 px. A rapid double tap on *Order* places **one** order. The button
is disabled while it is pending, and the server also refuses to place the
same order twice, because the button is not the only way a request arrives.
**Then shipping it:** the production build and the pre-flight checklist are
done here, and the deployment is written up as a runbook. It was not
deployed: that needs your Vercel account, and it is your step.

- [ACCESSIBILITY.md](ACCESSIBILITY.md) is new today. It covers the audit for
  exercises 1 to 4: the clickable-div search, the focus ring, the
  keyboard-only order, Escape, the map and the charts, the double tap with
  its server-side idempotency key, and every target's size.
- [DEPLOY.md](DEPLOY.md) is new today. It covers exercises 5 to 7: the
  pre-flight results, the Vercel project settings (Root Directory), every
  variable for Production and for Preview, the post-deploy checks as
  commands, and how to roll back. It starts with what the JSON store breaks
  on Vercel.
- [AUTH.md](AUTH.md) gains "the idempotency key is not a credential".
  [BOUNDARY.md](BOUNDARY.md) gains `SubmitButton` (25 client files), and the
  cart's Checkout button is now a link. [STRATEGY.md](STRATEGY.md) notes that
  no route changed its marker.
- [PROJECT.md](PROJECT.md), [DATA.md](DATA.md), [PERF.md](PERF.md),
  [SEO.md](SEO.md), [DASHBOARD.md](DASHBOARD.md) and
  [TRACKING.md](TRACKING.md) are unchanged from earlier days.

## Run it

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET: openssl rand -base64 32
npm run build
npm run start                # http://localhost:3000
npm run lint
```

Demo accounts (AUTH.md):

- Almaz `0911223344` / `almaz1234` (customer)
- Bereket `0922334455` / `bereket1234` (customer)
- Selam `0910101010` / `selam1234` (staff)

Accounts, sessions and orders are written to `.data/`, which git ignores.
The first read seeds 425 orders over the 30 days before today. Delete the
folder to start again from the seed.

**To try today's work:**

- **Put the mouse away.** Press Tab once on any page and *Skip to content*
  appears. You can add dishes, open the basket, sign in, check out and follow
  the order on its map using only Tab, Enter, Escape and typing
  (ACCESSIBILITY.md §3).
- **Try a double tap.** Press *Order* twice quickly, with JavaScript on or
  off, and you get one order. With JavaScript off, the browser sends both
  requests and the server answers both with the same receipt.
- **Try a repeated API call.** Send the same `Idempotency-Key` header twice:

  ```bash
  curl -i -H "Cookie: addis-eats-session=…" -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(node -p 'crypto.randomUUID()')" \
    -d '{"name":"Almaz Bekele","phone":"0911223344","area":"Bole","notes":"","items":[{"id":1,"quantity":1}]}' \
    http://localhost:3000/api/orders
  ```

  Run it twice with the same key in place of `$(…)`. The first answer is
  `201 Created`. The second is `200`, with `Idempotent-Replayed: true` and
  the same order.

## Live URL

**Not deployed yet.** Deploying is the student's step. Follow
[DEPLOY.md](DEPLOY.md):

- Set **Root Directory** to `M03-react-nextjs/day48/addis-eats`.
- Give Production and Preview different `SESSION_SECRET` values.
- Set `NEXT_PUBLIC_SITE_URL` before the first build.
- Then run §5's checks in a private window.

Once it is live, put the URL here.

**What will not work there, honestly (as on Days 45–47):** accounts,
sessions and orders are JSON files in `.data/`, and Vercel's functions have
a read-only filesystem. So these all fail with a `500` on Vercel:

- signing in and signing up
- placing an order, so also the receipt, the map and the stream
- the kitchen and the dashboard
- today's idempotency key, which is stored with the order

These all work there, and that is where the deployment checks are run:

- the public pages, search and the cart
- the sitemap, robots.txt and the share cards
- the proxy's redirects and every handler's `401`

Show the signed-in walkthrough on `npm run build && npm run start`. The fix
is a hosted database (Module 4).

## The seven exercises, and where each landed

| # | Exercise | Where |
| --- | --- | --- |
| 1 | Replace every clickable div with a button or link; restore visible focus | No clickable div existed: every `onClick` was already on a `<button>` or an `<a href>`. One button was doing a link's job: the cart's *Checkout* called `router.push`, and it is now a `<Link>` ([CartContents.jsx](app/cart/CartContents.jsx)). Focus: one `:focus-visible` rule ([globals.css](app/globals.css), Day 48 block) replaced the browser's thin default ring on 75 of 188 stops. Afterwards all **476** stops on 13 pages at two widths show the 2 px accent ring ([§1–2](ACCESSIBILITY.md#1--clickable-divs-and-a-button-doing-a-links-job)) |
| 2 | Reach every function with Tab, Enter and Escape; fix what you cannot | A scripted keyboard-only order, from a browser with no cookies to the receipt and back to the list. Added a skip link ([layout.js](app/layout.js)). Escape clears the search box and hides a chart's tooltip. There is no modal or menu, so nothing else needs closing. The Leaflet map and the Recharts charts are not keyboard traps ([§3](ACCESSIBILITY.md#3--tab-enter-and-escape)) |
| 3 | Disable submit buttons while pending; a double tap places one order | Client: `useActionState`'s `pending` (since Day 39). Today [SubmitButton.jsx](components/SubmitButton.jsx) adds `useFormStatus` for the server-rendered *Refuse* and *Sign out* forms. Server: a random key in a hidden field ([checkout/page.js](app/checkout/page.js)), checked inside the write queue ([lib/orders.js](lib/orders.js)), plus an `Idempotency-Key` header on `POST /api/orders` ([route.js](app/api/orders/route.js)). Six double-submit cases each placed **1** order. The control case, with JavaScript off and the key removed, placed **2** ([§4](ACCESSIBILITY.md#4--one-order-per-tap)) |
| 4 | Every touch target at least 44 px; nothing hidden behind hover | 13 kinds of target raised to 44 px, including the tabs and category buttons, which were 41 px below 1024 px wide, the Leaflet zoom buttons and the map pins. What remains smaller is links inside a sentence or a credit line, which WCAG exempts. No `:hover` rule reveals anything ([§5](ACCESSIBILITY.md#5--targets-a-thumb-can-hit-and-nothing-behind-hover)) |
| 5 | `npm run build`, read the route table, work the pre-flight checklist | [DEPLOY.md §1](DEPLOY.md#1--pre-flight-done-locally-exercise-5): every marker is unchanged, all 4 variables are in `.env.example`, the secret is in 0 files of `.next`, `metadataBase` is built from the variable, no remote images, and no relative fetch on the server |
| 6 | Deploy to Vercel with per-environment variables | **Not done; this is the student's step.** The runbook is in [DEPLOY.md §2–4](DEPLOY.md#2--the-vercel-project-once): project settings, a table of variables per environment, and the same steps with the CLI |
| 7 | Post-deployment checks in a private window | **Not done** (nothing is deployed). [DEPLOY.md §5](DEPLOY.md#5--after-it-is-live-the-checks-exercise-7) has them as copy-paste `curl` commands plus manual steps. Every command was run against the local production server, with the results below |

## The mini-project's requirements

| Requirement | Where it is shown |
| --- | --- |
| No clickable divs: every interactive element is a button or a link | Exercise 1 |
| Visible focus everywhere, every function reachable by keyboard | Exercises 1 and 2: 476 stops with the ring, and the full order by keyboard |
| Forms handled with onSubmit, submit buttons disabled while pending | Every form submits through `action` (with `onSubmit` on the checkout), so Enter in a field submits it, as the keyboard run showed. All six kinds of submit button are disabled while pending |
| Touch targets of at least 44 px, nothing hidden behind hover | Exercise 4 |
| A clean `npm run build`, with the pre-flight checklist worked through | Exercise 5 |
| Deployed with variables set separately for preview and production | Not deployed (above). The variables table is DEPLOY.md §3 |
| Every post-deployment check passing, in a private window | The signed-out checks pass locally in a fresh browser context (below). Running them live is DEPLOY.md §5 |

## Check yourself

| Question | Answer |
| --- | --- |
| Can you place an order using only the keyboard, start to finish? | Yes. Starting signed out in a browser with no cookies: menu → Add ×2 → basket → Checkout → sign in → checkout form → Enter → receipt `/orders/1446` → the map (pan, zoom, pins) → *All your orders* → the new order. Every stop was ringed, and there were no console errors |
| Does a rapid double tap on Place order create one order or two? | **One.** With JavaScript on, the second tap hits a disabled button. With JavaScript off, two POSTs arrive and the key turns them into one order. Without the key, the same two POSTs made two orders |
| Does the application work in a private window with no session? | Yes, tested in a fresh 390 px touch context. Every public page returned `200`. The five private routes returned `307` → `/login?next=…`. A tap on *Add* gave *1 item*. The only cookie set was the basket. No console errors |
| Is any secret visible in the JavaScript the browser downloads? | No. `SESSION_SECRET`'s value is in **0** files under `.next/static`, and 0 anywhere in `.next`. The `/menu` scripts don't contain the variable's name either. The only `NEXT_PUBLIC_` names are the site URL and the analytics URL |
| Does a shared link from the live URL render as a card? | Not deployed. Locally, `og:image` is absolute and the image is `200 image/png`. On Vercel it only points at the live host if `NEXT_PUBLIC_SITE_URL` is set before the build (DEPLOY.md §3) |
| Do you know how to roll back, without looking it up? | Deployments → the last good one → Instant Rollback, or `vercel rollback`. Then `vercel promote` the fixed deployment, because after a rollback a new push does not go live by itself (DEPLOY.md §6) |

## Verified

Production build, `next start -p 3048`, curl and headless Chromium. Only
one browser ran at a time, and each was closed after its run. The scripts
are outside the repository. Map tiles were aborted in every automated run.

| Check | Result |
| --- | --- |
| `npm run lint` | No warnings, no errors |
| `npm run build` | Passes. Same route table as Day 47 (DEPLOY.md §1) |
| Focus rings, 13 pages × 1200 px and 390 px | 476 tab stops. All of them `solid 2px` accent, and all of them matched `:focus-visible` |
| Targets under 44 px, same pages | None, except in-sentence links: *Create an account*, *Sign in*, the photo credits, and Leaflet's attribution |
| Keyboard-only order | Above. The button was disabled with *Sending your order — ETB 480…*, and a second Enter did nothing: 445 → 446 orders |
| Skip link | First Tab: visible at (16, 8), 148 × 44, ringed. Enter → focus on `#content`. The next Tab went to the first control in the page |
| Map by keyboard | Arrows pan. Enter on *zoom in* (44 × 45) zooms. A focused pin (now 48 × 44) opens its tooltip. Tab leaves the map |
| Charts by keyboard | The SVG is focusable and ringed. ArrowRight shows *Megenagna · ETB 34,250*, then *Kazanchis*. Escape hides the tooltip. Tab goes on to the next chart. Enter opens *as a table* |
| Double submit, as Bereket | JS on, two taps 150 ms apart: 1 POST, 1 order. JS on, `dblclick`: 1 POST, 1 order. JS on, `requestSubmit` ×2: 1 POST, 1 order. **JS off, two taps: 2 POSTs, 1 order.** JS off, `dblclick`: 1 POST, 1 order. **Control, JS off without the key: 2 POSTs, 2 orders** |
| API idempotency | Two concurrent POSTs with one key returned `201` and `200` (`Idempotent-Replayed: true`): one order, `#1440` in both bodies, and no key in either body. The same key later: `200`. No key: two orders. Almaz sending Bereket's key: `201` and a new order of her own |
| *Refuse* while pending (390 px, tapped) | Seen `disabled` as *Refusing #1453…* before the board re-rendered |
| Phone width | `scrollWidth` 390 on 9 pages, including the dashboard and a live receipt: no sideways scroll |
| DEPLOY.md §5 commands, against the local server | Public pages `200`. `/checkout` and `/dashboard` → `location: /login?next=…`. The four handlers `401`. A forged cookie `401`. `?next=https://evil.example` → hidden `next` is `/menu`. `og:image` absolute and its image `200 image/png`. 0 private routes in the sitemap. 0 mentions of `SESSION_SECRET` in `/menu`'s scripts |

## Where the material and the installed versions disagree

| The course says | The installed docs / library | What was done |
| --- | --- | --- |
| Route table `○ static ƒ dynamic ^ ISR` (the deck: `△ ISR`) | Next.js 16.4 prints `○` Static, `●` SSG and `ƒ` Dynamic, with Revalidate and Expire columns. There is no ISR symbol | Read the columns: `○ 1h` is a page that revalidates |
| `onPointerDown` "for anything you would otherwise write twice" | `click` already covers mouse, touch, pen and the keyboard (Enter and Space on a button). A keyboard never fires `pointerdown`, so using it for activation would break the keyboard path | Activation stays on `onClick` and form `action`s |
| `type="tel" inputMode="numeric"` | MDN: `numeric` offers digits only, but TeleBirr numbers may start with `+251` | `inputMode="tel"` (since Day 33) |
| "Targets at least 44 × 44" | WCAG 2.2: 44 px is 2.5.5, level AAA. The AA minimum (2.5.8) is 24 px. Both exempt links inside a sentence | 44 px everywhere except in-sentence links |
| "Disable while pending" as the fix | The forms guide shows the same `disabled={pending}`, which only helps while JavaScript runs. With it off, two requests arrive (measured) | Also a server-side idempotency key, as the slide's own note asks |
| Set the preview's `NEXT_PUBLIC_SITE_URL` to "the preview URL" | Each preview has its own URL, unknown before the build, and `NEXT_PUBLIC_` values are "frozen with the value evaluated at build time" (installed `environment-variables.md`) | Previews use the production URL. A branch-scoped value is the escape hatch (DEPLOY.md §3) |
| Deploy: push, import, variables, deploy | This repository holds the whole course, so it also needs **Root Directory** | DEPLOY.md §2 |
| "The three Day 45 attacks, all refused" on the live URL | Signing in cannot work on Vercel with a JSON-file store | Door-level checks live; the full attacks on `npm run start` |
| `Component.propTypes` | React 19 ignores them (CLAUDE.md) | Kept as documentation on `SubmitButton`, as elsewhere |

## Deviations, honestly

- **Not deployed**, and the signed-in half of the app could not work on
  Vercel if it were (above).
- **The idempotency guarantee holds per server process.** The write queue
  lives in one process's memory and the store is one file. A database
  would enforce it with a unique index on `(userId, idempotencyKey)`
  (ACCESSIBILITY.md §4).
- **A checkout restored with the Back button keeps its old key.** If that
  key already placed an order, submitting it again shows that order. The
  restored page also shows the old basket, so the answer matches what is on
  screen. A fresh visit renders a fresh key.
- **No real phone was used.** The touch checks ran in Chromium's mobile
  emulation at 390 px with touch enabled. The sheet asks for a real device,
  and that is still worth doing once the app is live (DEPLOY.md §5, step 6).
- **`/menu` still puts focus in the search box on arrival** (Day 33's
  choice), so the skip link is not the first Tab stop there.

## What changed from Day 47

| File | Change |
| --- | --- |
| `app/globals.css` | Day 48 block: a global `:focus-visible` ring, the skip link, `.tap`, 44 px minimums for the tabs, category buttons, remove, sign-out/refuse/cancel, pagers, sort headers, the summary, the broken-kitchen switch, the CSV links and Leaflet's zoom. Pin boxes 44 px tall |
| `app/layout.js` | The skip link. The page wrapper is `id="content" tabIndex={-1}` |
| `components/SubmitButton.jsx` | New: `useFormStatus`, a submit button disabled while pending |
| `app/kitchen/page.js`, `app/login/page.js`, `app/checkout/Checkout.jsx` | *Refuse* and *Sign out* use `SubmitButton` |
| `lib/orders.js` | `createOrder({ key })`: replay by idempotency key, checked before the work and again inside the write queue. `publicOrder` drops the key |
| `app/actions.js`, `app/api/orders/route.js` | Pass the key along (hidden field / `Idempotency-Key` header). The API answers a replay with `200` and `Idempotent-Replayed: true` |
| `app/checkout/page.js`, `app/checkout/Checkout.jsx` | A fresh `randomUUID()` per render, in a hidden field |
| `app/cart/CartContents.jsx` | *Checkout* is a `<Link>`, not a button with `router.push` |
| `app/orders/[id]/DeliveryMap.jsx` | Pin icons 44 px tall, same anchor point |
| `app/menu/Dish.jsx`, `app/page.js`, `app/menu/[id]/page.js`, `components/OrderTable.jsx`, `app/orders/page.js`, `app/orders/[id]/page.js`, `app/dashboard/page.js` | `className="tap"` on links that stand on their own |
| `ACCESSIBILITY.md`, `DEPLOY.md` | New |
| `AUTH.md`, `BOUNDARY.md`, `STRATEGY.md`, `README.md` | Day 48 sections; this file |

## The end of Addis Eats: Days 36–48

The documents together describe the whole app. Each one answers one
question about it:

| Document | The question it answers | Day |
| --- | --- | --- |
| [STRATEGY.md](STRATEGY.md) | How does each route render (static, ISR, dynamic), and does the build agree? | 37 |
| [BOUNDARY.md](BOUNDARY.md) | Which components run in the browser, and why each one has to | 38 |
| [DATA.md](DATA.md) | Where each piece of data is fetched, its cache key and refresh rule, and where it is stored | 41 |
| [AUTH.md](AUTH.md) | Who may see and change what, and how the three layers (proxy, page, query/action) enforce it | 42 |
| [PERF.md](PERF.md) | What the app costs to load, measured, and against a budget | 43, 45 |
| [SEO.md](SEO.md) | How each page describes itself to search engines and share previews | 44 |
| [PROJECT.md](PROJECT.md) | The one-page view: access, data and budget | 45 |
| [DASHBOARD.md](DASHBOARD.md) | How a month of orders becomes charts and tables, and their loading, empty and error states | 46 |
| [TRACKING.md](TRACKING.md) | The map, the live stream, one formatting module, and the CSV export | 47 |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | Can it be used with a keyboard and a thumb, and does a double tap order twice? | 48 |
| [DEPLOY.md](DEPLOY.md) | How it goes live, how to check it, how to roll it back, and what the JSON store prevents | 48 |

What the project covers, day by day:

- **Day 36:** the Day 34 Vite app moved to Next.js with file-based routes.
- **Day 37:** layouts and a deliberate rendering strategy per route.
- **Day 38:** server components by default, with client components only at
  the interactive leaves.
- **Day 39:** route handlers and server actions that work without
  JavaScript, writing to a queued JSON store.
- **Day 40:** loading and error states, and a live order status.
- **Day 41:** SWR, seeded from the server, with a debounced search.
- **Day 42:** sessions, roles, a proxy and the three attacks.
- **Day 43:** images, fonts and environment variables.
- **Day 44:** metadata, share images, a sitemap and JSON-LD.
- **Day 45:** the three decisions checked against the code.
- **Day 46:** a staff dashboard with server-sorted, paginated tables.
- **Day 47:** a delivery map, server-sent events, `lib/format.js` and CSV.
- **Day 48:** keyboard, focus, touch, one order per tap, and the road to
  production.

What it doesn't have yet is a real database. That is the one thing between
this snapshot and a deployment where signing in works, and it is where
Module 4 begins.
