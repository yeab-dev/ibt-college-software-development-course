# Addis Eats — Day 44: metadata and SEO

Week 9. Day 43 made Addis Eats fast; today it becomes findable. Every route
gets a title and a description written for a person, the public pages get a
canonical address and a preview card worth opening in a Telegram group, each
dish describes itself to search engines in JSON-LD, and a sitemap and
robots.txt are generated from the menu itself.

As the deck says, most of the SEO work was already done: the dish pages have
been prerendered HTML since Day 37 and fast on a phone since Day 43. Today is
the finishing layer, and it was checked where the sheet says to check it: in
the served page source, not in the code.

- [SEO.md](SEO.md) is today's document: what every route exposes, the
  decisions, the verification output, and where the course material and the
  installed Next.js 16.4 docs disagree.
- [STRATEGY.md](STRATEGY.md) gains the five metadata routes, [DATA.md](DATA.md)
  the two new reads of a dish, [BOUNDARY.md](BOUNDARY.md) the new server-only
  files. [AUTH.md](AUTH.md) and [PERF.md](PERF.md) are unchanged.

## Run it

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET: openssl rand -base64 32
npm run build
npm run start                # http://localhost:3000
npm run lint
```

`NEXT_PUBLIC_SITE_URL` is the site's own address. Leave it empty locally
(it falls back to `http://localhost:3000`); on the host, set it to the
production URL **before** `npm run build`, because the static pages, the
sitemap and robots.txt are written by the build.

To check what a crawler sees (the sheet's "view source, not your code"):

```bash
curl -s http://localhost:3000/menu/kitfo | grep -o '<title>[^<]*\|<meta [^>]*>\|<link rel="canonical"[^>]*>'
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/robots.txt
curl -s -o kitfo.png http://localhost:3000/menu/kitfo/opengraph-image && file kitfo.png
```

## The seven exercises, and where each landed

| # | Exercise | Where |
| --- | --- | --- |
| 1 | `metadataBase` and a title template in the root layout, with a default | [app/layout.js](app/layout.js): `metadataBase` from [lib/site.js](lib/site.js) (`NEXT_PUBLIC_SITE_URL`, localhost fallback), `title: { template: "%s · Addis Eats", default: "Addis Eats — food delivery in Addis Ababa" }`, a fallback description, site-wide Open Graph (site name, `en_ET`, `website`) and the large Twitter card |
| 2 | Every static route: its own title, a description for a person | `publicPage()` / `privatePage()` in [lib/site.js](lib/site.js), used by [/](app/page.js), [/menu](app/menu/page.js), [/cart](app/cart/page.js), [/checkout](app/checkout/layout.js), [/login](app/login/page.js), [/signup](app/signup/page.js), [/orders](app/orders/page.js), [/orders/\[id\]](app/orders/[id]/page.js), [/kitchen](app/kitchen/page.js); plus titles on [not-found.js](app/not-found.js) and [forbidden.js](app/forbidden.js). Each description is different and under ~150 characters |
| 3 | `generateMetadata` on the dish route from name, price and summary | [app/menu/\[id\]/page.js](app/menu/[id]/page.js): "Kitfo · Addis Eats", "Kitfo, 260 ETB. Minced raw beef folded into spiced niter kibbeh. Delivered across Addis Ababa.", canonical and og:url `/menu/kitfo`. `getDish` is now wrapped in React `cache()` ([lib/menu.js](lib/menu.js)) so the metadata and the page share one read |
| 4 | Site-wide `opengraph-image`, then one per dish with `ImageResponse` | [app/opengraph-image.js](app/opengraph-image.js) and [app/menu/\[id\]/opengraph-image.js](app/menu/[id]/opengraph-image.js), both drawn by [components/OgCard.jsx](components/OgCard.jsx), 1200 × 630 PNG. Plus [app/menu/opengraph-image.js](app/menu/opengraph-image.js), the deck's section image, which turned out to be *needed* (SEO.md: `/menu` had lost its og:image) |
| 5 | `MenuItem` JSON-LD from the same dish object the page renders | `menuItemJsonLd(dish, photo)` in the dish page, rendered by [components/JsonLd.jsx](components/JsonLd.jsx) (escapes `<`). The home page has a `Restaurant` |
| 6 | `app/sitemap.js` from the dishes, private routes excluded | [app/sitemap.js](app/sitemap.js): `/`, `/menu` and 13 dish pages from `readMenu()`, revalidated with the menu's hour |
| 7 | `robots.js` disallowing `/cart` and `/checkout`, pointing at the sitemap | [app/robots.js](app/robots.js): disallows `/cart`, `/checkout`, `/orders`, `/kitchen`, `/api/`; `Sitemap:` absolute |

The mini-project's requirements:

| Requirement | Where |
| --- | --- |
| `metadataBase` set to the production URL, a title template in the root layout | `metadataBase` is `NEXT_PUBLIC_SITE_URL`; there is no production URL yet, so it is localhost until the deployment sets it. A build with `NEXT_PUBLIC_SITE_URL=https://addiseats.et` was checked: every canonical, og:image and the sitemap line said `https://addiseats.et` |
| A distinct, human-readable description on every route | Every route above; the 13 dish descriptions are all different (checked) |
| `generateMetadata` on the dish route, from the dish record | Exercise 3 |
| Site-wide `opengraph-image` + one per dish, 1200 × 630 | Exercise 4; `file` says `PNG image data, 1200 x 630` for all four checked |
| `MenuItem` JSON-LD whose price and name match the page | Same object; Kitfo page "260 ETB" ↔ `"price":260,"priceCurrency":"ETB"` |
| Sitemap from real data, private routes excluded and disallowed | Exercises 6 and 7 |
| A canonical on any route that accepts query parameters | `/menu` (`?category`, `?q`, `?page`) → `/menu`; `/login`, `/signup` (`?next`) → themselves. Also on `/` and every dish page |

And the two asked for alongside:

| Requirement | Where |
| --- | --- |
| Exactly one `<h1>` per page | The header's brand was the only `<h1>`, on every page. It is now styled text ([components/SiteHeader.jsx](components/SiteHeader.jsx), `.topbar__name` in [globals.css](app/globals.css)); each page's heading went from `<h2>` to `<h1>` at the same size; the menu sidebar's `<h3>` became `<h2>`. Counted: one on every page served as HTML |
| Private and signed-in pages not indexed | `noindex, follow` on `/cart`, `/checkout`, `/orders`, `/orders/[id]`, `/kitchen`, `/login`, `/signup`; Next.js adds `noindex` to the 404 and 403 |

## Decisions

The details are in [SEO.md](SEO.md#decisions). The short version:

- **The site URL is configuration.** `NEXT_PUBLIC_SITE_URL`, read at build
  time. Public, because it is in every `<head>`. A typo fails the build (`new URL`).
- **Metadata merges shallowly, so public pages go through one helper.** A page
  setting `openGraph` replaces the layout's whole object. The same merge
  dropped `/menu`'s og:image, which only the page source showed; a section
  `opengraph-image` beside the page fixed it.
- **`noindex` vs `Disallow`.** Disallowing a page stops a crawler from reading
  its `noindex`. So `/cart`, `/checkout`, `/orders`, `/kitchen` are both (the
  exercise asks for the disallow; three of them redirect a crawler anyway),
  and `/login`, `/signup` are `noindex` only.
- **`cache()` around `getDish`**, because the slides' "the framework dedupes it"
  is only true of `fetch`. Measured: 26 reads for 13 dishes without, 13 with.
- **JSON-LD only says what the page shows.** No invented address, hours or
  rating on the `Restaurant`.

## Check yourself

| Question | Answer |
| --- | --- |
| Does the page source show absolute URLs in every og:image tag? | Yes: `http://localhost:3000/…/opengraph-image?<hash>` on every page, and `https://addiseats.et/…` when built with the variable set |
| Do two different dish pages have two different descriptions? | Yes; all 13 differ |
| Does the sitemap contain any route that requires signing in? | No: `/`, `/menu`, 13 dish pages |
| Does the JSON-LD price match the price on the page, in ETB? | Yes: Kitfo 260, Doro Wat 240, Tej 90, all `ETB`, from the same object |
| Is there exactly one h1 on each page, and does it describe the page? | Yes, on every page served as HTML ("The menu", "Kitfo", "Your order"…). The 403 page draws its body in the browser (since Day 42), so its HTML has none |
| Would a link to a dish look worth opening in a group chat? | The card has the dish's photo, its name, the price in birr and a sentence; SEO.md has the four checked |

## Verified

| Check | Result |
| --- | --- |
| `npm run lint` | No warnings, no errors |
| `npm run build` | Passes. Every Day 43 marker unchanged; new: `○ /opengraph-image`, `○ /robots.txt`, `○ /menu/opengraph-image` 1h, `○ /sitemap.xml` 1h, `● /menu/[id]/opengraph-image` 1h (13 paths) |
| Page source, 21 route/visitor combinations | Title, description, robots, canonical, h1 count and og:image per route: the table in [SEO.md](SEO.md#verified) |
| `/sitemap.xml`, `/robots.txt` | As in SEO.md: 15 URLs; five `Disallow` lines and an absolute `Sitemap:` |
| `/opengraph-image`, `/menu/opengraph-image`, `/menu/kitfo/opengraph-image`, `/menu/kolo-cake/opengraph-image` | `content-type: image/png`, `PNG image data, 1200 x 630`, served from the build cache (`x-nextjs-cache: HIT`) |
| `NEXT_PUBLIC_SITE_URL=https://addiseats.et npm run build` | Canonical, og:image, JSON-LD `url` and robots.txt's `Sitemap:` all on `https://addiseats.et`; then rebuilt without it |

## Deviations, honestly

- **No production URL.** `metadataBase` is localhost until the deployment
  sets `NEXT_PUBLIC_SITE_URL`. The previews and Search Console checks the
  sheet ends with need a public URL, so they are not done yet.
- **A third preview image**, for `/menu`, which the exercises do not ask for:
  without it `/menu` had none (SEO.md).
- **More than `/cart` and `/checkout` disallowed**, and `/login`, `/signup`
  deliberately *not* disallowed, for the `noindex` reason above.
- **The header lost its `<h1>`.** Required by "exactly one h1 that describes
  the page"; the brand looks the same.
- **The 403 page's HTML has no `<h1>`.** Next.js 16.4's experimental
  `forbidden()` sends its body in the React payload only. Not today's
  change, and a 403 is never indexed.
- **The course is written for Next.js 15**; SEO.md's last table lists each
  place it differs from 16.4 (`params` as a Promise, `cache()` for
  deduplication, escaping JSON-LD, the shallow merge).

## What changed from Day 43

| File | Change |
| --- | --- |
| `lib/site.js` | New: `SITE_URL` from `NEXT_PUBLIC_SITE_URL`, `absoluteUrl()`, the site-wide Open Graph, `publicPage()` and `privatePage()` |
| `app/layout.js` | `metadataBase`, title template + default, description, Open Graph, Twitter card |
| `app/page.js` | Description + canonical, `Restaurant` JSON-LD, h1 |
| `app/menu/page.js` | Title, description, canonical `/menu` |
| `app/menu/[id]/page.js` | `generateMetadata` from the dish, `MenuItem` JSON-LD, h1 |
| `app/opengraph-image.js`, `app/menu/opengraph-image.js`, `app/menu/[id]/opengraph-image.js` | New: the three generated preview cards |
| `components/OgCard.jsx` | New: the card's JSX for `ImageResponse`, and the photo as a data URL |
| `components/JsonLd.jsx` | New: the escaped `application/ld+json` script |
| `app/sitemap.js`, `app/robots.js` | New |
| `lib/menu.js` | `getDish` wrapped in React `cache()`; new `readDish()` without the delay |
| `app/cart/page.js`, `app/checkout/layout.js`, `app/orders/page.js`, `app/orders/[id]/page.js`, `app/kitchen/page.js`, `app/login/page.js`, `app/signup/page.js` | Title, description, `noindex`; canonical on `/login` and `/signup` |
| `app/not-found.js`, `app/forbidden.js` | A title each |
| `components/SiteHeader.jsx`, `app/globals.css`, every page heading, `app/menu/layout.js` | One h1 per page: the brand is `.topbar__name`, page headings `<h2>` → `<h1>`, the sidebar's `<h3>` → `<h2>`, same look |
| `.env.example` | `NEXT_PUBLIC_SITE_URL` |
| `SEO.md` | New: the route-by-route record, decisions, verification, material vs docs |
| `STRATEGY.md`, `DATA.md`, `BOUNDARY.md` | The metadata routes, the new dish reads, the new server-only files |
