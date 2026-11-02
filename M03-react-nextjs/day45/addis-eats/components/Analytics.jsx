import Script from "next/script";

// Day 43: the one place a third-party script may enter the application — and
// by default, none does.
//
// Addis Eats loads no analytics, chat widget, map or tag manager. The honest
// answer to the reading sheet's "move any third-party script to next/script"
// is that there was nothing to move, so nothing was invented to be moved. What
// is here is the slot, so that when somebody does add one it arrives in the
// right shape:
//
//   - through next/script, never a bare <script> in the layout;
//   - with strategy="lazyOnload": injected during idle time, after everything
//     on the page has loaded. Analytics does not need to run before the
//     menu is usable, and on a slow phone it would compete with the photo
//     that is the LCP element. (afterInteractive, the default, would load it
//     straight after hydration — still too early for something nobody using
//     the page is waiting for.)
//   - switched on by an environment variable, so a development laptop and a
//     preview deployment do not count themselves as visitors.
//
// NEXT_PUBLIC_ on purpose. The value is a public URL that ends up in every
// page's HTML anyway, so there is nothing to hide; the prefix makes Next.js
// inline it at build time, in the server's code as well as the browser's, so
// every page — static or dynamic — sees the same value. Changing it means
// rebuilding, not restarting. A secret must never be given this prefix:
// SESSION_SECRET has none (see .env.example).
//
// Measured with the variable unset, as the app ships: PERF.md.
export default function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;

  // Only an https:// URL. Anything else is a configuration mistake, and
  // a script from an http:// address could be rewritten on the way.
  if (!src || !src.startsWith("https://")) return null;

  return <Script src={src} strategy="lazyOnload" />;
}
