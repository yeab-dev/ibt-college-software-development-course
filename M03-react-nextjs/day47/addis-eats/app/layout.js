import { Fraunces } from "next/font/google";
import Analytics from "@/components/Analytics";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { OPEN_GRAPH, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
import { Providers } from "./providers";

// Replaces index.html's <title> and description. Only a server component may
// export metadata — one more reason the layout itself stays on the server.
//
// Day 44: the site-wide half of every page's <head>.
//
//   metadataBase   the site's address (lib/site.js reads it from
//                  NEXT_PUBLIC_SITE_URL). Every relative URL in any page's
//                  metadata — canonical, og:url, og:image — is made absolute
//                  against it, which is what a crawler and a link preview
//                  need. Set once, here, for the whole tree.
//   title          a template and a default. A page says only "Menu" and gets
//                  "Menu · Addis Eats"; the brand is written in one place.
//                  The template applies to *child* segments only, so the home
//                  page — app/page.js, in this same segment — gets the
//                  default, which is a full sentence on purpose.
//   description    the fallback. Every public page sets its own (two pages
//                  with one description read as duplicates), so this is only
//                  seen by a route that forgot.
//   openGraph      site name, locale and type. No image: app/opengraph-image.js
//                  is the site-wide picture, found by its file name.
//   twitter        the large card. Its title, description and image are
//                  copied from Open Graph by Next.js, so they are not
//                  repeated.
export const metadata = {
  metadataBase: SITE_URL,
  title: {
    template: `%s · ${SITE_NAME}`,
    default: `${SITE_NAME} — food delivery in Addis Ababa`,
  },
  description:
    "Order Doro Wat, Tibs, Kitfo and Shiro from one Addis Ababa kitchen, delivered to your door and paid with TeleBirr.",
  openGraph: OPEN_GRAPH,
  twitter: { card: "summary_large_image" },
  // Day 33's icon, from public/ — served as-is at /favicon.svg.
  icons: "/favicon.svg",
};

// Day 43: the heading face, self-hosted by next/font.
//
// The obvious way to use a Google font is Google's own snippet: two
// preconnects and a stylesheet <link> to fonts.googleapis.com. That stylesheet
// blocks rendering, lives on another company's server (two more connections to
// open before the first paint, and Google learns who visited), and the text
// flashes from the fallback to the new face when the file lands. PERF.md has
// the measurements of exactly that snippet.
//
// next/font downloads the file once, during `npm run build`, and serves it from
// /_next/static/media with the rest of the app. The CSS is part of the app's
// own stylesheet, the file is preloaded, and it generates a "Fraunces
// Fallback" face — the visitor's local Times New Roman with size-adjust and
// ascent/descent overrides — so the swap barely moves a line. No request to
// Google ever leaves the visitor's browser.
//
// There is deliberately no `fallback: [...]` option. With one, this build
// (Next.js 16.4, Turbopack) emitted no adjusted fallback face at all: the
// variable became "Fraunces", Georgia, serif and the metric matching was
// gone. Checked in .next/static's CSS both ways.
//
// Fraunces is a variable font, so one file covers every weight; `subsets`
// keeps only Latin. `variable` exposes it as --font-heading, which
// globals.css puts at the front of --heading: only h1 and h2 use it, and the
// body keeps the system font, which costs nothing to load.
const heading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

// Step 1. The root layout — the one file a Next.js app cannot do without.
//
// It owns <html> and <body>. There is no index.html in a Next.js project, so
// this is the only place those two tags exist anywhere, and the only place the
// global stylesheet may be imported. Every other layout (app/menu/layout.js is
// the first) renders *inside* this one and returns an ordinary element.
//
// `children` is the Day 27 prop and Day 31's <Outlet />: whatever sits below
// this folder for the current URL — a page, or a nested layout wrapping a page
// — arrives here. Nothing is registered or imported to make that happen.
//
// A layout is not re-rendered when you navigate inside it. /menu → /cart swaps
// only `children`; the header, the badge and the footer stay mounted, with
// their state. The flip side: this function cannot react to the URL. NavTabs
// needs the pathname, so it is a small client component rendered from here.
//
// Day 38: still a server component — it exports `metadata`, which a client
// file is not allowed to do, so the build itself would fail if it were not.
// It imports exactly one file that carries "use client": ./providers. That is
// an entry point into the client, not a conversion — <Providers> receives the
// header, the page and the footer as already-rendered children, so none of
// their code follows it into the bundle.
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={heading.variable}>
      <body>
        {/* As deep as it can go while still reaching every cart reader (the
            badge in the header, the menu, the cart, the checkout): inside
            <body>, around the shell. */}
        <Providers>
          {/* Day 33's stylesheet sizes and centres #root, so the shell keeps
              the id the Vite app mounted into. */}
          <div id="root">
            <SiteHeader />
            <div className="page">{children}</div>
            <SiteFooter />
          </div>
        </Providers>
        {/* Day 43: renders nothing unless NEXT_PUBLIC_ANALYTICS_SRC is set;
            then a lazyOnload <Script>. */}
        <Analytics />
      </body>
    </html>
  );
}
