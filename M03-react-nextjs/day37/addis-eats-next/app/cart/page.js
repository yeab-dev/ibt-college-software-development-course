"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  selectItems,
  selectRemoveItem,
  selectTotal,
  useCartStore,
} from "@/cart/cartStore";

// "/cart". Day 33's Cart.jsx with two imports changed: Link from next/link
// (href, not to) and useRouter from next/navigation in place of useNavigate.
//
// A page can be a client component too. This one is nothing but the cart, and
// the cart lives in the browser (localStorage), so there is nothing for the
// server to fetch — "use client" at the top of page.js is the honest choice.
export default function CartPage() {
  // One selector per value. A selector returning { items, total } builds a
  // fresh object every call, so the comparison always says "changed".
  const items = useCartStore(selectItems);
  const total = useCartStore(selectTotal);
  const removeItem = useCartStore(selectRemoveItem);
  const router = useRouter();

  if (items.length === 0) {
    return (
      <main className="prose">
        <h2>Your order</h2>
        <p>Nothing in the basket yet.</p>
        <p>
          <Link className="cta" href="/menu">
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
              <Link href={`/menu/${item.slug}`}>{item.name}</Link>
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

      {/* Link is for when the person chooses to go somewhere. router.push is
          for when the code decides — Day 31's useNavigate, renamed. Import it
          from next/navigation, never the old next/router. */}
      <button
        type="button"
        className="cta"
        onClick={() => router.push("/checkout")}
      >
        Checkout
      </button>
    </main>
  );
}
