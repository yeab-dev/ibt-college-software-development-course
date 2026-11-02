// Day 44: where the site lives, and the metadata every public page shares.
//
// metadataBase needs the site's real address. Without it a relative og:image
// ("/opengraph-image") has nothing to resolve against, and a link shared on
// Telegram arrives without its picture. There is no production URL yet (the
// deployment comes later), so the address is configuration, not code:
//
//   NEXT_PUBLIC_SITE_URL=https://addiseats.et   in the host's environment
//   nothing set                                 http://localhost:3000
//
// NEXT_PUBLIC_, because it is not a secret: it is printed in every page's
// <head> anyway. Like NEXT_PUBLIC_ANALYTICS_SRC (Day 43), it is inlined at
// build time, and so is everything that uses it: the static pages, the
// sitemap and robots.txt are all written by `npm run build`. Set it *before*
// building for production. A build made without it says "localhost" in every
// og:image and canonical tag, which is the reading sheet's "works locally,
// not live".
//
// `new URL` throws on a malformed value, so a typo fails the build loudly
// instead of shipping broken links.
export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

export const SITE_NAME = "Addis Eats";

// An absolute address for a path, for the places metadataBase does not reach:
// the sitemap, robots.txt and JSON-LD are not metadata fields, so they get
// no help from it.
export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

// The site-wide Open Graph defaults, also used by the root layout. No title
// or description here: Next.js copies the page's own into og:title and
// og:description when openGraph leaves them out.
export const OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: "en_ET",
  type: "website",
};

// The metadata of one public page: its own title and description, its
// canonical address, and the Open Graph fields that go with them.
//
// Why a function and not three keys typed into each page: metadata objects
// are merged *shallowly*. A page that sets `openGraph` at all replaces the
// root layout's whole `openGraph` object, site name and locale included — so
// any page that wants its own og:url has to repeat the rest. This writes the
// repetition once.
//
// `path` is relative; metadataBase (app/layout.js) makes the canonical link
// and og:url absolute. `images` is left out on purpose: an opengraph-image
// file supplies it. One catch, found in the page source: because this object
// replaces the layout's, it also drops the og:image an image file *higher
// up* had added. Only an opengraph-image in the page's own folder survives.
// So every page that uses this has one beside it — app/ (for /), app/menu/
// and app/menu/[id]/. SEO.md has the details.
//
// `title` may be left out (the home page does): then the key is left out
// too, because a `title: undefined` would still replace the layout's default.
export function publicPage({ title, description, path }) {
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OPEN_GRAPH,
      url: path,
    },
  };
}

// The pages that belong to one signed-in person, or to nobody but the
// visitor's own browser: the cart, the checkout, the orders, the kitchen
// board, and the sign-in forms. `noindex` keeps them out of search results;
// `follow` lets a crawler that does read the page carry on to the menu links
// in it. Most of them are also disallowed in app/robots.js — SEO.md explains
// why that pair is not quite as tidy as it looks.
export function privatePage({ title, description }) {
  return {
    title,
    description,
    robots: { index: false, follow: true },
  };
}
