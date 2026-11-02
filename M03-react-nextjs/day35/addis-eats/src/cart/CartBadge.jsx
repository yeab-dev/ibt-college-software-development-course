import { Link } from "react-router-dom";
import { selectCount, useCartStore } from "./cartStore";

// The deliverable's brief for this file: "reads only the item count through a
// selector". One value, one selector — the total has moved to the screens that
// actually show money, so this badge no longer re-renders when a price changes
// without the count changing.
function CartBadge() {
  const count = useCartStore(selectCount);

  return (
    <Link className="badge" to="/cart" aria-live="polite">
      🧺 <strong>{count}</strong> {count === 1 ? "item" : "items"}
    </Link>
  );
}

export default CartBadge;
