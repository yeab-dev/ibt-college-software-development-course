import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import ErrorBoundary from "./ui/ErrorBoundary";
import Probe from "./dev/Probe";
import { PageCrashed } from "./ui/Fallbacks";
import CartBadge from "./cart/CartBadge";
import ThemePicker from "./theme/ThemePicker";
import { useAuth } from "./auth/useAuth";

const TABS = [
  { to: "/", label: "Home", end: true },
  { to: "/menu", label: "Menu" },
  { to: "/cart", label: "Cart" },
  { to: "/checkout", label: "Checkout" },
];

function Layout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  // Layout reads the session and nothing else. Day 32's render counter showed
  // it never re-renders when a dish is added: only components that call
  // useContext re-render, and the cart is not in context any more. Day 35
  // removed the counters (they logged on every render); React DevTools'
  // "Highlight updates" shows the same thing without touching the console.

  return (
    <>
      <header className="topbar">
        <div>
          {/* Link, never <a href>. An anchor asks the server for a file that
              does not exist, reloads everything, and empties the cart. */}
          <Link className="topbar__brand" to="/">
            <h1>Addis Eats</h1>
          </Link>
          <p className="topbar__tagline">
            Six screens, six URLs, one cart that survives all of them.
          </p>
        </div>
        <div className="topbar__tools">
          <ThemePicker />
          <Probe id="CartBadge">
            <CartBadge />
          </Probe>
        </div>
      </header>

      <nav className="tabs" aria-label="Main">
        {TABS.map((tab) => (
          // NavLink is a Link that also knows whether it is the open page.
          // `end` stops "/" matching every URL that begins with a slash.
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              isActive ? "tabs__link tabs__link--active" : "tabs__link"
            }
          >
            {tab.label}
          </NavLink>
        ))}

        <span className="tabs__session">
          {user ? (
            <>
              {user.name}
              <button type="button" className="tabs__signout" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="tabs__link">
              Sign in
            </NavLink>
          )}
        </span>
      </nav>

      <div className="page">
        {/* The hole in the frame. Navigating from /menu to /cart swaps only
            what renders here — the header above is never rebuilt, so anything
            it is holding (an open search box, a scroll position) stays put. */}
        {/* Day 34. Whatever screen is open can fail on its own — including a
            lazy chunk that never arrives — and the header above survives.
            resetKey: navigating to another screen clears the fallback. */}
        <ErrorBoundary name="page" fallback={PageCrashed} resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>

      <footer className="sitefoot">
        <p>
          CodeOps · Day 35 · The React mini-project, finished
        </p>
      </footer>
    </>
  );
}

export default Layout;
