import Link from "next/link";

// Reached two ways:
//   1. a path no folder claims — /some/bad/url — which Next.js sends here on
//      its own, the way path="*" caught it on Day 31;
//   2. notFound() called by a page — /menu/pizza, a valid path whose dish does
//      not exist.
//
// Both answer with a real 404 status. (On Day 36, /menu/pizza was a 200 with a
// "noindex" tag: the menu's loading.js had already streamed by the time the
// page called notFound(). Since Day 37 the dish route is incrementally static,
// and Next.js renders an unlisted slug completely — so it can cache the
// answer — before sending the status line.)
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
