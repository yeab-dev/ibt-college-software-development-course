import { Link, useSearchParams } from "react-router-dom";
import { selectItems, selectTotal, useCartStore } from "../cart/cartStore";

// The basket beside the menu. A region of its own, behind its own boundary in
// App.jsx, so a broken menu leaves it working — and the other way round.
function CartPanel() {
  const items = useCartStore(selectItems);
  const total = useCartStore(selectTotal);

  // /menu?crash=cart throws here, during render, to prove the menu survives a
  // broken cart panel just as the cart panel survives a broken menu.
  const [params] = useSearchParams();
  if (params.get("crash") === "cart") {
    throw new Error("CartPanel was told to crash (?crash=cart)");
  }

  return (
    <aside className="cart-panel" aria-labelledby="cart-panel-title">
      <h2 id="cart-panel-title">Your basket</h2>

      {items.length === 0 ? (
        <p>Nothing yet. Add a dish to start an order.</p>
      ) : (
        <>
          <ul className="checkout__lines">
            {items.map((item) => (
              <li key={item.id} className="checkout__line checkout__line--summary">
                <span className="checkout__name">
                  {item.quantity} × {item.name}
                </span>
                <span className="checkout__amount">
                  {item.price * item.quantity} ETB
                </span>
              </li>
            ))}
          </ul>
          <p className="checkout__total">
            Total <strong>{total} ETB</strong>
          </p>
          <Link className="cta" to="/checkout">
            Checkout
          </Link>
        </>
      )}
    </aside>
  );
}

export default CartPanel;
