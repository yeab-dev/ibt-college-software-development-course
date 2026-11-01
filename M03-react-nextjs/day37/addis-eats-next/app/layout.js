import CartHydrator from "@/components/CartHydrator";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

// Replaces index.html's <title> and description. Only a server component may
// export metadata — one more reason the layout itself stays on the server.
export const metadata = {
  title: "Addis Eats",
  description: "Ethiopian dishes delivered across Addis Ababa.",
  // Day 33's icon, from public/ — served as-is at /favicon.svg.
  icons: "/favicon.svg",
};

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
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Day 33's stylesheet sizes and centres #root, so the shell keeps the
            id the Vite app mounted into. */}
        <div id="root">
          <CartHydrator />
          <SiteHeader />
          <div className="page">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
