import { Link } from "react-router-dom";
import { useCart } from "../cart/useCart";

function CartBadge() {
  const { count, total } = useCart();

  return (
    <Link className="badge" to="/cart" aria-live="polite">
      🧺 <strong>{count}</strong> {count === 1 ? "item" : "items"}
      {count > 0 && <span className="badge__total"> · {total} ETB</span>}
    </Link>
  );
}

export default CartBadge;
