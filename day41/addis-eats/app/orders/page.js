import Link from "next/link";
import { formatTime } from "@/lib/formatTime";
import { listOrders } from "@/lib/orders";

// "/orders" — the kitchen board: every order, newest first, the way a
// restaurant screen shows the queue. First names and areas only; no phone
// numbers, no notes, nothing that is one person's business.
//
// Static (○ in the build), with no revalidate window at all. That is the
// point of it today. The board changes only when an order is written, and
// every write — placeOrder, cancelOrder and POST /api/orders — calls
//
//     revalidatePath("/orders")
//
// So it is built once, served as a file to everyone, and rebuilt exactly when
// it becomes wrong: never stale, and never re-rendered for nothing. A timer
// (revalidate = 60) would do both of those things badly — up to a minute
// behind after an order, and a pointless re-render every minute when there
// is none. Without the revalidatePath calls, a new order would never appear
// here at all; the README shows that happening, and then not happening.
//
// The same for every visitor, so nothing here may read a cookie: one read and
// the page would turn ƒ, and the cache would be gone.
export default async function OrdersBoard() {
  const orders = await listOrders();

  // When this HTML was made. On a static page that is "when it was last
  // regenerated", which makes the revalidation visible.
  const builtAt = new Date().toISOString();

  return (
    <main className="prose">
      <h2>The kitchen board</h2>
      <p className="board__built">
        Board built at <time dateTime={builtAt}>{formatTime(builtAt)}</time>.
        It is rebuilt only when an order is placed or cancelled.
      </p>

      {orders.length === 0 ? (
        <p className="state">No orders yet today.</p>
      ) : (
        <ol className="board" reversed>
          {orders.map((order) => {
            const dishes = order.lines.reduce((sum, l) => sum + l.quantity, 0);
            return (
              <li key={order.id} className={`board__order board__order--${order.status}`}>
                <Link className="board__id" href={`/orders/${order.id}`}>
                  #{order.id}
                </Link>
                <span className="board__who">
                  {order.name.split(" ")[0]} · {order.area}
                </span>
                <span className="board__what">
                  {dishes} {dishes === 1 ? "dish" : "dishes"} · {order.total} ETB
                </span>
                <span className="board__status">
                  {order.status === "cancelled" ? "Cancelled" : "In the kitchen"} ·{" "}
                  <time dateTime={order.placedAt}>{formatTime(order.placedAt)}</time>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
