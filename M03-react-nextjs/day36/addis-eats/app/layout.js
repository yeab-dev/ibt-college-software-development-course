import Link from "next/link";
import CartBadge from "@/components/CartBadge";
import CartHydrator from "@/components/CartHydrator";
import NavTabs from "@/components/NavTabs";
import "./globals.css";

// Replaces index.html's <title> and description. Only a server component may
// export metadata — one more reason the layout itself stays on the server.
export const metadata = {
  title: "Addis Eats",
  description: "Ethiopian dishes delivered across Addis Ababa.",
  // Day 33's icon, from public/ — served as-is at /favicon.svg.
  icons: "/favicon.svg",
};

// The root shell. On Vite this was three files: index.html (the <html> and
// <body>), main.jsx (mounting into #root) and Layout.jsx (header, nav and the
// <Outlet />). Here it is one, and `children` is the Outlet: whichever page.js
// matches the URL is rendered into it. Navigating from /menu to /cart swaps
// only the children — the header is never rebuilt, exactly as before.
//
// Kept minimal on purpose. Day 37 is nested layouts.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Day 33's stylesheet sizes and centres #root, so the shell keeps the
            id the Vite app mounted into. */}
        <div id="root">
          <CartHydrator />

          <header className="topbar">
            <div>
              {/* Link, never <a href>. An anchor asks the server for a whole
                  new document, reloads every script, and starts the cart
                  over. */}
              <Link className="topbar__brand" href="/">
                <h1>Addis Eats</h1>
              </Link>
              <p className="topbar__tagline">
                Five folders, five URLs, one cart that survives all of them.
              </p>
            </div>
            <div className="topbar__tools">
              <CartBadge />
            </div>
          </header>

          <NavTabs />

          <div className="page">{children}</div>

          <footer className="sitefoot">
            <p>CodeOps · Day 36 · Next.js &amp; file-based routing</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
