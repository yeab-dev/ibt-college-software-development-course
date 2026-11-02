# Addis Eats — Day 45: the Next.js advanced project

Week 9's four topics become one application: signed in with the checks in the
right places, live where it needs to be, measurably faster, and findable. The
sheet calls it the last assessed project with a given domain.

Days 41–44 had built almost all of it, so Day 45 was an **audit against the
brief**, done the way the sheet says: fill the three decision tables first,
then prove every row with a tool rather than by looking at the app. The audit
found one real gap, and it was fixed: `/menu`'s LCP was 3.26 s against a
2.5 s budget. It is now 2.29 s. Everything else held, including all three
attacks, run again on a production build (31 of 31 checks).

**Live URL:** _not deployed yet — add the production URL here after the
first Vercel deployment (see [Deploying to Vercel](#deploying-to-vercel))._

- [PROJECT.md](PROJECT.md) is new today: the sheet's three decision tables
  (who may see what, where data is fetched, the performance budget).
- [AUTH.md](AUTH.md) gains "one line per layer" for every route and action,
  and the Day 45 attack run with the line that refused each attack.
- [DATA.md](DATA.md) gains the sheet's five data rows with the network-tab
  checks, and what the JSON-file store means on Vercel.
- [PERF.md](PERF.md) gains the budget with both columns filled, today's
  change, and the one target that was missed, with the reason.
- [STRATEGY.md](STRATEGY.md) and [BOUNDARY.md](BOUNDARY.md) record the
  removed Suspense boundary. [SEO.md](SEO.md) is unchanged.

## Run it

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET: openssl rand -base64 32
npm run build
npm run start                # http://localhost:3000
npm run lint
```

Demo accounts (AUTH.md): Almaz `0911223344` / `almaz1234` and Bereket
`0922334455` / `bereket1234` (customers), Selam `0910101010` / `selam1234`
(staff). Accounts, sessions and orders are written to `.data/`
(git-ignored); delete the folder to start again from the seed.

## Deploying to Vercel

Not done yet: deploying is the student's step. This is the checklist for it.

**The project.** Import the GitHub repository in Vercel and set **Root
Directory** to `M03-react-nextjs/day45/addis-eats`. This repository holds the
whole course, so without that setting Vercel builds the wrong folder. The
framework preset (Next.js), `npm run build` and the Node version are detected
from `package.json`.

**Environment variables** (Project → Settings → Environment Variables):

| Variable | Production | Preview | Development (local) |
| --- | --- | --- | --- |
| `SESSION_SECRET` | A fresh `openssl rand -base64 32`, marked *Sensitive* | A **different** random value, so a preview cookie is never valid in production | Your own, in `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | The production URL, e.g. `https://addis-eats.vercel.app` (no trailing slash) | The production URL too, so canonicals always point at the real site. To check a preview's own cards, set it to that branch's stable alias URL instead | Empty: falls back to `http://localhost:3000` |
| `NEXT_PUBLIC_ANALYTICS_SRC` | Empty, unless a real analytics script is added | Empty | Empty |

Two rules make the table what it is:

- `NEXT_PUBLIC_SITE_URL` is **read by the build**: it is in the prerendered
  pages, the sitemap, robots.txt and every og:image. Set it before the first
  build; after changing it, redeploy (a new build), not just restart.
- `SESSION_SECRET` has no `NEXT_PUBLIC_` prefix, so it never reaches the
  browser. Changing it signs everyone out (AUTH.md).

**The storage problem, honestly.** Addis Eats stores accounts, sessions and
orders as JSON files in `.data/` (`lib/jsonStore.js`, `lib/orders.js`).
Vercel runs the server as functions on a **read-only filesystem**: only
`/tmp` is writable, it belongs to one instance, and it is emptied when the
instance is recycled. So on Vercel, as the code stands:

- **Works:** `/`, `/menu`, every dish page, search, the cart, `/sitemap.xml`,
  `/robots.txt`, the preview images, and the protection on the way in —
  `/checkout`, `/orders` and `/kitchen` redirect to sign-in (`307`), the
  order API answers `401`. All the discovery and performance checks can be
  done there.
- **Fails with a `500`:** signing in (the first read copies the accounts
  seed into `.data/`), signing up, placing and cancelling orders — every
  write. So the signed-in walkthrough and the three attacks *cannot* be shown
  on a Vercel URL; show them on `npm run build && npm run start`.

Pointing `.data/` at `/tmp` would look like a fix and is not one: each
instance would have its own accounts and sessions, and lose them within
minutes, so a person would be signed out between two requests. The real fix
is a hosted database (Module 4, or a Postgres/Redis store from the Vercel
Marketplace) behind the same `lib/` functions. Until then, a host that runs
one long-lived `next start` process with a persistent disk would run the
whole app unchanged. The data layer was deliberately not changed today.

**After each deployment, check from the deployed URL** (the sheet's "view
source, not your code"):

```bash
URL=https://addis-eats.vercel.app      # your production URL
curl -sI $URL/checkout | grep -i 'location\|x-addis-eats-proxy'   # 307 → /login?next=%2Fcheckout
curl -s -o /dev/null -w '%{http_code}\n' $URL/api/orders/1001    # 401
curl -s $URL/menu/kitfo | grep -o '<meta property="og:image" content="[^"]*"'   # https://…, not localhost
curl -s $URL/sitemap.xml | grep -c '<loc>https://'                 # 15
curl -s $URL/robots.txt                                            # Sitemap: https://…/sitemap.xml
curl -s -o /dev/null -w '%{http_code}\n' "$URL/api/dishes?q=tibs"  # 200: data/menu.json was deployed
npx lighthouse $URL/menu --only-categories=performance             # add the column to PERF.md
```

Then paste a dish link into a chat to see the card (image, name, price), and
put the URL at the top of this README. Previews are often behind Vercel's
deployment protection, which also hides them from link-preview crawlers;
check cards on the production URL.

## The seven exercises, and where each landed

| # | Exercise | Where |
| --- | --- | --- |
| 1 | Fill the three decision tables: who may see what, where data is fetched, the budget | [PROJECT.md](PROJECT.md), one section each, every row checked against the code and then with a tool |
| 2 | Sessions, sign-in and sign-out; confirm the cookie flags | Since Day 42 ([lib/session.js](lib/session.js), [app/actions.js](app/actions.js)). Re-checked today: `HttpOnly`, `Secure`, `SameSite=Lax`, seven days; `document.cookie` cannot see it; a cookie copied before sign-out is refused after it |
| 3 | The three layers on every private route and action | Audited route by route: [AUTH.md](AUTH.md#day-45-every-route-and-action-one-line-per-layer). Every action and handler that touches private data calls `getSession()` itself; none relies on the proxy. No gap found |
| 4 | Scope every query to the session, run the three attacks, record the results | `listOrdersFor(user.id)`, `getOrderFor(user.id, id)`, owner from the session in both writes. The attack table with status codes and lines: [AUTH.md](AUTH.md#the-three-attacks-run-again-on-day-45) |
| 5 | The polled status and the debounced search, both seeded with server data | Since Day 41. Measured today: 0 requests on arriving at a receipt (the server's answer is `fallbackData`), one poll per 5 s, **one request for five keystrokes** ([DATA.md](DATA.md#day-45-the-sheets-five-rows-and-how-each-was-checked)) |
| 6 | Baseline, optimise, fill both columns of the budget | Baseline taken on the finished features; one optimisation (`/menu`'s cards out of the Suspense boundary: LCP 3.26 → 2.29 s, score 91 → 98); both columns in [PERF.md](PERF.md#day-45-the-performance-budget) |
| 7 | Metadata, previews, sitemap and robots, then deploy and verify from the source | Metadata since Day 44 ([SEO.md](SEO.md)), re-checked on today's build. Deploy: [the checklist above](#deploying-to-vercel); not deployed yet |

## The six areas, and the definition of done

| Area / "done" line | Where it is shown |
| --- | --- |
| Accounts: sign in, sign out, a session in a flagged cookie | Exercise 2 |
| Protection: middleware, a page check, and a check in every action | [AUTH.md](AUTH.md#day-45-every-route-and-action-one-line-per-layer): `proxy.js`, `getSession()` in each page, `getSession()` + owner/role in `cancelOrder`, `placeOrder` and both order handlers |
| Ownership: every query scoped to the session, never to a sent id | The sent id is only "where to look"; `getOrderFor`/`listOrdersFor` filter by `user.id`. Attack 2: `404` on the page, `403` on the API and the action |
| Live data: one polled query, one debounced search | Exercise 5 |
| Performance: a measured improvement, documented | Exercise 6 |
| Discovery: metadata, previews, sitemap, structured data | [SEO.md](SEO.md) (Day 44); today's build serves the same 15-URL sitemap, the same robots.txt and absolute og:image URLs |
| "Three attacks all fail" | 31/31, each with the refusing line |
| "A recorded before and after" | PERF.md's budget table |
| "Server data seeds the client query" | The receipt: stage in the HTML, no request on arrival |
| "A distinct description on every route" | SEO.md's route table (Day 44) |
| "A card with an image and a price" | `/menu/[id]/opengraph-image`, 1200 × 630, name and price (SEO.md) |
| "Works on a deployed preview" | **Not yet**: no deployment, and the JSON store will not write on Vercel (above) |

## Check yourself

| Question | Answer |
| --- | --- |
| Did all three attacks fail, and can you name the line that stopped each? | Yes. Signed out: `app/actions.js:219` (and `proxy.js:27` where the matcher reaches); another account: `app/actions.js:236`, `app/api/orders/[id]/route.js:35`, `app/orders/[id]/page.js:56`; crafted link: `lib/safeNext.js:36`, applied in `app/actions.js:67` |
| Can you change the id in a private URL and see someone else's data? | No. Bereket at `/orders/1001` gets a `404`; `/api/orders/1001` a `403` |
| Does typing five characters fire one request or five? | One: `kitfo` at 80 ms per key → `/api/dishes?q=kitfo` only. A pause in the middle makes two, one per pause |
| Does the order page show data on arrival, with no spinner? | Yes: *In the kitchen* is in the HTML, and no request to the API goes out until the first poll at 5 s |
| Are both columns of the performance budget filled in? | Yes, all five measures; First Load JS misses its target and PERF.md says why |
| Does a shared link render as a card with an image, from the deployed URL? | Locally yes (SEO.md: four cards checked). From a deployed URL: not yet, there is none |
| Are all six capstone rows true tonight? | Out of scope here: the capstone is a separate repository |

## Verified

| Check | Result |
| --- | --- |
| `npm run lint` | No warnings, no errors |
| `npm run build` | Passes; the route table is identical to Day 44's (`○ /menu` 1h, `●` dish pages, `ƒ` private routes, `ƒ Proxy`) |
| Attacks + live data + cookie, headless Chromium and raw HTTP, `next start -p 3045` | 31/31 passed (AUTH.md has each result) |
| `/menu` HTML | No `$RC(` swap any more; 13 cards as plain HTML |
| `/menu/pizza` | Still a real `404` |
| Lighthouse, mobile defaults, 5–15 runs per page | `/menu` 98, LCP 2.29 s; `/` 97, 2.56 s; `/menu/doro-wat` 99, 1.96 s; CLS 0 everywhere |
| `/sitemap.xml`, `/robots.txt`, a dish page's `<head>` | 15 URLs, no private route; five `Disallow`s; absolute og:image |

## Where the material and the installed Next.js 16.4 disagree

| The course says | Next.js 16.4 (its bundled docs) | What was done |
| --- | --- | --- |
| "Middleware" | Renamed: `proxy.js` exporting `proxy` (`file-conventions/middleware.md`) | `proxy.js`, since Day 42 |
| "First Load JS, /menu" as a budget line (read from `next build`) | `next build` no longer prints size or First Load JS; the upgrade guide calls them inaccurate with Server Components and points to Lighthouse (`upgrading/version-16.md`) | Measured as transferred script bytes in Lighthouse's network log (PERF.md) |
| Stream the slow part behind `<Suspense>` (Days 37–38) | `streaming.md`: keep the LCP element outside Suspense boundaries; React may use a boundary even when you did not expect it | The boundary came out of `/menu` (PERF.md, Day 45) |
| The production checklist as the rubric | Its Security line is the sheet's in other words: "verify authentication and authorization inside each action. Do not rely on Proxy or layout or page level checks alone" | Exactly what AUTH.md's table shows |
| Attack 3 is `/signin?next=…`, landing on `/` | — (an app choice) | The route is `/login` and the safe default is `/menu`; either way the person stays on this site |
| The 120 kB JS target | Not a framework number; React DOM + the Next.js 16 runtime are ~130 KiB before any app code | Recorded as a miss, with the breakdown |

## Deviations, honestly

- **Not deployed**, so "deployed URL", "Lighthouse on the deployed build" and
  "a shared link from the deployed URL" are open. The checklist above is
  ready for it.
- **The JSON-file store will not write on Vercel** (above). The signed-in
  half of the demo needs a local production build or a host with a disk
  until Module 4's database.
- **First Load JS: 173 KiB against 120 kB.** Missed; the framework floor is
  above the target (PERF.md).
- **`/` LCP sits on the 2.5 s line** (2.48 s before, 2.56 s after, the same
  code, bimodal runs). Not improved today.
- **No skeleton on `/menu` in `npm run dev`** any more: the price of the LCP
  fix. Production visitors never saw it.
- **Measured on this machine, not on Vercel's network.**

## What changed from Day 44

| File | Change |
| --- | --- |
| `app/menu/page.js` | The dishes are no longer wrapped in `<Suspense>`; the comment says why, with the numbers |
| `app/menu/loading.js`, `app/menu/DishSkeleton.jsx` | Deleted: either boundary alone kept the streamed HTML |
| `app/menu/[id]/page.js`, `lib/menu.js` | Comments only (what covers the 900 ms wait now) |
| `PROJECT.md` | New: the three decision tables |
| `AUTH.md`, `DATA.md`, `PERF.md` | Day 45 sections: layers per route and action, the attack run, the five data rows, the budget |
| `STRATEGY.md`, `BOUNDARY.md` | The removed boundary |
| `README.md` | This file: Day 45, and deploying to Vercel |
