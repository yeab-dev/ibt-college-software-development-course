import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatTime } from "@/lib/formatTime";
import { getOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";
import CancelOrderButton from "./CancelOrderButton";

// "/orders/1001" — the receipt: one order, for the person who placed it.
//
// Dynamic (ƒ): it reads the session cookie, because whether you may see this
// page depends on who you are. Day 31's /orders/:id, back as the place the
// checkout's action redirects to.
//
// A server component reads the order to render it — no endpoint, no fetch.
// The only interactive part is the cancel button, a client leaf.
export default async function ReceiptPage({ params }) {
  const { id } = await params;

  const user = await getSession();
  if (!user) {
    // Only digits go into the redirect: `id` is from the URL.
    redirect(`/login?next=/orders/${/^\d+$/.test(id) ? id : ""}`);
  }

  // Someone else's order and no order at all look the same from here: a 404.
  // A receipt has a name, a phone number and an address on it, and telling a
  // stranger "that one exists, but it is not yours" is already telling them
  // something. (cancelOrder, which has no page to hide behind, says 403.)
  const order = await getOrder(id);
  if (!order || order.userId !== user.phone) {
    notFound();
  }

  return (
    <main className="prose">
      <h2>
        Order {order.id}{" "}
        {order.status === "cancelled" ? "was cancelled" : "is in the kitchen"}
      </h2>
      <p>
        {order.total} ETB {order.status === "cancelled" ? "will not be" : "will be"}{" "}
        requested from TeleBirr {order.phone}. For {order.name} in {order.area},
        placed at <time dateTime={order.placedAt}>{formatTime(order.placedAt)}</time>.
      </p>

      <ul className="checkout__lines">
        {order.lines.map((line) => (
          <li key={line.id} className="checkout__line checkout__line--summary">
            <span className="checkout__name">
              {line.quantity} × <Link href={`/menu/${line.slug}`}>{line.name}</Link>
            </span>
            <span className="checkout__amount">{line.price * line.quantity} ETB</span>
          </li>
        ))}
      </ul>

      {order.notes && <p>Note for the rider: &ldquo;{order.notes}&rdquo;</p>}

      {/* The button is shown only to the owner, on an order still in the
          kitchen. That is interface, not security: cancelOrder checks the
          session and the owner again, whatever this page did or did not
          render. */}
      {order.status === "placed" ? (
        <CancelOrderButton orderId={order.id} />
      ) : (
        <p className="state">
          Cancelled at <time dateTime={order.cancelledAt}>{formatTime(order.cancelledAt)}</time>.
        </p>
      )}

      <p>
        <Link className="cta" href="/menu">
          Order something else
        </Link>{" "}
        <Link href="/orders">See the kitchen board</Link>
      </p>
    </main>
  );
}
