import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { cancelOrder } from "@/app/actions";
import { formatTime } from "@/lib/formatTime";
import { orderStage, STAGE_LABEL } from "@/lib/orderStage";
import { listOrders } from "@/lib/orders";
import { getSession } from "@/lib/session";

// "/kitchen" — the kitchen board: every order, newest first, the way a
// restaurant screen shows the queue. Staff only.
//
// It was /orders until Day 41: static, the same for every visitor, with no
// cookie read anywhere. That was fine while it showed only first names and
// areas to anyone. A board that staff act on (they can refuse an order) and
// that shows every customer's order is not for everyone, so it moved here,
// behind a role, and /orders became each person's own list.
//
// The role is checked here, on the server, while the page renders:
//
//   - no session         → redirect to /login?next=/kitchen (the proxy will
//                           usually have done this already)
//   - a customer         → forbidden(): a 403 and app/forbidden.js
//   - staff              → the board
//
// The link to this page is only shown to staff (/orders, /login). That is
// the role answering "what to show". This check answers "what to allow",
// and it is the one that holds when someone types /kitchen into the address
// bar. The Refuse buttons post cancelOrder, which checks the role again for
// itself, because a button's action can be posted from anywhere.
//
// Dynamic (ƒ): it reads the session.
export default async function KitchenBoard() {
  const user = await getSession();
  if (!user) {
    redirect("/login?next=/kitchen");
  }
  if (user.role !== "staff") {
    console.warn(`/kitchen refused: ${user.id} is a ${user.role}`);
    forbidden();
  }

  const orders = await listOrders();
  // One clock reading for the whole board, so every row is staged against
  // the same moment.
  const renderedAt = new Date();

  return (
    <main className="prose">
      <h2>The kitchen board</h2>
      <p className="board__built">
        Signed in as <strong>{user.name}</strong>, staff. Rendered at{" "}
        <time dateTime={renderedAt.toISOString()}>{formatTime(renderedAt.toISOString())}</time>.
      </p>

      {orders.length === 0 ? (
        <p className="state">No orders yet today.</p>
      ) : (
        <ol className="board" reversed>
          {orders.map((order) => {
            const dishes = order.lines.reduce((sum, l) => sum + l.quantity, 0);
            const stage = orderStage(order, renderedAt.getTime());
            return (
              <li key={order.id} className={`board__order board__order--${order.status}`}>
                <span className="board__id">#{order.id}</span>
                <span className="board__who">
                  {order.name.split(" ")[0]} · {order.area}
                </span>
                <span className="board__what">
                  {dishes} {dishes === 1 ? "dish" : "dishes"} · {order.total} ETB
                </span>
                <span className="board__status">
                  {STAGE_LABEL[stage]} · <time dateTime={order.placedAt}>{formatTime(order.placedAt)}</time>
                </span>
                {/* A server component can render a form whose action is a
                    bound server action: no client code at all, and it works
                    without JavaScript. The id is in the HTML; cancelOrder
                    decides, from the session, whether this person may use
                    it. */}
                {stage === "kitchen" && (
                  <form action={cancelOrder.bind(null, order.id)} className="board__refuse">
                    <button type="submit" className="tabs__signout">
                      Refuse #{order.id}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <p>
        <Link href="/orders">Your own orders</Link>
      </p>
    </main>
  );
}
