import { absoluteUrl } from "@/lib/site";

// Day 44: /robots.txt — what a well-behaved crawler may fetch, and where the
// sitemap is.
//
// Disallowed: every route that belongs to one person. /cart is drawn from one
// browser's storage, so a crawler would only ever see an empty basket;
// /checkout, /orders and /kitchen answer a crawler with a redirect to /login
// (proxy.js), which is crawl budget spent on 307s. /api/ is JSON for the
// page's own scripts, not pages.
//
// Not disallowed: /login and /signup. They are noindexed instead
// (lib/site.js), and a noindex tag only works if the crawler is allowed to
// fetch the page and read it. SEO.md has the details.
//
// robots.txt is a request, not a lock. Anyone can still type /kitchen; the
// session checks in AUTH.md are what keep it private.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/orders", "/kitchen", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
