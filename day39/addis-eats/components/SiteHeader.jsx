import Link from "next/link";
import CartBadge from "./CartBadge";
import NavTabs from "./NavTabs";

// The header every page shares, pulled out of app/layout.js so the root
// layout reads as what it is: html, body, header, page, footer.
//
// A server component — no directive. It renders two client components
// (CartBadge reads the cart store, NavTabs reads the pathname) but needs no
// browser of its own: the brand link and the tagline are plain HTML.
//
// Because the root layout renders it, it is mounted once and never again.
// Navigating from /menu to /cart does not re-run this function; only the page
// slot below it changes. That is why the badge keeps its render count across
// every route.
export default function SiteHeader() {
  return (
    <>
      <header className="topbar">
        <div>
          {/* Link, never <a href>. An anchor asks the server for a whole new
              document, reloads every script, and starts the cart over. */}
          <Link className="topbar__brand" href="/">
            <h1>Addis Eats</h1>
          </Link>
          <p className="topbar__tagline">
            Its own API, and server actions behind every order.
          </p>
        </div>
        <div className="topbar__tools">
          <CartBadge />
        </div>
      </header>

      <NavTabs />
    </>
  );
}
