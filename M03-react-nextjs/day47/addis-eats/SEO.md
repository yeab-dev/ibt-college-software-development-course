# Making Addis Eats findable: what each route exposes

Day 44's record. For every route: the title, the description, the canonical
address, whether it may be indexed, the preview picture, the structured data,
and whether it is in the sitemap. Then the decisions behind it, what was
checked in the page source, and where the course material and the installed
Next.js 16.4 docs disagree.

Everything here was checked the way the reading sheet asks, in the served
HTML of a production build (`npm run build && npm run start`), not in the
code.

## The site's address

There is no production URL yet. [lib/site.js](lib/site.js) reads it from
`NEXT_PUBLIC_SITE_URL` and falls back to `http://localhost:3000`:

```js
export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
```

It is `metadataBase` in the root layout, so every relative URL in any page's
metadata (canonical, og:url, og:image) comes out absolute. The sitemap,
robots.txt and the JSON-LD are not metadata fields, so they use
`absoluteUrl()` from the same file.

**It is read at build time.** The static pages, `/sitemap.xml` and
`/robots.txt` are written by `npm run build`, and `NEXT_PUBLIC_` values are
inlined then. So on the host the variable must be set *before* the build. A
build made without it says `localhost` in every og:image, which is the
sheet's "works locally, not live". Checked both ways:

| Build | `/menu/kitfo` canonical | og:image | robots.txt `Sitemap:` |
| --- | --- | --- | --- |
| no variable | `http://localhost:3000/menu/kitfo` | `http://localhost:3000/menu/kitfo/opengraph-image?…` | `http://localhost:3000/sitemap.xml` |
| `NEXT_PUBLIC_SITE_URL=https://addiseats.et` | `https://addiseats.et/menu/kitfo` | `https://addiseats.et/menu/kitfo/opengraph-image?…` | `https://addiseats.et/sitemap.xml` |

It is public on purpose: it is printed in every page's `<head>` anyway.
`.env.example` lists it.

## Route by route

Titles use the root layout's template, `%s · Addis Eats`. The home page sits
in the root segment itself, where the template does not apply, so it gets the
layout's default.

| Route | `<title>` | Description (abridged) | Canonical | Robots | og:image | JSON-LD | Sitemap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Addis Eats — food delivery in Addis Ababa | "Order Doro Wat, Tibs and Kitfo from one kitchen in Addis Ababa…" | `/` | indexable | `/opengraph-image` | `Restaurant` | yes, priority 1 |
| `/menu` (any query string) | Menu · Addis Eats | "Doro Wat, Kitfo, Tibs and Shiro, fasting platters, buna and tej…" | `/menu` | indexable | `/menu/opengraph-image` | — | yes, 0.8 |
| `/menu/[id]` (13) | Kitfo · Addis Eats | "Kitfo, 260 ETB. Minced raw beef folded into spiced niter kibbeh. Delivered across Addis Ababa." | `/menu/kitfo` | indexable | `/menu/kitfo/opengraph-image` | `MenuItem` + `Offer` | yes, 0.6 each |
| `/menu/<unknown>` | Dish not found · Addis Eats | — | — | `noindex` (Next.js, on the 404) | the dish card route ("Not on the menu") | — | no |
| `/cart` | Your order · Addis Eats | "The dishes in your basket, with the total in birr…" | — | `noindex, follow` | site-wide | — | no; disallowed |
| `/checkout` | Checkout · Addis Eats | "Confirm your delivery address and pay … with TeleBirr." | — | `noindex, follow` (set in its layout) | site-wide | — | no; disallowed |
| `/orders` | Your orders · Addis Eats | "Every order you have placed with Addis Eats…" | — | `noindex, follow` | site-wide | — | no; disallowed |
| `/orders/[id]` | Order receipt · Addis Eats | "Your Addis Eats order: what is in it…" | — | `noindex, follow` | site-wide | — | no; disallowed |
| `/kitchen` | Kitchen board · Addis Eats (403 for a customer: Staff only · Addis Eats) | "Every order in the queue, for Addis Eats kitchen staff." | — | `noindex, follow` (403: `noindex`) | site-wide | — | no; disallowed |
| `/login` (takes `?next=`) | Sign in · Addis Eats | "Sign in to Addis Eats with your phone number…" | `/login` | `noindex, follow` | site-wide | — | no; **not** disallowed |
| `/signup` (takes `?next=`) | Create an account · Addis Eats | "Make an Addis Eats account with your phone number…" | `/signup` | `noindex, follow` | site-wide | — | no; **not** disallowed |
| any unclaimed path | Page not found · Addis Eats | — | — | `noindex` (Next.js) | site-wide | — | no |

Every page with a title also has og:title, og:description, og:site_name
(`Addis Eats`), og:locale (`en_ET`), og:type (`website`) and the Twitter
`summary_large_image` card, whose title, description and image Next.js copies
from Open Graph. The public pages also have og:url, equal to their canonical.

### robots.txt

```
User-Agent: *
Allow: /
Disallow: /cart
Disallow: /checkout
Disallow: /orders
Disallow: /kitchen
Disallow: /api/

Sitemap: http://localhost:3000/sitemap.xml
```

### sitemap.xml

`/`, `/menu`, and the 13 dish pages, generated from `data/menu.json` by
`readMenu()`. Nothing that needs signing in, not `/cart`, not `/login` or
`/signup` (they are `noindex`, and a sitemap should only list pages meant for
results). No `lastModified`: the menu has no per-dish change date, and the
build time would be an invented one.

### The preview pictures

All 1200 × 630 PNGs from `ImageResponse`, drawn by
[components/OgCard.jsx](components/OgCard.jsx): the photo as a square on the
left (or nothing, for the two dishes without one), and on a dark panel the
section, the name, the price in ETB and the menu's sentence.

| Image | File | Rendered |
| --- | --- | --- |
| Site-wide | [app/opengraph-image.js](app/opengraph-image.js) | the platter, "Ethiopian food, delivered" — at build |
| The menu | [app/menu/opengraph-image.js](app/menu/opengraph-image.js) | tibs, "The menu", "From 30 ETB", "13 dishes…" — at build, then hourly |
| One per dish | [app/menu/\[id\]/opengraph-image.js](app/menu/[id]/opengraph-image.js) | that dish — 13 at build, then hourly |

## Decisions

**One h1 per page, and it is the page's.** Until Day 43 the header's
"Addis Eats" was an `<h1>` on every page and each page's own heading was an
`<h2>` under it, so every page's top heading said the same thing. The brand is
now styled text in a link (`.topbar__name`, the same size as before), and each
page's heading is its `<h1>`: "The menu", "Kitfo", "Your order". The home
page's became "Today at the Addis Eats kitchen". Dish cards on `/menu` stay
`<h2>`, under the page's `<h1>`. The menu sidebar's "Categories" was an `<h3>`
*before* the page's `<h1>`, a skipped level; it is an `<h2>` now, drawn
exactly as the `<h3>` was.

**A helper for public pages, because metadata merges shallowly.** A page that
sets `openGraph` at all replaces the layout's whole `openGraph`, site name and
locale included. Every public page wants its own og:url, so
`publicPage({ title, description, path })` in [lib/site.js](lib/site.js)
writes title, description, canonical and the Open Graph fields in one place.
`privatePage()` adds `robots: { index: false, follow: true }`.

**…and that merge ate `/menu`'s picture.** The first build's `/menu` had no
og:image at all, while `/` and the dish pages did. The page's `openGraph`
replaced the root's, *including* the og:image that `app/opengraph-image.js`
had merged in at the root. An image file in a page's **own** folder is merged
after the page's metadata, which is why `/` (beside `app/opengraph-image.js`)
and the dish pages (beside theirs) kept theirs. The fix is the deck's
"section OG image": `app/menu/opengraph-image.js`. The rule for the future,
written into `lib/site.js`: any page that uses `publicPage()` needs an
`opengraph-image` beside it. The private pages do not set `openGraph`, so they
inherit the site-wide card unchanged.

**A canonical on every route that takes a query string.** `/menu` (Day 41's
`?category=`, `?q=`, `?page=`) points at `/menu`; `/login` and `/signup`
(`?next=`) point at themselves without it. `/menu` does not read
`searchParams`, so it is still one static file whose canonical is the same
whatever the query string, which is the point. `/api/dishes` takes query
parameters too, but it is JSON, not a page, and it is disallowed.

**`noindex` and `Disallow` are not the same tool.** `Disallow` asks a crawler
not to *fetch* a page; `noindex` asks a search engine not to *list* it. A
crawler that obeys `Disallow` never reads the page, so it never sees the
`noindex` on it, and Google says it may still list a disallowed URL (without
a snippet) if other pages link to it. Every page here links to `/cart` and
`/checkout`. So:

- `/cart`, `/checkout`, `/orders`, `/kitchen` are **disallowed and `noindex`**,
  as the exercise asks. The signed-in ones answer a crawler with a `307` to
  `/login` anyway (proxy.js), so fetching them only spends crawl budget. The
  `noindex` is for any crawler that ignores robots.txt.
- `/login` and `/signup` are **`noindex` only**, not disallowed, so the tag can
  actually be read. Disallowing them too would have made the `noindex` dead.

If an unwanted URL ever shows up in results, the fix is to *remove* the
`Disallow` so the `noindex` is seen. robots.txt is not security either: the
session checks in [AUTH.md](AUTH.md) are what keep `/kitchen` private.

**`noindex, follow`.** A crawler that reads `/cart` may carry on to the menu
links in it; that is harmless and helps the public pages.

**JSON-LD from the same object as the page.** `menuItemJsonLd(dish, photo)`
in the dish page takes the `dish` the page renders below, so `name`,
`price` and `priceCurrency` are the same fields that print "Kitfo" and
"260 ETB". Checked on three pages (below). `image` is only there for the 11
dishes with a photograph. The home page's `Restaurant` has only what the site
shows: no address, phone or opening hours, because Addis Eats publishes none.
[components/JsonLd.jsx](components/JsonLd.jsx) escapes `<` as `<`.

**`getDish` behind React `cache()`.** `generateMetadata` and the page each
ask for the dish. Without `cache` that is two 900 ms waits and two file reads
per render: a temporary log in `getDish` during `npm run build` counted 26
calls for 13 dishes without it, 13 with it.

**The dish images skip the teaching delay.** They use a new `readDish()`
(the same lookup without the 900 ms), and keep the dish page's
`generateStaticParams` + one-hour `revalidate`, because they print the price.

**No emoji and no Fraunces in the cards.** Satori would fetch an emoji font
from a CDN at render time, and it cannot read the woff2 that `next/font`
serves. The cards use next/og's bundled sans-serif.

**Descriptions written for a person.** Each says what you get, under about
150 characters. The 13 dish descriptions are generated (`name, price.
sentence. Delivered across Addis Ababa.`) and all 13 are different (checked).

## Verified

Production build, `npm run start -p 3044`, `curl` of the served HTML.
Signed-in rows used the demo accounts (Almaz, customer; Selam, staff), signed
in by posting the login form without JavaScript; order 1001 was placed the
same way.

| Route | Status | `<title>` | robots meta | Canonical | `<h1>` count | og:image |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | Addis Eats — food delivery in Addis Ababa | — | `http://localhost:3000` | 1 | `http://localhost:3000/opengraph-image?…` |
| `/menu` | 200 | Menu · Addis Eats | — | `…/menu` | 1 | `…/menu/opengraph-image?…` |
| `/menu?category=Drink&q=tej&page=2` | 200 | Menu · Addis Eats | — | `…/menu` | 1 | `…/menu/opengraph-image?…` |
| `/menu/kitfo` | 200 | Kitfo · Addis Eats | — | `…/menu/kitfo` | 1 | `…/menu/kitfo/opengraph-image?…` |
| `/menu/doro-wat` | 200 | Doro Wat · Addis Eats | — | `…/menu/doro-wat` | 1 | `…/menu/doro-wat/opengraph-image?…` |
| `/menu/kolo-cake` (no photo) | 200 | Kolo Cake · Addis Eats | — | `…/menu/kolo-cake` | 1 | `…/menu/kolo-cake/opengraph-image?…` |
| `/menu/pizza` | 404 | Dish not found · Addis Eats | `noindex` | — | 1 | `…/menu/pizza/opengraph-image?…` |
| `/cart` | 200 | Your order · Addis Eats | `noindex, follow` | — | 1 | `…/opengraph-image?…` |
| `/login`, `/login?next=/orders` | 200 | Sign in · Addis Eats | `noindex, follow` | `…/login` | 1 | site-wide |
| `/signup` | 200 | Create an account · Addis Eats | `noindex, follow` | `…/signup` | 1 | site-wide |
| `/nowhere` | 404 | Page not found · Addis Eats | `noindex` | — | 1 | site-wide |
| `/checkout`, `/orders`, `/orders/1001`, `/kitchen` signed out | 307 | — (redirect to `/login`) | — | — | 0 | — |
| `/checkout` (customer) | 200 | Checkout · Addis Eats | `noindex, follow` | — | 1 | site-wide |
| `/orders` (customer) | 200 | Your orders · Addis Eats | `noindex, follow` | — | 1 | site-wide |
| `/orders/1001` (customer) | 200 | Order receipt · Addis Eats | `noindex, follow` | — | 1 | site-wide |
| `/kitchen` (staff) | 200 | Kitchen board · Addis Eats | `noindex, follow` | — | 1 | site-wide |
| `/kitchen` (customer) | 403 | Staff only · Addis Eats | `noindex` | — | 0 (see below) | site-wide |

Every og:image and twitter:image is an absolute URL with width 1200, height
630, type `image/png` and an alt.

| Check | Result |
| --- | --- |
| JSON-LD price = page price | `kitfo` page "260 ETB", JSON-LD `"price":260,"priceCurrency":"ETB"`; `doro-wat` 240/240; `tej` 90/90 |
| Two dish pages, two descriptions | All 13 dish descriptions distinct (`sort -u` → 13) |
| Sitemap contains a signed-in route? | No: `/`, `/menu`, 13 × `/menu/<slug>` |
| `file` on the images | `/opengraph-image`, `/menu/opengraph-image`, `/menu/kitfo/opengraph-image`, `/menu/kolo-cake/opengraph-image`: `PNG image data, 1200 x 630, 8-bit/color RGBA`, `content-type: image/png`, `x-nextjs-cache: HIT` |
| The cards themselves | Opened and looked at: photo, name, price and sentence legible, nothing cropped; the two photo-less dishes get a full-width text card |
| `getDish` reads per dish in a build | 2 without `cache()`, 1 with |
| `npm run lint`, `npm run build` | clean (the only build warning is the pre-existing one about a `pnpm-workspace.yaml` in the home folder, outside the repo) |

**The 403 page has no `<h1>` in its HTML.** With `forbidden()` (experimental
`authInterrupts`), Next.js 16.4 sends the 403's content only in the React
payload, and the browser draws it; the served HTML body has no `<main>`. That
has been the case since Day 42 and is not today's change. The title and the
`noindex` are in the HTML, and a 403 is never indexed, so it costs nothing
for search; it is recorded rather than worked around.

## Where the course material and the installed docs disagree

Checked against `node_modules/next/dist/docs/` (Next.js 16.4.2).

| The material says | Next.js 16.4 | What Addis Eats does |
| --- | --- | --- |
| `getDish(params.id)` in `generateMetadata` and `Image({ params })` | `params` is a Promise (since 15 for pages, since 16.0 for `opengraph-image`); it must be awaited | `const { id } = await params` everywhere |
| "Calling getDish twice costs one request, because the framework dedupes it" | Only `fetch` is memoised automatically. For anything else the docs' "Memoizing data requests" wraps the function in React's `cache` | `getDish = cache(…)`; measured 26 → 13 calls |
| JSON-LD via `JSON.stringify(jsonLd)` | The json-ld guide warns `JSON.stringify` does not escape `<` and replaces it with `<` | `JsonLd.jsx` escapes it |
| "Without metadataBase, relative image paths resolve against nothing" | Louder than that: a relative URL in a metadata field without `metadataBase` is a **build error** (docs); file-convention images instead fall back to `http://localhost:$PORT`, or the Vercel production URL on Vercel (seen in the installed source, `lib/metadata/resolvers/resolve-url.js`, not in the docs) | `metadataBase` from `NEXT_PUBLIC_SITE_URL` |
| `app/opengraph-image.jpg` is used "every page, unless overridden" | True only while no lower segment sets `openGraph`. Metadata merges shallowly, so a page's own `openGraph` drops a parent's file image; only a file in the page's own folder survives | `app/menu/opengraph-image.js`, and the rule in `lib/site.js` |
| "Change the image file name when you change the design" (platform caches) | Generated images get a `?<hash>` on their URL (e.g. `/menu/kitfo/opengraph-image?c800b4c4d4240b0c`). It is the same for every dish, so it follows the *code*, not the data: a new design gets a new URL by itself; a new price does not | Nothing to rename; a price change will still show the cached card on platforms until they refetch |
| A MenuItem "buys you a rich result" | Not a Next.js matter, but worth knowing: Google's list of supported rich-result types has no `MenuItem` type. The markup is valid schema.org and describes the page; do not expect a price in the listing because of it | Kept, because the exercise asks and it is accurate |
| Sitemap `priority` values | Next.js writes them; Google documents that it ignores `priority` and `changefreq` | Kept as the slides have them |
| Static page metadata only; nothing about where it goes | For dynamic routes Next.js 16 may stream metadata into `<body>` for browsers, and keeps it in `<head>` for HTML-only bots. Prerendered pages are not affected | Every public page is prerendered (`○`/`●`), so its tags are in the `<head>` of the static file |
| `app/icon.png` for the favicon | Still supported | Unchanged: Day 33's `public/favicon.svg` through `icons` in the layout |
| Not mentioned | `robots.txt` `Disallow` hides a page's `noindex` from the crawler (Google's docs) | `/login` and `/signup` are `noindex` but not disallowed |
