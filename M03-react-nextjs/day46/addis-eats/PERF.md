# Making Addis Eats fast — measured

The mini-project's deliverable: the numbers before and after, and what caused
each change. Every number here comes from a production build
(`npm run build && npm run start`), never from `npm run dev`.

## Day 45: the performance budget

The project sheet's third decision table, with both columns filled. Same
method as Day 43 (below): Lighthouse 13.6.0, default mobile settings (Slow 4G,
4× CPU, simulated), headless Chromium, production build on port 3045, one
warm-up request per page, medians with the range in brackets.

- **Before** is the Day 45 baseline: the Day 44 code, unchanged, measured
  after every feature was in (the sheet's "take the baseline at step five").
  Five runs per page.
- **After** is the shipped Day 45 code, after one change (below). Five runs on
  `/` and the dish page, fifteen on `/menu`.
- **Week 9 start** is Day 43's "before" (plain `<img>`, Google's font link),
  kept for the week's story: the image and font work was done on Day 43.

| Measure | Target | Week 9 start (Day 43) | **Before** (Day 45 baseline) | **After** (Day 45) | Met? |
| --- | --- | --- | --- | --- | --- |
| LCP, throttled, `/menu` | under 2.5 s | 6.20 s | **3.26 s** (2.26–3.50) | **2.29 s** (2.01–3.06) | Yes, median. 2 of 15 runs above 2.5 s |
| LCP, throttled, `/` | under 2.5 s | 6.67 s | 2.48 s (1.89–2.61) | 2.56 s (1.89–2.71) | On the line: same code both times, see below |
| LCP, throttled, `/menu/doro-wat` | under 2.5 s | 3.33 s | 1.93 s (1.93–2.38) | 1.96 s (1.93–2.55) | Yes |
| CLS (all three pages) | under 0.1 | 0 | 0 | 0 | Yes |
| First Load JS, `/menu` | under 120 kB | ~154 KiB | 173.3 KiB (177 kB) | 173.3 KiB (177 kB) | **No** — see below |
| Largest image | under 150 kB | 286 KB (the platter, JPEG; 1415 KiB of photos on every page) | 86.8 KiB (the platter, 640w WebP, on `/`); 51.2 KiB on `/menu` | the same | Yes |
| Lighthouse performance, `/menu` | 90 or better | 70 | 91 (90–99) | **98** (94–99) | Yes |
| Lighthouse performance, `/` | 90 or better | 72 | 98 (97–100) | 97 (96–100) | Yes |
| Lighthouse performance, `/menu/doro-wat` | 90 or better | 89 | 99 (98–100) | 99 (97–99) | Yes |

### The one change: `/menu`'s cards out of the Suspense boundary

**`/menu` LCP 3.26 s → 2.29 s, score 91 → 98.** This was the item Day 43
left open ("What is left", below): the prerendered dishes were written in
React's streaming form — skeleton first, cards in `<div hidden id="S:0">`,
an inline `$RC("B:0","S:0")` to swap them — so the first card's photo was
painted late, after React's batched reveal.

What was tried, in order, each checked by grepping the built
`.next/server/app/menu.html` for `$RC(`:

| Attempt | `$RC` in the HTML? |
| --- | --- |
| The 900 ms teaching delay only in `npm run dev` | Yes — still streamed |
| No delay at all, and a synchronous file read | Yes — an async server component suspends anyway |
| Remove `<Suspense>` from `app/menu/page.js`, keep `loading.js` | Yes |
| Remove `loading.js`, keep `<Suspense>` | Yes |
| **Remove both** | **No** — the cards are plain HTML in the first response |

So the data layer is untouched (`lib/menu.js` is Day 44's file, delay
included; the build pays it) and the change is two files: the `<Suspense>`
wrapper in [app/menu/page.js](app/menu/page.js) and `app/menu/loading.js`
(with `DishSkeleton.jsx`, now unused) are gone. The installed docs give the
same rule (`node_modules/next/dist/docs/01-app/02-guides/streaming.md`,
"LCP": *keep LCP elements outside or above Suspense boundaries*; *if there's
a Suspense boundary, React might use it*). The route is still `○` 1h. What it
cost: in `npm run dev`, which renders every request, a visit to `/menu` now
waits out the 900 ms on the previous page instead of showing the skeleton.
Visitors to the production build never saw that skeleton.

`/menu` is still slightly bimodal (2 of 15 runs at 2.97 and 3.06 s), but the
cluster that used to hold three of five runs is now the exception.

### The numbers that did not come down, and why

- **First Load JS, `/menu`: 173 KiB against a 120 kB target. Missed.** Next.js
  16 no longer prints "First Load JS" in `next build` (its upgrade guide says
  the number was inaccurate with Server Components and points to Lighthouse),
  so this is the compressed size of every script `/menu` downloads, from
  Lighthouse's network log. Every page downloads the same 173 KiB, because
  the root layout's client pieces (cart badge, cart store) and the Next.js
  runtime are shared. Split by chunk:

  | Chunk content | KiB (transferred) |
  | --- | --- |
  | React DOM | 72.0 |
  | The Next.js app router and client runtime | 44.5 + 8.8 |
  | Turbopack's module runtime | 4.7 |
  | **Framework floor, before a line of Addis Eats** | **~130** |
  | The cart store (zustand) and badge | 7.4 |
  | `next/image` client code (two chunks) | 12.0 |
  | The menu's filter shell and search box | 7.7 |
  | SWR | 5.9 |
  | Seven small chunks (layouts, page entries, the `next/script` slot) | ~10 |

  The framework alone is above the target, so 120 kB is not reachable on
  Next.js 16.4 + React 19.3 by trimming application code; the course's
  target dates from builds that counted differently. Lighthouse's own
  "unused JavaScript" audit finds 27 KiB, all of it inside the React DOM
  chunk. What *is* in our hands is small: `next/image` (~12 KiB) bought
  1.3 MB of image savings on Day 43, and SWR and zustand are the two client
  features the sheet asks for. Recorded as a documented miss.
- **`/` LCP, 2.48 s → 2.56 s.** Nothing on `/` changed today; the difference
  is the simulator. `/` is bimodal too (1.89–1.93 s or 2.41–2.71 s, five runs
  each time, the same two clusters on Day 43). It is on the target, not
  comfortably under it. Its LCP element is the 87 KiB platter, already
  preloaded and right-sized; the next step would be a smaller hero (a lower
  `quality` or a narrower `sizes`), which would trade picture quality for
  ~0.1–0.3 s and was not done.
- **INP** is not in a Lighthouse navigation run (below); TBT is its lab
  stand-in and stayed at 50–90 ms on every page.

### Still to do on the deployment

The sheet asks for Lighthouse "on the deployed build". These numbers are from
`next start` on this machine, because there is no deployment yet (README,
"Deploying to Vercel"). After deploying, run the same command against the
production URL and add a column; a CDN in front should lower TTFB, and the
simulator's numbers should otherwise be close.

## How it was measured

- **Lighthouse 13.6.0**, command line, headless Chromium, performance only:

  ```bash
  npx lighthouse http://localhost:3043/menu --chrome-path=/usr/bin/chromium \
    --chrome-flags="--headless=new" --output=json --only-categories=performance
  ```

- **Default mobile settings**, which are the reading sheet's "Slow 4G and 4×
  CPU": a 412 × 823 phone at 1.75× pixels, 150 ms round trip, 1.6 Mbit/s down,
  CPU slowed 4×. Lighthouse *simulates* that throttling from an unthrottled
  load (`throttlingMethod: simulate`).
- **Three pages**: `/` (the platter), `/menu` (thirteen cards) and
  `/menu/doro-wat` (one dish). One warm-up request first, so the image
  optimiser's cache is not part of the number.
- **Medians**. Three runs per page for each step, seven or twelve for the
  final state and for the one comparison that needed it. The simulator is
  noisy, and on `/menu` it is *bimodal* (see "What is left"), so the ranges
  are printed where they matter.

### INP is not in a Lighthouse run

The sheet asks for LCP, CLS and **INP**. INP measures how fast the page
answers a tap, so it only exists when someone taps; a Lighthouse navigation
run loads the page and taps nothing. The lab stand-in is **Total Blocking
Time** (TBT): how long the main thread was blocked during load, which is what
would have delayed a tap. TBT is recorded below in INP's place. A real INP
needs real visitors (field data, e.g. Chrome's CrUX or a `web-vitals` report)
or a Lighthouse *timespan* run with recorded interactions.

## The starting point, honestly

Day 42's Addis Eats had **no images, no web font and no third-party script**.
Its Lighthouse run is close to perfect, because there was almost nothing to
load:

| Day 42, unchanged | Score | FCP | LCP | CLS | TBT | Weight | LCP element |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 100 | 0.76 s | 0.76 s | 0 | 33 ms | 186 KiB | a paragraph |
| `/menu` | 100 | 0.77 s | 0.77 s | 0 | 39 ms | 185 KiB | the first card's description |
| `/menu/doro-wat` | 100 | 0.76 s | 0.76 s | 0 | 76 ms | 177 KiB | the description |

Converting "every `img`" and "the font link tag" means nothing on a page that
has neither. So Day 43 first did what the reading sheet assumes had already
been done, **the ordinary way**: the dish photographs added as plain `<img>`
tags (no width, no height, no `sizes`), and the heading font added with
Google's own snippet (two `preconnect`s and a stylesheet `<link>` to
`fonts.googleapis.com`). That state, **step 1** below, is the "before" the
exercises are measured against. It was built and measured, then replaced. It
is not invented: it is the code a student would write from Module 2.

The photos are real: eleven dishes and one platter from Wikimedia Commons,
cropped to 3:2 and saved at 1200 × 800 (36–286 KB each, 1.5 MB together). That
is the sheet's "upload at roughly display size", not a 6000-pixel camera
original. Two dishes have no free photo (`lib/photos.js` explains).

## Before and after, per page

| `/` | Score | FCP | LCP | CLS | TBT | Weight | Images | Font from |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Day 42 (no photos) | 100 | 0.76 s | 0.76 s | 0 | 33 ms | 186 KiB | — | — |
| **Before**: `<img>` + font `<link>` | 72 | 1.76 s | **6.67 s** | 0 | 129 ms | 1642 KiB | 1415 KiB | Google |
| **After** (Day 43) | 96–99 | 0.84 s | **2.43 s** (1.89–2.64) | 0 | 26–126 ms | 332 KiB | 87 KiB | own origin |

| `/menu` | Score | FCP | LCP | CLS | TBT | Weight | Images | Font from |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Day 42 (no photos) | 100 | 0.77 s | 0.77 s | 0 | 39 ms | 185 KiB | — | — |
| **Before**: `<img>` + font `<link>` | 70 | 1.39 s | **6.20 s** | 0 | 108 ms | 1637 KiB | 1415 KiB | Google |
| **After** (Day 43) | 91–98 | 0.76 s | **3.36 s** (2.04–3.49) | 0 | 39–126 ms | 475 KiB | 233 KiB | own origin |

| `/menu/doro-wat` | Score | FCP | LCP | CLS | TBT | Weight | Images | Font from |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Day 42 (no photos) | 100 | 0.76 s | 0.76 s | 0 | 76 ms | 177 KiB | — | — |
| **Before**: `<img>` + font `<link>` | 89 | 1.65 s | **3.33 s** (3.01–6.08) | 0 | 148 ms | 1631 KiB | 1415 KiB | Google |
| **After** (Day 43) | 99–100 | 0.82 s | **1.94 s** (1.88–2.62) | 0 | 34–83 ms | 272 KiB | 37 KiB | own origin |

"After" is the shipped code, twelve runs per page (two sessions, seven and
five runs). LCP is the median, with the range in brackets.

## Each change, and what it did

Three runs per page per step, medians. Each row adds one change to the row
above it.

| Step | `/` LCP | `/menu` LCP | `/menu/doro-wat` LCP | FCP (/) | Weight (/) |
| --- | --- | --- | --- | --- | --- |
| 1. Before: `<img>` + font `<link>` | 6.67 s | 6.20 s | 3.33 s | 1.76 s | 1642 KiB |
| 2. `<img>` → `next/image`, real `width`/`height`, honest `sizes` | 3.25 s | 3.63 s | 3.22 s | 1.77 s | 331 KiB |
| 3. `preload` on the one LCP image of each page | 3.04 s | 3.54 s | 2.91 s | 1.77 s | 330 KiB |
| 4. `next/font` instead of the `<link>` | 2.71 s | 3.18 s | 1.88 s | 0.76 s | 329 KiB |
| 5. `/menu`'s first card: `fetchPriority` instead of `preload`; the `next/script` slot (off) | 2.43 s ¹ | 3.36 s ¹ | 1.94 s ¹ | 0.84 s | 332 KiB |

¹ Twelve runs; the others are three. Step 5 changed nothing measurable (see
below). The differences between steps 4 and 5 are run-to-run noise.

### Step 2: `next/image` — most of the improvement

**LCP on `/` from 6.67 s to 3.25 s, and the page from 1642 KiB to 331 KiB.**
The single change that did most of the work, as the sheet predicts. Three
causes, each visible in the network log:

1. **The right size.** The platter's file is 1200 px wide. On the 412-px phone
   its column is 362 px, so at 1.75× the browser needs about 633 px. With
   `sizes` the srcset offers a 640w version and the browser takes it.
2. **A smaller format.** `/_next/image` answered with WebP at quality 75:
   the platter went from 286 KB (JPEG) to 87 KB.
3. **Lazy loading — and the photos nobody was looking at.** This was the
   surprise. With plain `<img>`, **every page downloaded all twelve photos**,
   1415 KiB, including the home page, which shows one. They were requested at
   about 1.4 s, after hydration, when the client router prefetched the other
   routes (`/menu` among them). The most likely mechanism: a plain `<img>`
   starts downloading the moment React creates it, wherever that happens.
   `next/image` is `loading="lazy"` by default, and a lazy image outside the
   viewport is not fetched. After the change, `/` downloads only its platter
   (87 KiB), the dish page only its dish (37 KiB), and `/menu` only the
   photos within Chrome's lazy-loading distance (233 KiB for ten cards; the
   distance on a slow connection is large).

`sizes` per image, worked out from the CSS rather than guessed (the page is
1126 px wide with 24 px padding; the menu has a 200 px sidebar and a 32 px
gap above 760 px; the card grid is `minmax(260px, 1fr)` with a 16 px gap):

| Image | `sizes` |
| --- | --- |
| Menu card | `(max-width: 585px) calc(100vw - 50px), (max-width: 760px) calc(50vw - 33px), (max-width: 817px) calc(100vw - 282px), (max-width: 1093px) calc(50vw - 149px), 271px` |
| Dish page | `(max-width: 690px) calc(100vw - 50px), (min-width: 761px) and (max-width: 921px) calc(100vw - 282px), 640px` |
| Home platter | `(max-width: 690px) calc(100vw - 50px), 640px` |

The breakpoints are where the grid changes its number of columns: one column
below 586 px, two up to 760, then the sidebar appears and it is one column
again until 818, two until 1094, and three after that.

What it cost: `next/image` is a client component, and its runtime added about
16 KiB to every page's JavaScript (154 → 170 KiB). The images saved 1300 KiB.

### Step 3: `preload` — real, but small

**`/` 3.25 → 3.04 s, the dish page 3.22 → 2.91 s.** `preload` puts a
`<link rel="preload" as="image" imagesrcset=…>` in the `<head>`, so the
browser starts the photo before it has parsed down to the `<img>`, and turns
off lazy loading for that one image. Exactly one image per page has it,
checked in the HTML: one image preload on each of the three pages, and on
`/menu` ten `loading="lazy"` cards.

Small, because after step 2 the photo was no longer the slowest thing. The
first paint was: 1.77 s, held back by the font stylesheet.

### Step 4: `next/font` — the first paint, a second sooner

**FCP on `/` from 1.77 s to 0.76 s** (back to Day 42's figure), and LCP with
it: `/` 3.04 → 2.71 s, the dish page 2.91 → 1.88 s.

Google's snippet makes the browser stop rendering until a stylesheet arrives
from `fonts.googleapis.com`, which needs a DNS lookup, a connection and TLS to
a second origin, and then a third origin (`fonts.gstatic.com`) for the font
file. `next/font` downloaded Fraunces once at build time; it is served from
`/_next/static/media/` with a `<link rel="preload" as="font">`, and its
`@font-face` is part of the app's own CSS. The requests now go to one origin,
`localhost:3043`, instead of three. The font itself is the same 36 KiB either
way: the gain is in *when* the browser can paint, not in bytes. No request
reaches Google from the visitor's browser, which is the privacy half of the
sheet's argument.

The honest comparison with Day 42 is that Day 42 used the system font and paid
nothing. Fraunces costs 36 KiB on every first visit, and is the heading face
only; the body text stays on `system-ui`.

### Step 5: what was measured and changed nothing

- **`/menu`'s first card uses `loading="eager"` + `fetchPriority="high"`
  instead of `preload`.** The installed Next.js 16 docs say not to use
  `preload` when several images could be the LCP element depending on the
  viewport (the first row of cards on a desktop), and to prefer these two
  attributes "in most cases". Seven runs of each: `preload` 2.18–3.18 s,
  `fetchPriority` 2.11–3.33 s. Lighthouse cannot tell them apart, because
  `/menu`'s LCP is held back by something else (below). The choice follows
  the docs.
- **The `next/script` slot.** The application has no third-party script, so
  `components/Analytics.jsx` renders nothing unless `NEXT_PUBLIC_ANALYTICS_SRC`
  is set, and every number here was measured with it unset. Its import still
  costs about 3 KiB of loader (170 → 173 KiB of JavaScript). With the variable
  set to a test URL, the build's HTML contains no `<script>` tag for it, and
  Chromium requested it at 403 ms, after the page's load event (285 ms) and
  after LCP (220 ms) in the unthrottled run: `lazyOnload` behaves as the sheet
  describes.

## CLS: zero before and after, and why the lab could not show the difference

Every run, before and after, measured **CLS 0.000**, including one run of
each page with real (`devtools`) throttling instead of the simulation, where
the "before" photos really did arrive seconds late (`/` LCP 3.74 s, `/menu`
5.34 s).

The plain `<img>` had no width or height, so the space was not reserved — but
a JPEG states its size in its first few hundred bytes, and from `localhost`
those bytes arrived before the first paint, which was waiting for the CSS and
the font stylesheet. So the layout already knew the size when it was first
drawn. Likewise the Google font arrived before the first paint, so the swap
moved nothing on screen. On a real network, with the image on a CDN or
discovered later, the space would not be known in time, and the page would
jump. The fix is in place regardless, and is checkable in the HTML: every
`<img>` now has `width="1200" height="800"`, which the browser turns into a
3:2 aspect ratio before the file arrives, and the font has a metric-adjusted
fallback that `next/font` generates: a `Fraunces Fallback` face on the local
Times New Roman with `size-adjust: 115.45%` and ascent/descent overrides.

One trap found on the way: the first version passed `fallback: ["Georgia",
"serif"]` to `Fraunces()`. With that option this build emitted **no** adjusted
fallback face — the CSS variable became `"Fraunces", Georgia, serif`, and the
metric matching that prevents the jump was silently gone. Removing the option
brought it back (`"Fraunces", "Fraunces Fallback"`). The measurements above
were taken with the option present; since the font arrived before the first
paint in every run, it could not have changed them, but the shipped code is
the version without it. A confirming run of the shipped code (five runs per
page) agreed: LCP medians `/` 2.42 s, `/menu` 2.29 s (2.02–3.49, the same two
clusters), `/menu/doro-wat` 1.94 s; CLS 0.

## What is left: `/menu`'s photo is revealed late (fixed on Day 45, above)

`/menu`'s LCP is in two clusters, about 2.1–2.5 s and about 3.2–3.5 s, with
nothing in between. The photo is not the reason. It arrives at high priority
in about 35 ms in the unthrottled run, but in the slow runs it is *painted* at
about 420 ms, after the load event, and Lighthouse's breakdown puts the whole
difference in "element render delay".

The cause is in the HTML. `/menu` is prerendered, and the dishes are in the
file — but the Suspense boundary around them suspended while it was being
built (`getMenu()`'s 900 ms teaching delay), so React wrote it in its
streaming form: the skeleton first, the dishes in a `<div hidden id="S:0">`,
and an inline `$RC("B:0","S:0")` that swaps them in. React throttles that swap
to batch reveals (up to ~300 ms after the last paint), so the first card's
photo is painted after the skeleton, not with the page. When the swap lands
after the JavaScript has run, the simulator charges the JavaScript to LCP too:
that is the slow cluster.

Removing the `<Suspense>` from `app/menu/page.js` was tried and changed
nothing: `app/menu/loading.js` is a boundary of its own, and the HTML had the
same `$RC`. The fix is to stop the build-time render suspending — the delay in
`lib/menu.js` — and that is a data-layer decision (Days 37–38 kept it so the
skeleton can be seen in `npm run dev`), not an optimisation-day one. Recorded
here and in STRATEGY.md as the next thing to fix: it is now the largest bar
in `/menu`'s waterfall.

## Check yourself

| Question | Answer |
| --- | --- |
| Day 45: are both columns of the performance budget filled in? | Yes, [above](#day-45-the-performance-budget): before and after for all five measures, with the one miss (First Load JS) explained |
| Did LCP improve, and which single change did most of it? | Yes: `/` 6.67 → 2.43 s, `/menu` 6.20 → 3.36 s, the dish 3.33 → 1.94 s. `next/image` did most of it (6.67 → 3.25 s on `/`): right-sized WebP, and no more downloading every photo on every page |
| Does the page still jump as it loads? | No, CLS 0. Every `<img>` has width and height; the font has a metric-matched fallback. (It did not jump before either, on this network; see above) |
| Are you measuring `npm run start`, throttled? | Yes: production build on port 3043, Lighthouse's mobile Slow 4G and 4× CPU |
| Can a stranger clone the repository and know which variables to set? | Yes: `.env.example` lists both, with dummy values and what each is for |
| Is there anything in the browser bundle you would not want published? | No. `SESSION_SECRET` has no `NEXT_PUBLIC_`; its value does not appear anywhere in `.next/static` (checked with grep). The one `NEXT_PUBLIC_` variable is a script URL that is public by nature |
