import { useContext } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import CartBadge from "./components/CartBadge";
import { AuthContext } from "./auth/AuthContext";

const TABS = [
  { to: "/", label: "Home", end: true },
  { to: "/menu", label: "Menu" },
  { to: "/cart", label: "Cart" },
  { to: "/checkout", label: "Checkout" },
];

function Layout() {
  const { user, signOut } = useContext(AuthContext);

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
        <CartBadge />
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
        <Outlet />
      </div>

      <footer className="sitefoot">
        <p>CodeOps · Day 31 · React Router v6</p>
      </footer>
    </>
  );
}

export default Layout;
