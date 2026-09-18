import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../cart/CartContext";

function Cart() {
  const { items, total, dispatch } = useContext(CartContext);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <main className="prose">
        <h2>Your order</h2>
        <p>Nothing in the basket yet.</p>
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
      <h2>Your order</h2>

      <ul className="checkout__lines">
        {items.map((item) => (
          <li key={item.id} className="checkout__line">
            <span className="checkout__name">
              {item.quantity} ×{" "}
              <Link to={`/menu/${item.slug}`}>{item.name}</Link>
            </span>
            <span className="checkout__amount">
              {item.price * item.quantity} ETB
            </span>
            <button
              type="button"
              className="checkout__remove"
              aria-label={`Remove one ${item.name}`}
              onClick={() => dispatch({ type: "remove", id: item.id })}
            >
              −
            </button>
          </li>
        ))}
      </ul>

      <p className="checkout__total">
        Total <strong>{total} ETB</strong>
      </p>

      {/* Link is for when the person chooses to go somewhere. useNavigate is
          for when the code decides — here, straight after a button that also
          has to do something else first. */}
      <button
        type="button"
        className="cta"
        onClick={() => navigate("/checkout")}
      >
        Checkout
      </button>
    </main>
  );
}

export default Cart;
