import Link from "next/link";

// Reached two ways:
//   1. a path no folder claims — /some/bad/url — which Next.js sends here on
//      its own, the way path="*" caught it on Day 31;
//   2. notFound() called by a page — /menu/pizza, a valid path whose dish does
//      not exist.
//
// The status code differs between the two, and it is worth knowing why. A bad
// URL is answered 404 before any HTML is sent. /menu/pizza sits under
// app/menu/loading.js, so the loading screen has already been sent — with a
// 200 status — by the time the page discovers there is no pizza. Headers
// cannot be taken back once sent, so Next.js shows this screen in place of the
// page and adds <meta name="robots" content="noindex"> so search engines still
// treat it as missing.
//
// Day 31's NotFound printed the address ("Nothing at /menuu"). This one
// cannot, honestly: Next.js builds not-found.js once, ahead of time, as a
// static page (/_not-found in the build output), and that HTML is served for
// every bad URL. Reading the path with usePathname would put "/_not-found" in
// the server HTML and the real path in the browser's first render — a
// hydration mismatch. So the message does not name the address.
export default function NotFound() {
  return (
    <main className="prose">
      <h2>Nothing at this address</h2>
      <p>That address is not one of ours.</p>
      <p>
        <Link className="cta" href="/menu">
          Back to the menu
        </Link>
      </p>
    </main>
  );
}
