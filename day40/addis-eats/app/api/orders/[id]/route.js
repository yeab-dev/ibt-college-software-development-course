import { apiError } from "@/lib/apiError";
import { orderStage, STAGE_LABEL } from "@/lib/orderStage";
import { getOrder, publicOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";

// GET /api/orders/1001 — one order and the stage it has reached.
//
//   200  the order, with `stage` and `stageLabel`
//   401  no session: signing in would fix it
//   403  signed in, but the order is someone else's: signing in again will not
//   404  no such order
//
// Day 40: the endpoint built because something needs it. The receipt's
// OrderStatus leaf polls it every few seconds — a client fetch, repeated,
// triggered by the browser, which is the one job in the slides' table that
// belongs to a client calling a handler. The receipt's first render does not
// use it: the page is a server component and reads the order directly.
//
// Dynamic (ƒ): it reads the session cookie, and the answer changes with the
// clock. Same checks as cancelOrder, in the same order. The page hides other
// people's receipts behind a 404; an endpoint has no page to hide behind and
// says 403, as cancelOrder does.
export async function GET(request, { params }) {
  const user = await getSession();
  if (!user) {
    return apiError(401, "Not signed in.");
  }

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return apiError(404, "No such order.");
  }
  if (order.userId !== user.phone) {
    return apiError(403, "That order is not yours.");
  }

  const stage = orderStage(order);
  return Response.json(
    { ...publicOrder(order), stage, stageLabel: STAGE_LABEL[stage] },
    // Never stored by the browser or anything between: a poll must hit the
    // server, and this body has a phone number in it.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
