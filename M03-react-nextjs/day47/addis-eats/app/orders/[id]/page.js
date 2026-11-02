import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { etb, when } from "@/lib/format";
import { getOrderFor, orderView } from "@/lib/orders";
import { getSession } from "@/lib/session";
import { privatePage } from "@/lib/site";
import CancelOrderButton from "./CancelOrderButton";
import OrderStatus from "./OrderStatus";
import Tracking from "./Tracking";

// "/orders/1001" — the receipt: one order, for the person who placed it.
//
// Dynamic (ƒ): it reads the session cookie, because whether you may see this
// page depends on who you are. Day 31's /orders/:id, back as the place the
// checkout's action redirects to.
//
// A server component reads the order to render it — no endpoint, no fetch.
// Two client leaves: the cancel button, and (Day 40) the status line, which
// keeps itself current by polling GET /api/orders/[id].
//
// Day 41: both halves together. The server renders the whole receipt with
// real data, then hands the same order to the client query as its first
// value — `initial`, used as SWR's fallbackData (useOrder.js). The poll picks
// up from there after hydration. Nobody ever sees a spinner for an order the
// server already had, and the HTML is complete for a crawler or with
// JavaScript off.
// Day 44: a title and a description for the person who has the tab open,
// and `noindex`: this page is one person's own, so it has no business in
// search results (lib/site.js). robots.js disallows it as well.
// A fixed title, not "Order 1001": the id comes from the URL, and a title
// built from it would also be shown on someone else's order number's 404.
//
// Day 47: the receipt is the tracking page (the slides' app/track/[id]).
// It already had everything a tracking page needs — the owner check, the
// proxy in front of it, the server-rendered order handed to the client as
// its first value — so the map and the live connection were added here
// rather than to a second route that would need the same protection again.
// Each client leaf is fed the same `initial`:
//
//   OrderStatus    the stage, and now the stream and its indicator
//   Tracking       the map (MapPanel, loaded in the browser only, ssr: false)
//                  beside DeliveryFacts, the same information in words
//
// The order view now carries `tracking` (lib/delivery.js): where the courier
// and the delivery point are. The live frames are the same object.
export const metadata = privatePage({
  title: "Order receipt",
  description: "Your Addis Eats order: what is in it, what it costs and how far along the kitchen is.",
});

export default async function ReceiptPage({ params }) {
  const { id } = await params;

  // The page's own check, while it renders: the proxy only saw that a
  // cookie was there. This one asks whether it is a live session.
  const user = await getSession();
  if (!user) {
    // Only digits go into the redirect: `id` is from the URL.
    redirect(`/login?next=/orders/${/^\d+$/.test(id) ? id : ""}`);
  }

  // Someone else's order and no order at all look the same from here: a 404.
  // A receipt has a name, a phone number and an address on it, and telling a
  // stranger "that one exists, but it is not yours" is already telling them
  // something. (cancelOrder, which has no page to hide behind, says 403.)
  //
  // Day 42: the query itself is scoped to the session's account. The id from
  // the URL only says which order to look for; getOrderFor(user.id, id)
  // cannot find one that is not theirs. Change the number in the address bar
  // to someone else's and the answer is this 404.
  const order = await getOrderFor(user.id, id);
  if (!order) {
    notFound();
  }

  // The same object GET /api/orders/[id] answers with, so the fallback and
  // the first poll have one shape.
  const initial = orderView(order);
  const { stage } = initial;

  return (
    <main className="prose prose--track">
      <h1>Order {order.id}</h1>
      {/* Day 40 needed key={stage} here, so the leaf would drop its own
          state when the server re-rendered. The state is SWR's cache now,
          and useOrder writes each new server answer into it. */}
      <OrderStatus orderId={order.id} initial={initial} />

      {/* Whether there is a map is decided in the browser, once (Tracking.jsx
          says why: a server decision made the map vanish on delivery). */}
      <Tracking orderId={order.id} initial={initial} />

      <p>
        {etb(order.total)} {order.status === "cancelled" ? "will not be" : "will be"}{" "}
        requested from TeleBirr {order.phone}. For {order.name} in {order.area},
        placed <time dateTime={order.placedAt}>{when(order.placedAt)}</time>.
      </p>

      <ul className="checkout__lines">
        {order.lines.map((line) => (
          <li key={line.id} className="checkout__line checkout__line--summary">
            <span className="checkout__name">
              {line.quantity} × <Link href={`/menu/${line.slug}`}>{line.name}</Link>
            </span>
            <span className="checkout__amount">{etb(line.price * line.quantity)}</span>
          </li>
        ))}
      </ul>

      {order.notes && <p>Note for the rider: &ldquo;{order.notes}&rdquo;</p>}

      {/* The button is shown only to the owner, on an order still in the
          kitchen (the first two minutes, lib/orderStage.js). Day 41: it hides
          itself as soon as the poll says otherwise. That is interface, not
          security: cancelOrder checks the
          session and the owner again, whatever this page did or did not
          render. */}
      {stage === "kitchen" && <CancelOrderButton orderId={order.id} initial={initial} />}
      {stage === "cancelled" && (
        <p className="state">
          Cancelled <time dateTime={order.cancelledAt}>{when(order.cancelledAt)}</time>.
        </p>
      )}

      <p>
        <Link className="cta" href="/menu">
          Order something else
        </Link>{" "}
        <Link href="/orders">All your orders</Link>
      </p>
    </main>
  );
}
