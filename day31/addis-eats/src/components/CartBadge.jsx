import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../cart/CartContext";

function CartBadge() {
  const { count, total } = useContext(CartContext);

  return (
    <Link className="badge" to="/cart" aria-live="polite">
      🧺 <strong>{count}</strong> {count === 1 ? "item" : "items"}
      {count > 0 && <span className="badge__total"> · {total} ETB</span>}
    </Link>
  );
}

export default CartBadge;
