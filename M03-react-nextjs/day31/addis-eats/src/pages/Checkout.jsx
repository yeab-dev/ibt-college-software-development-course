import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { CartContext } from "../cart/CartContext";

// This component never checks whether anyone is signed in. RequireAuth does
// that in App.jsx, so by the time Checkout renders there is always a user.
function Checkout() {
  const { user } = useContext(AuthContext);
  const { items, total, dispatch } = useContext(CartContext);
  const [address, setAddress] = useState("");
  const [placed, setPlaced] = useState(null);
  const navigate = useNavigate();

  function placeOrder(event) {
    event.preventDefault();
    setPlaced({ reference: `AE-${Date.now().toString().slice(-6)}`, total });
    dispatch({ type: "clear" });
  }

  if (placed) {
    return (
      <main className="prose">
        <h2>Order {placed.reference}</h2>
        <p>
          {placed.total} ETB, on its way to {address || "the front desk"}.
        </p>
        <button
          type="button"
          className="cta"
          // replace: true swaps the current history entry instead of adding
          // one, so Back does not return to a checkout form for an order that
          // has already been placed.
          onClick={() => navigate("/menu", { replace: true })}
        >
          Order something else
        </button>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="prose">
        <h2>Checkout</h2>
        <p>There is nothing to check out.</p>
        <p>
          <Link className="cta" to="/menu">
            Go to the menu
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="prose">
      <h2>Checkout</h2>
      <p>
        Signed in as {user.name} ({user.phone}).
      </p>

      <form className="form" onSubmit={placeOrder}>
        <label className="form__label" htmlFor="address">
          Delivery address
        </label>
        <input
          id="address"
          value={address}
          placeholder="Bole, behind the Edna Mall"
          onChange={(event) => setAddress(event.target.value)}
        />

        <p className="checkout__total">
          Total <strong>{total} ETB</strong>
        </p>

        <button type="submit" className="cta">
          Place the order
        </button>
      </form>
    </main>
  );
}

export default Checkout;
