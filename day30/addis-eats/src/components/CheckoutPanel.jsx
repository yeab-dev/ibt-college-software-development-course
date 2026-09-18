import { useContext } from "react";
import { CartContext } from "../cart/CartContext";

// Consumer two. Same context, a different slice of it — and the only place in
// the app that dispatches "remove" and "clear".
function CheckoutPanel() {
  const { items, total, dispatch } = useContext(CartContext);

  if (items.length === 0) {
    return (
      <aside className="checkout">
        <h2>Your order</h2>
        <p className="checkout__empty">Nothing in the basket yet.</p>
      </aside>
    );
  }

  return (
    <aside className="checkout">
      <h2>Your order</h2>

      <ul className="checkout__lines">
        {items.map((item) => (
          <li key={item.id} className="checkout__line">
            <span className="checkout__name">
              {item.quantity} × {item.name}
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

      <button
        type="button"
        className="checkout__clear"
        onClick={() => dispatch({ type: "clear" })}
      >
        Clear the order
      </button>
    </aside>
  );
}

export default CheckoutPanel;
