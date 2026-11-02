import Link from "next/link";
import { redirect } from "next/navigation";
import { formatTime } from "@/lib/formatTime";
import { orderStage, STAGE_LABEL } from "@/lib/orderStage";
import { listOrdersFor } from "@/lib/orders";
import { getSession } from "@/lib/session";
import { privatePage } from "@/lib/site";

// "/orders" — your orders, and nobody else's.
//
// Day 39–41 this address was the kitchen board: every order, the same page
// for everyone, static and rebuilt by revalidatePath. Day 42 splits it in
// two. The board moved to /kitchen, for staff only, and this became the
// slides' own example page:
//
//     const user = await getSession();
//     if (!user) redirect("/login?next=/orders");
//     const orders = await getOrdersFor(user.id);
//
// The important line is the query. It is given the session's account id,
// not anything from the request, so no URL, query string or form field can
// make it return someone else's orders.
//
// Dynamic (ƒ): it depends on who is asking. The proxy has already turned a
// visitor with no session cookie away (proxy.js); this check is the one
// that verifies the cookie is a real, live session.
// Day 44: a title and a description for the person who has the tab open,
// and `noindex`: this page is one person's own, so it has no business in
// search results (lib/site.js). robots.js disallows it as well.
export const metadata = privatePage({
  title: "Your orders",
  description: "Every order you have placed with Addis Eats, newest first, with where each one is now.",
});

export default async function MyOrdersPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?next=/orders");
  }

  const orders = await listOrdersFor(user.id);

  return (
    <main className="prose">
      <h1>Your orders</h1>
      <p>
        Signed in as <strong>{user.name}</strong> ({user.phone}).
        {/* Interface, not security: /kitchen checks the role itself. */}
        {user.role === "staff" && (
          <>
            {" "}
            <Link href="/kitchen">Open the kitchen board</Link>
          </>
        )}
      </p>

      {orders.length === 0 ? (
        <p className="state">
          No orders yet. <Link href="/menu">Have a look at the menu</Link>.
        </p>
      ) : (
        <ol className="board" reversed>
          {orders.map((order) => {
            const dishes = order.lines.reduce((sum, l) => sum + l.quantity, 0);
            const stage = orderStage(order);
            return (
              <li key={order.id} className={`board__order board__order--${order.status}`}>
                <Link className="board__id" href={`/orders/${order.id}`}>
                  #{order.id}
                </Link>
                <span className="board__who">{order.area}</span>
                <span className="board__what">
                  {dishes} {dishes === 1 ? "dish" : "dishes"} · {order.total} ETB
                </span>
                <span className="board__status">
                  {STAGE_LABEL[stage]} · <time dateTime={order.placedAt}>{formatTime(order.placedAt)}</time>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
