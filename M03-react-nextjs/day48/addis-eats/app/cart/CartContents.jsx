"use client";

import Link from "next/link";
import {
  selectItems,
  selectRemoveItem,
  selectTotal,
  useCartStore,
} from "@/cart/cartStore";
import { etb } from "@/lib/format";

// Everything on /cart that depends on the basket — which is everything below
// the heading. Day 38 moved "use client" here from app/cart/page.js: the page
// is a server component again, and only the part that reads the store, removes
// items and navigates ships to the browser.
//
// Day 33's Cart.jsx otherwise unchanged: Link from next/link (href, not to)
// and useRouter from next/navigation in place of useNavigate — until Day 48,
// when the Checkout button that called router.push became a Link.
export default function CartContents() {
  // One selector per value. A selector returning { items, total } builds a
  // fresh object every call, so the comparison always says "changed".
  const items = useCartStore(selectItems);
  const total = useCartStore(selectTotal);
  const removeItem = useCartStore(selectRemoveItem);

  if (items.length === 0) {
    return (
      <>
        <p>Nothing in the basket yet.</p>
        <p>
          <Link className="cta" href="/menu">
            Go to the menu
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <ul className="checkout__lines">
        {items.map((item) => (
          <li key={item.id} className="checkout__line">
            <span className="checkout__name">
              {item.quantity} ×{" "}
              <Link className="tap" href={`/menu/${item.slug}`}>{item.name}</Link>
            </span>
            <span className="checkout__amount">
              {etb(item.price * item.quantity)}
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
        Total <strong>{etb(total)}</strong>
      </p>

      {/* Day 48: a link, no longer a button with router.push. It goes
          somewhere, so it is a link: it says "link" to a screen reader, it
          opens in a new tab on a middle click, and the browser shows where
          it leads. router.push is for when the *code* decides to navigate
          (Day 31's useNavigate, renamed), not for a person choosing to. */}
      <Link className="cta" href="/checkout">
        Checkout
      </Link>
    </>
  );
}
