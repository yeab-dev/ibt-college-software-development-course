# Deploying Addis Eats to Vercel: the runbook

Day 48, exercises 5–7. Exercise 5 (the local build and the pre-flight
checklist) is done and its results are below. Exercises 6 and 7 (deploying
and checking the live URL) are **not done**: deploying needs your Vercel
account, so it is your step. This file is the exact procedure, written so it
can be followed without looking anything up, including the part that will
not work and why.

## 0 · Read this first: what will not work on Vercel

Addis Eats keeps accounts, sessions and orders as JSON files in `.data/`
(`lib/jsonStore.js`, `lib/orders.js`). Vercel runs the server as functions
on a **read-only filesystem**: only `/tmp` is writable, it belongs to one
instance, and it is emptied when that instance is recycled. Nothing in the
data layer was changed for this; the fix is a hosted database (Module 4).
So, on a Vercel URL, as the code stands:

| Works | Fails with a `500` |
| --- | --- |
| `/`, `/menu`, every dish page, the search, the cart (it lives in the browser) | **Signing in** (the first read copies the accounts seed into `.data/`) |
| `/sitemap.xml`, `/robots.txt`, every preview image | **Signing up**, **placing an order**, **cancelling or refusing** one — every write |
| The proxy's `307`s: `/checkout`, `/orders`, `/orders/[id]`, `/kitchen`, `/dashboard` → `/login?next=…` | Therefore everything behind a sign-in: the receipt, the tracking map and stream, the kitchen board, the dashboard, the CSV |
| Every API handler's `401` without a session | The Day 48 idempotency key (it lives in the order file) |

What that means for the checks: the **signed-out, discovery, preview-card,
performance and "protection holds at the door"** checks can all be done on
the live URL. The **signed-in walkthrough, the three Day 45 attacks, the
keyboard order and the double-tap test** cannot; show them on `npm run build
&& npm run start` (ACCESSIBILITY.md and AUTH.md have the results). Say this
in the README next to the URL rather than letting someone discover it.

Two smaller serverless notes, unchanged from Day 47: the order stream is a
function that stays open (it exports `maxDuration = 300` and closes itself
at 270 s; check your plan's limit), and the map's tiles come from
OpenStreetMap's public server, which is for light use.

## 1 · Pre-flight, done locally (exercise 5)

Run from `M03-react-nextjs/day48/addis-eats`:

```bash
npm run lint && npm run build
```

Results on this machine (Linux, Node 24.19, Next.js 16.4.2):

| Check | How | Result |
| --- | --- | --- |
| The build succeeds | `npm run build` | Passes. Lint clean |
| The route table is what we expect | read it | `○` `/`, `/cart`, `/_not-found`, `/robots.txt`, `/opengraph-image`; `○ 1h` `/menu`, `/menu/opengraph-image`, `/sitemap.xml`; `●` 13 dish pages (+ their images and `/api/dishes/[id]`), 1 h; `ƒ` `/checkout`, `/login`, `/signup`, `/orders`, `/orders/[id]`, `/kitchen`, `/dashboard` and every `/api/orders…` handler. Every page kept its Day 47 marker (STRATEGY.md) — nothing became dynamic by accident |
| Every variable is listed | every `process.env.X` in the code vs `.env.example` | The code reads `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ANALYTICS_SRC`, `ADDIS_EATS_DEMO_STATES` (and `NODE_ENV`, set by Next.js). All four are in `.env.example`. There is no `DATABASE_URL` and no payment key: the app has neither |
| No secret is public | `grep -r NEXT_PUBLIC` | Only the site's URL and the analytics script's URL, both public on purpose (they are in every page's HTML). The value of `SESSION_SECRET` is in **0** files under `.next/static` (and 0 anywhere in `.next`: it is read at run time) |
| `metadataBase` is production | `app/layout.js` → `lib/site.js` | `new URL(process.env.NEXT_PUBLIC_SITE_URL \|\| "http://localhost:3000")`. Locally it is localhost; **on Vercel it is only right if the variable is set before the build** (§3) |
| Remote image hosts allowed | `next.config.mjs` | No `images` config, and none needed: every photo is in `public/dishes/`. The map tiles are drawn by Leaflet as plain `<img>`, not `next/image` |
| Case-sensitive imports | the build itself | This machine's filesystem is case-sensitive like Vercel's, so a clean build here proves every import's spelling |
| No relative `fetch` on the server | `grep -rn "fetch(" app components lib` | One, in `lib/fetcher.js`, which only SWR calls, in the browser. Server components call `lib/` directly |

To repeat the secret check yourself:

```bash
SECRET=$(grep '^SESSION_SECRET=' .env.local | cut -d= -f2-)
grep -rlF -- "$SECRET" .next/static | wc -l     # must print 0
```

## 2 · The Vercel project (once)

The repository holds the whole course, so the one setting people get wrong
here is the root directory.

1. Push the repository to GitHub (it is already a git repository; push
   `main`).
2. vercel.com → **Add New… → Project** → import the repository.
3. On the configuration screen, before the first deploy:

| Setting | Value |
| --- | --- |
| **Root Directory** | `M03-react-nextjs/day48/addis-eats` (Edit → choose the folder). Without it Vercel looks for an app at the repository root and fails |
| Framework Preset | Next.js (detected from `package.json` once the root is right) |
| Build Command | default (`next build`, from `npm run build`) |
| Install Command | default (`npm install`; the folder has its `package-lock.json`) |
| Output Directory | default (leave empty; Next.js) |
| Node.js Version | Settings → Build and Deployment → **24.x**, the version this was built and tested with |
| Environment Variables | §3, **before** pressing Deploy |

4. Production branch: `main` (Settings → Git). Every other branch, and
   every pull request, gets a Preview deployment.
5. Optional, but sensible in a repository with eight modules: Settings →
   Git → **Ignored Build Step** → custom command
   `git diff --quiet HEAD^ HEAD -- .` — it runs inside the root directory and
   skips the build when a push changed nothing in this folder.

## 3 · Environment variables, per environment

Settings → Environment Variables. Add each one separately for **Production**
and for **Preview**, with the values below. **Development** is your own
`.env.local` and is not set on Vercel.

| Variable | Production | Preview | Why |
| --- | --- | --- | --- |
| `SESSION_SECRET` | A fresh `openssl rand -base64 32`, marked **Sensitive** | A **different** fresh value, also Sensitive | Signs every session cookie (`lib/session.js`). Different values mean a cookie from a preview is never valid in production. Server only: no prefix, so it never reaches the browser. Changing it later signs everyone out |
| `NEXT_PUBLIC_SITE_URL` | The production URL, no trailing slash, e.g. `https://addis-eats.vercel.app` (your project's own, or your domain) | The production URL as well, so canonical links and the sitemap always name the real site. To check one branch's share cards on its own URL, add a Preview value **scoped to that branch** with the branch's stable URL, `https://<project>-git-<branch>-<team>.vercel.app` | Read **by the build**: it is written into the prerendered pages, `sitemap.xml`, `robots.txt`, every `og:image` and `metadataBase`. Changing it needs a **redeploy**, not a restart |
| `NEXT_PUBLIC_ANALYTICS_SRC` | Empty (do not add it) | Empty | No third-party script ships unless you add one |
| `ADDIS_EATS_DEMO_STATES` | **Unset** | Unset (or `1` if you want `?state=loading\|empty\|error` on previews for a demo) | Lets the URL force the dashboard's states; never in production |

The same with the CLI, if you prefer it (each command asks for the value;
the third argument of the scoped one is the branch):

```bash
vercel link                                   # once, inside M03-react-nextjs/day48/addis-eats
openssl rand -base64 32 | vercel env add SESSION_SECRET production
openssl rand -base64 32 | vercel env add SESSION_SECRET preview
vercel env add NEXT_PUBLIC_SITE_URL production    # type https://addis-eats.vercel.app
vercel env add NEXT_PUBLIC_SITE_URL preview       # the same production URL
vercel env ls                                     # check: two SESSION_SECRETs, two SITE_URLs
```

(`vercel link` writes `.vercel/`, which `.gitignore` already ignores. Mark the
two secrets *Sensitive* in the dashboard afterwards if the CLI did not ask.)

The trap the sheet warns about: nothing tells you a variable is missing.
Without `SESSION_SECRET` the build succeeds and the first request that
reads a session fails; without `NEXT_PUBLIC_SITE_URL` the build succeeds and
every share card points at `localhost`. If you add or change a variable
after a deployment, **redeploy** (Deployments → ⋯ → Redeploy).

## 4 · Deploy

Press **Deploy** on the import screen (or push to `main`). Then put the
production URL at the top of the README, with the §0 sentence about what
needs `npm run start`.

## 5 · After it is live: the checks (exercise 7)

Run these against the production URL and then against a preview URL.

```bash
URL=https://addis-eats.vercel.app        # your production URL, no trailing slash

# It works signed out: the public pages answer 200
for p in / /menu /menu/kitfo /cart /login /signup /sitemap.xml /robots.txt; do
  printf '%-14s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$URL$p")"
done                                                     # all 200

# Protection holds at the door (the proxy and the handlers)
curl -sI "$URL/checkout"  | grep -i '^location'          # /login?next=%2Fcheckout
curl -sI "$URL/dashboard" | grep -i '^location'          # /login?next=%2Fdashboard
curl -s -o /dev/null -w '%{http_code}\n' "$URL/api/orders/1001"          # 401
curl -s -o /dev/null -w '%{http_code}\n' "$URL/api/orders/1001/stream"   # 401
curl -s -o /dev/null -w '%{http_code}\n' "$URL/api/orders/export"        # 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' \
  -d '{}' "$URL/api/orders"                                               # 401

# Attack 1 at the door: a forged session cookie is refused
curl -s -o /dev/null -w '%{http_code}\n' -H 'Cookie: addis-eats-session=forged.value' \
  "$URL/api/orders/1001"                                                  # 401

# Attack 3: a sign-in link that points away is not followed (the page keeps next on this site)
curl -s "$URL/login?next=https://evil.example" | grep -o 'name="next" value="[^"]*"'   # value="/menu" (the default), not the other site

# Previews render: absolute og:image on the production host, and the image itself
curl -s "$URL/menu/kitfo" | grep -o '<meta property="og:image" content="[^"]*"'
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "$URL/menu/kitfo/opengraph-image"   # 200 image/png

# Discovery: real routes, no private ones, the right host
curl -s "$URL/sitemap.xml" | grep -o '<loc>[^<]*' | head -3     # https://addis-eats.vercel.app/...
curl -s "$URL/sitemap.xml" | grep -cE 'checkout|orders|kitchen|dashboard'   # 0
curl -s "$URL/robots.txt"                                        # Disallow /cart … /api/; Sitemap: $URL/sitemap.xml

# No secret in the JavaScript the browser downloads: fetch every script a page references
for js in $(curl -s "$URL/menu" | grep -oE '/_next/static/[^"]+\.js' | sort -u); do
  curl -s "$URL$js"; done | grep -c 'SESSION_SECRET'             # 0

# A preview must not be indexed: check the header Vercel sends on preview URLs
curl -sI https://<a-preview-url>.vercel.app/ | grep -i 'x-robots-tag'   # expect noindex
```

Then by hand, in a **private window** (it has no session, no cache and no
service worker, which is the point):

1. Open the URL. `/`, `/menu`, a dish and the cart work; *Add* puts dishes
   in the basket; the badge counts them.
2. Press Tab once: *Skip to content* appears top-left. Do the keyboard pass
   on the public pages (ACCESSIBILITY.md §3) — every stop ringed.
3. Click *Checkout*: you land on `/login?next=%2Fcheckout`. Try signing in
   as Almaz (`0911223344` / `almaz1234`): **expect an error page** (§0). That
   is the storage limit, not a deployment fault; note it, do not debug it
   on production.
4. Paste a dish URL into a chat app (or the opengraph.xyz / LinkedIn Post
   Inspector previewers): a card with the dish's image and price.
5. Lighthouse in that private window (DevTools → Lighthouse → Mobile) on
   `/menu`: compare with PERF.md's local numbers (LCP 2.29 s, score 98).
   A preview is a production build on production infrastructure, so a
   preview URL is the right place for these numbers too.
6. Open it on an actual phone: no sideways scroll, every button easy to hit
   (ACCESSIBILITY.md §5).

## 6 · When it goes wrong

| Problem | First move |
| --- | --- |
| The build fails | Read the build log from the **first** error. Reproduce with `npm run build` locally — it is the same build |
| `No Next.js version detected` / it builds the wrong thing | Root Directory is not `M03-react-nextjs/day48/addis-eats` |
| Built, but pages error | Project → **Logs** (runtime logs), or `vercel logs <deployment-url>`. Sign-in and order errors are §0 |
| Share cards point at `localhost` | `NEXT_PUBLIC_SITE_URL` missing in that environment: add it, then **redeploy** |
| Works on the preview, not in production | Compare the two environments' variables (`vercel env ls`) |
| A bad deployment is live | **Roll back first**, find the cause after |

**Rolling back.** Every deployment stays addressable, so this takes
seconds and rebuilds nothing:

- Dashboard: Project → **Deployments** → the last good production
  deployment → ⋯ → **Instant Rollback** (or from the project overview's
  production deployment card).
- CLI: `vercel rollback` (to the previous production deployment) or
  `vercel rollback <deployment-url>`; `vercel ls` lists them.

After a rollback Vercel stops pointing the production domain at new
deployments, so the next push to `main` builds but does **not** go live on
its own. When the fix is in, put production back on the newest deployment
with `vercel promote <fixed-deployment-url>` (or **Promote** in the
dashboard). Check the dashboard for which earlier deployments your plan
lets you roll back to.

## Where the material and the platform disagree

| The course says | What is actually the case | What was done |
| --- | --- | --- |
| Route table `○ static  ƒ dynamic  ^ ISR` (the deck: `△ ISR`) | Next.js 16.4 prints `○` Static, `●` SSG (`generateStaticParams`) and `ƒ` Dynamic, with **Revalidate** and **Expire** columns; there is no ISR symbol. A revalidating page is `○` or `●` with `1h` in the column | Read the table by its columns (§1) |
| Step 1–4: push, import, add variables, deploy | Right, plus one step the sheet does not need for a one-app repository: **Root Directory**, because this repository holds the whole course | §2 |
| `NEXT_PUBLIC_SITE_URL` in Preview = "the preview URL" | Each preview deployment has its own URL, unknown until it is built, and a `NEXT_PUBLIC_` value is fixed at build time (the installed `environment-variables.md`: "frozen with the value evaluated at build time") | Production URL for all previews; a branch-scoped value with the branch's stable URL when a branch's own cards need checking |
| `DATABASE_URL`, payment keys per environment | This app has neither; its storage is the `.data/` files, which a Vercel function cannot write | §0 |
| After it is live: "Protection holds — the three Day 45 attacks, all refused" | Two of the three need a signed-in session (attack 2 needs two), and signing in cannot work on Vercel with this store | The door-level versions above (forged cookie, off-site `next`); the full three on `npm run start` (AUTH.md) |
| "A NEXT_PUBLIC variable … requires a redeploy, not a restart" | Agrees with the installed docs; on Vercel there is no restart at all, only a redeploy | — |
| Lighthouse "throttled", on the live URL | The installed production checklist adds: run it in an incognito window, and treat it as a simulation next to field data | Private window in §5 |
