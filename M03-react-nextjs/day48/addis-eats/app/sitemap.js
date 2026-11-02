import { readMenu } from "@/lib/menu";
import { absoluteUrl } from "@/lib/site";

// Day 44: /sitemap.xml, generated from the menu file.
//
// A function, not an XML file kept by hand: it lists every dish in
// data/menu.json, so a dish added next month is in the sitemap without anyone
// remembering to add it. It reads nothing from the request, so the build
// writes it once; `revalidate` gives it the menu's own hour, so a new dish
// appears here no later than it appears on /menu.
//
// Only the public, indexable pages: the home page, the menu and one page per
// dish. Nothing that needs signing in (/checkout, /orders, /kitchen,
// /dashboard), nothing that is one browser's own (/cart), and not /login or
// /signup — they carry a noindex tag, and a sitemap should list only pages
// that are meant to appear in results. Those routes are disallowed or noindexed instead (app/robots.js,
// lib/site.js).
//
// No `lastModified`: the menu has no per-dish "last changed" date, and an
// invented one (the build time) is worse than none. `priority` follows the
// slides; Google says it ignores it, other crawlers may not.
export const revalidate = 3600;

export default async function sitemap() {
  const dishes = await readMenu();
  return [
    { url: absoluteUrl("/"), priority: 1 },
    { url: absoluteUrl("/menu"), priority: 0.8 },
    ...dishes.map((dish) => ({ url: absoluteUrl(`/menu/${dish.slug}`), priority: 0.6 })),
  ];
}
