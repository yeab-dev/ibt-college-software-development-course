import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// What each boundary shows instead of a white screen. Every one says what
// failed and offers something to do — a dead-end apology is barely better than
// the blank page.

const resetProps = {
  error: PropTypes.instanceOf(Error),
  reset: PropTypes.func.isRequired,
};

export function MenuUnavailable({ reset }) {
  return (
    <div className="state state--error menu" role="alert">
      <h2>The menu could not be shown</h2>
      <p>
        One of the dishes came back damaged. Your basket is safe — it is right
        there beside this message.
      </p>
      <button type="button" className="state__retry" onClick={reset}>
        Load the menu again
      </button>
    </div>
  );
}
MenuUnavailable.propTypes = resetProps;

export function CartUnavailable() {
  return (
    <aside className="cart-panel state state--error" role="alert">
      <h2>The basket panel broke</h2>
      <p>Your order is still saved. You can see it on the cart page.</p>
      <p>
        <Link to="/cart">Open the cart</Link>
      </p>
    </aside>
  );
}

// A lazy route whose chunk failed to download rejects its import, which React
// treats as a render error. lazy() caches that rejection, so retrying in place
// cannot work — the only honest way out is a fresh page load.
function isChunkError(error) {
  return /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(
    error?.message ?? "",
  );
}

export function PageCrashed({ error, reset }) {
  if (isChunkError(error)) {
    return (
      <div className="state state--error" role="alert">
        <h2>This screen did not download</h2>
        <p>The connection dropped while it was loading. Nothing in your basket was lost.</p>
        <button type="button" className="state__retry" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    );
  }

  return (
    <div className="state state--error" role="alert">
      <h2>This screen broke</h2>
      <p>Something went wrong showing this page. The rest of Addis Eats still works.</p>
      <p>
        <button type="button" className="state__retry" onClick={reset}>
          Try again
        </button>{" "}
        <Link to="/menu">Back to the menu</Link>
      </p>
    </div>
  );
}
PageCrashed.propTypes = resetProps;

// The last resort, outside the router — so it uses a plain anchor, which
// reloads everything. That is the point: nothing above it is left to trust.
export function AppCrashed() {
  return (
    <main className="state state--error" role="alert" style={{ margin: 32 }}>
      <h1>Addis Eats stopped working</h1>
      <p>Your basket is saved on this device.</p>
      <p>
        <a href="/">Start again</a>
      </p>
    </main>
  );
}
