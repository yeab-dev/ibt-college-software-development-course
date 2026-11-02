# Addis Eats — Day 43: optimisation and environment

Week 9. Yesterday Addis Eats became correct and secure. Today it becomes fast,
and every claim about speed comes with a number from a production build on a
throttled phone, never from the dev server.

There was a catch at the start: Day 42's app had no images, no web font and no
third-party script, so its Lighthouse score was already 100. Exercises 2–5 had
nothing to convert. So Day 43 first gave the menu real dish photographs and a
heading font, added the ordinary way (`<img>` tags and Google's `<link>`
snippet), measured that, and then did the exercises against it.

- [PERF.md](PERF.md) is the required document: the before and after numbers
  for three pages, what each change did, and what is still slow and why.
- [STRATEGY.md](STRATEGY.md), [BOUNDARY.md](BOUNDARY.md) and [DATA.md](DATA.md)
  are updated where today touched them. [AUTH.md](AUTH.md) is unchanged:
  nothing about sessions or protection moved.

## Run it

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET: openssl rand -base64 32
npm run build
npm run start                # http://localhost:3000
npm run dev                  # for working on it, never for measuring
npm run lint
```

To measure, as PERF.md did (on a production build, with Lighthouse's default
mobile throttling):

```bash
npm run build && npm run start -- -p 3043
npx lighthouse http://localhost:3043/menu --chrome-path=/usr/bin/chromium \
  --chrome-flags="--headless=new" --only-categories=performance --view
```

`.data/` is gitignored and holds the runtime data, as on Day 42. The demo
accounts are in [AUTH.md](AUTH.md#demo-accounts).

## The headline

Lighthouse mobile (Slow 4G, 4× CPU), production build, median LCP:

| Page | Before (`<img>` + font `<link>`) | After | Score before → after |
| --- | --- | --- | --- |
| `/` | 6.67 s | 2.43 s | 72 → 96–99 |
| `/menu` | 6.20 s | 3.36 s | 70 → 91–98 |
| `/menu/doro-wat` | 3.33 s | 1.94 s | 89 → 99–100 |

The page weight of `/` dropped from 1642 KiB to 332 KiB. `next/image` did most
of it. CLS was 0 throughout, and PERF.md explains why the lab could not show a
jump even before the fix.

## The seven exercises, and where each landed

| # | Exercise | Where |
| --- | --- | --- |
| 1 | Lighthouse on a production build, throttled: LCP, CLS, INP | [PERF.md](PERF.md#the-starting-point-honestly). Day 42 as it was, then the `<img>` + font `<link>` version. INP cannot be measured in a navigation run (nothing is tapped), so **TBT** is recorded as its lab stand-in, and PERF.md says so |
| 2 | Every `img` → `Image`, real dimensions, honest `sizes` | [app/menu/Dish.jsx](app/menu/Dish.jsx) (cards), [components/CreditedPhoto.jsx](components/CreditedPhoto.jsx) (home platter and dish page). `width={1200} height={800}` are the files' real pixels; each `sizes` is worked out from the CSS grid, with the arithmetic in PERF.md; the alt text describes each photograph. no JSX `<img>` element remains |
| 3 | `priority` on the one largest above-the-fold image | `preload` (Next.js 16's name; `priority` is deprecated) on the platter in [app/page.js](app/page.js) and the dish photo in [app/menu/\[id\]/page.js](app/menu/[id]/page.js). On `/menu`, the first card uses `loading="eager"` + `fetchPriority="high"` instead, as the installed docs advise ([app/menu/DishList.jsx](app/menu/DishList.jsx)). One image per page, checked in the HTML |
| 4 | `next/font` replaces the font link; CLS | [app/layout.js](app/layout.js): Fraunces from `next/font/google`, exposed as `--font-heading`. The Google `<link>` is gone; FCP on `/` 1.77 s → 0.76 s. CLS stayed 0 (PERF.md explains) |
| 5 | Third-party scripts through `next/script`, lazily | There were none, and none was invented. [components/Analytics.jsx](components/Analytics.jsx) is the slot: a `lazyOnload` `<Script>`, only when `NEXT_PUBLIC_ANALYTICS_SRC` is set. Off by default; checked once with a test URL (requested after the load event) |
| 6 | `.env.example`, `.env*.local` gitignored | [.env.example](.env.example) lists both variables with dummy values and which side each lives on. `.gitignore` ignores every `.env*` except the example (stricter than `.env*.local`); `git check-ignore` confirms `.env.local`, `.env.production.local` and `.env` are ignored and `.env.example` is not |
| 7 | Re-run Lighthouse, record each change's effect | [PERF.md](PERF.md#each-change-and-what-it-did): one row per change, three pages, with the cause of each |

The mini-project's requirements:

| Requirement | Where |
| --- | --- |
| A Lighthouse run on a production build, before any change | PERF.md: Day 42 unchanged, and the `<img>` + `<link>` "before" |
| Every image through `next/image` with width, height, `sizes` and meaningful alt | 11 dish photos + the platter, all from [data/photos.json](data/photos.json) via [lib/photos.js](lib/photos.js) |
| Priority on exactly one image, remote hosts listed, `next/font` replacing any link tag | One per page (above). **No remote hosts**: the photos are local files in `public/dishes/`, so `remotePatterns` stays empty, and `next/image` refuses any other host |
| Third-party scripts on an appropriate strategy | `lazyOnload`, in the one slot there is |
| `.env.example` committed, `.env*.local` ignored, no secret with `NEXT_PUBLIC_` | `SESSION_SECRET` has no prefix and its value is not in `.next/static` (grep). The one `NEXT_PUBLIC_` variable is a public script URL |
| `PERF.md` with before and after numbers and their causes | [PERF.md](PERF.md) |

## Decisions

**Real photographs, credited.** Eleven dishes and one platter from Wikimedia
Commons (CC BY, CC BY-SA, public domain), cropped to 3:2 and saved at
1200 × 800, 36–286 KB each. That is the sheet's "upload at roughly display
size": `next/image` resizes from the file, so the file is the ceiling, not
what is sent. The licences ask for credit, so the dish page and the home page
print it under the photo, with a link to the original. **Ambo water and kolo
cake have no photo**: Commons has no free one of either, and a stock picture of
some other cake would be a picture of the wrong thing. Their cards start with
the name.

**Photos in their own file, not in the menu.** `data/photos.json` holds paths,
dimensions, alt text and credits. `data/menu.json` is what
`GET /api/dishes` returns to the search; putting presentation data there would
send it with every search result. Only server components read the photos.

**Local files, so no `remotePatterns`.** The sheet's example lists a CDN host.
These photos are in `public/`, so there is no remote host to allow, and an
empty list means `/_next/image` refuses to resize anyone else's image.

**`preload`, not `priority`, and not everywhere.** Next.js 16 deprecated
`priority` in favour of `preload`. In the installed version `preload` adds a
`<link rel="preload">` in the `<head>` and turns lazy loading off. It does not
set `fetchpriority`. The docs also say not to use it when several images could
be the LCP element depending on the viewport, and to prefer `loading="eager"`
or `fetchPriority="high"` "in most cases". So the hero-shaped images (the
platter, the dish photo) use `preload`, and `/menu`'s first card, one of a row
of three on a desktop, uses the two attributes. Seven runs of each on `/menu`
could not tell them apart.

**A heading font at all.** The honest baseline is Day 42's system font, which
costs nothing. Fraunces costs 36 KiB on a first visit, for headings only. It
is there because the mini-project asks for a self-hosted font, and it shows
the difference between the two ways of loading one: the same 36 KiB through
Google's `<link>` delayed the first paint by a second.

**No `fallback` option on the font.** With `fallback: ["Georgia", "serif"]`,
this build silently stopped generating the metric-adjusted fallback face, the
thing that keeps the swap from moving text. Without the option, `next/font`
emits `Fraunces Fallback` (local Times New Roman, `size-adjust: 115.45%`).
Checked in the built CSS.

**`NEXT_PUBLIC_` on the analytics URL, on purpose.** It is a public URL that
ends up in the HTML anyway. The prefix makes Next.js inline it at build time
on both sides, so static and dynamic pages agree. A plain variable would have
been read at build time by the static pages and at request time by the
dynamic ones. Changing it means a rebuild; `.env.example` says so.

**`.gitignore` stays stricter than the sheet.** The sheet commits `.env`,
`.env.development` and `.env.production` as shared defaults and ignores
`.env*.local`. Day 39's rule ignores every `.env*` except `.env.example`.
Addis Eats has no shared non-secret defaults to commit, and the stricter rule
means a secret cannot be committed by putting it in the wrong file. If shared
defaults are ever needed, add a `!.env.production` line.

**The `/menu` reveal is recorded, not fixed.** PERF.md's "What is left": the
prerendered menu still ships the dishes in React's streaming form (skeleton,
hidden `div`, a throttled `$RC` swap), because the build-time render suspended
on `getMenu()`'s 900 ms teaching delay. That is now the largest cost on
`/menu`. Removing the `<Suspense>` did not help, because `loading.js` is a
boundary too. Fixing it means changing the data layer that Days 37–38 built,
so it is written down for that change rather than done in passing.

## Check yourself

| Question | Answer |
| --- | --- |
| Did LCP improve, and which single change did most of it? | `/` 6.67 → 2.43 s. `next/image` alone took it to 3.25 s: right-sized WebP (286 → 87 KB for the platter), and no more downloading every photo on every page |
| Does the page still jump as it loads? | No: CLS 0. Each `<img>` has `width`/`height`, and the font has a metric-matched fallback face |
| Are you measuring `npm run start`, throttled, not `npm run dev`? | Yes: port 3043, Lighthouse mobile, Slow 4G and 4× CPU |
| Can a stranger clone the repo and know which variables to set? | Yes: `.env.example`, with what each variable does and which side it lives on |
| Is there anything in the browser bundle you would not want published? | No. `grep` for the secret's value in `.next/static` finds nothing |

## Verified

| Check | Result |
| --- | --- |
| `npm run build` | Passes; the route table is Day 42's, unchanged (images, fonts and a script do not change when a route renders) |
| `npm run lint` | No warnings, no errors |
| Raw `<img>` in the source | None. Every photo is `next/image` |
| Image preloads in the HTML | Exactly one on `/`, `/menu` and `/menu/doro-wat`; `/menu`'s other ten cards are `loading="lazy"` |
| Font requests | Only to the app's own origin; none to `fonts.googleapis.com` or `fonts.gstatic.com` |
| Analytics slot, unset | Renders nothing |
| Analytics slot, set to a test URL | No `<script>` in the HTML; Chromium requests it after the load event |
| `SESSION_SECRET` in `.next/static` | Not found |
| `git check-ignore` | `.env.local`, `.env.production.local`, `.env`, `.data/` ignored; `.env.example` not |

## Deviations, honestly

- **The "before" was built today.** Day 42 had nothing to optimise. The
  `<img>` + `<link>` version was written, measured and replaced; PERF.md shows
  Day 42's own numbers too.
- **TBT instead of INP.** A navigation run cannot measure INP. Said in PERF.md.
- **CLS never moved.** On `localhost` the image sizes and the font arrived
  before the first paint, so even the unreserved version did not jump. The fix
  is in place anyway and visible in the HTML.
- **`preload`, not `priority`**, and `fetchPriority` on `/menu`. The course is
  written for Next.js 15; Next.js 16 deprecated `priority`.
- **No third-party script exists**, so exercise 5 is a slot, off by default.
- **Two dishes without photos.** No free photograph of the real thing.
- **`/menu` is still the slowest page**, for a reason that has nothing to do
  with images (see Decisions).

## What changed from Day 42

| File | Change |
| --- | --- |
| `public/dishes/*.jpg` | New: 11 dish photos and the platter, 1200 × 800, 1.5 MB together |
| `data/photos.json`, `lib/photos.js` | New: path, real dimensions, alt text and credit per photo |
| `components/CreditedPhoto.jsx` | New: `next/image` with its credit, used by `/` and `/menu/[id]` |
| `components/Analytics.jsx` | New: the `lazyOnload` `next/script` slot, off unless configured |
| `app/menu/Dish.jsx` | The card photo through `next/image`, with the worked-out `sizes`; eager and high priority only for the first card |
| `app/menu/DishList.jsx` | Marks the first card as the LCP candidate |
| `app/menu/[id]/page.js` | The dish photo, `preload`ed, with its credit |
| `app/page.js` | The platter, `preload`ed, with its credit |
| `app/layout.js` | Fraunces through `next/font/google`; renders `<Analytics />` |
| `app/globals.css` | `--heading` uses the font variable; photo and credit styles |
| `.env.example` | Rewritten: every variable, which side it lives on, and the optional `NEXT_PUBLIC_ANALYTICS_SRC` |
| `PERF.md` | New: the required measurements |
| `STRATEGY.md`, `BOUNDARY.md`, `DATA.md` | The `/menu` reveal correction; the new server components and client leaves; why photos stay out of the API |
