import { Link, useNavigate } from "react-router-dom";
import {
  selectItems,
  selectRemoveItem,
  selectTotal,
  useCartStore,
} from "../cart/cartStore";

function Cart() {
  // One selector per value. The temptation is to write
  // useCartStore((s) => ({ items: s.items, total: … })) and destructure it in
  // one line — but that builds a fresh object on every call, so the comparison
  // always says "changed" and Zustand behaves exactly like context.
  const items = useCartStore(selectItems);
  const total = useCartStore(selectTotal);
  const removeItem = useCartStore(selectRemoveItem);
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
              onClick={() => removeItem(item.id)}
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
