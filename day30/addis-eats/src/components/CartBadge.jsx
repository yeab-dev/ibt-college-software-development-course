import { useContext } from "react";
import { CartContext } from "../cart/CartContext";

// Consumer one. It sits in the header, far from every dish card, and it needs
// exactly two numbers. With context it takes one line and no props.
function CartBadge() {
  const { count, total } = useContext(CartContext);

  return (
    <p className="badge" aria-live="polite">
      🧺 <strong>{count}</strong> {count === 1 ? "item" : "items"}
      {count > 0 && <span className="badge__total"> · {total} ETB</span>}
    </p>
  );
}

export default CartBadge;
