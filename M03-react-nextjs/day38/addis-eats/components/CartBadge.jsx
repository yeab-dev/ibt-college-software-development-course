"use client";

// Rendered by SiteHeader, a server component (on Day 36, by app/layout.js).
// The badge reads the cart store, so it has to be a client component — this
// line is the boundary. Link now comes from next/link and takes `href`.
import Link from "next/link";
import { selectCount, useCartStore } from "@/cart/cartStore";
import { useRenderCount } from "@/hooks/useRenderCount";

// The deliverable's brief for this file: "reads only the item count through a
// selector". One value, one selector — the total has moved to the screens that
// actually show money, so this badge no longer re-renders when a price changes
// without the count changing.
function CartBadge() {
  const count = useCartStore(selectCount);
  const renders = useRenderCount("CartBadge");

  return (
    <Link className="badge" href="/cart" aria-live="polite">
      🧺 <strong>{count}</strong> {count === 1 ? "item" : "items"}
      <span className="badge__renders"> · {renders} renders</span>
    </Link>
  );
}

export default CartBadge;
