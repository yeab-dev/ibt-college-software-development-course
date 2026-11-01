import { revalidatePath } from "next/cache";
import { apiError } from "@/lib/apiError";
import { createOrder, publicOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";

// POST /api/orders — the endpoint Day 33's checkout imagined, now real.
//
//   201  Created: the new order
//   400  The request itself is malformed: not JSON, or not a JSON object
//   422  Well-formed, but the values failed validation: fieldErrors say which
//   503  ?fail=1 — the kitchen is offline (Day 33's failure path)
//   405  Any other method (Next.js answers that itself: only POST is exported)
//
// Body: { name, phone, area, notes, items: [{ id, quantity }] }. Only ids and
// quantities — the price of every line is looked up on the server.
//
// Anyone can post to this. A student can send it with curl and no form at
// all, so every rule that matters — the TeleBirr pattern, the area, the
// prices, a non-empty basket — is enforced in lib/orders.js, here, or not at
// all. The checkout form's own validation is only a courtesy.
//
// Day 42: it authenticates its callers. Until today an order posted here
// belonged to nobody, and nobody could ever see or cancel it. Now it needs
// the same session as the checkout (401 without one), and the order belongs
// to the session's account — never to an id in the body. A mobile app would
// sign in first and send the cookie, exactly as curl does in the README.
//
//   401  Not signed in (no session, a forged cookie, a signed-out one)
//
// Never cached: route handlers only ever cache GET, and this file exports
// only POST.
export async function POST(request) {
  // Who is asking, before anything else is read. The proxy does not cover
  // /api at all; this line is the whole of this endpoint's authentication.
  const user = await getSession();
  if (!user) {
    return apiError(401, "Not signed in.");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "The body must be JSON.");
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return apiError(400, "The body must be a JSON object.");
  }

  const result = await createOrder({
    get: (key) => body[key],
    items: body.items,
    userId: user.id,
    fail: request.nextUrl.searchParams.get("fail") === "1",
  });

  if (!result.ok) {
    return apiError(result.status, result.error, result.fieldErrors);
  }

  // The person's list and the kitchen board render per request (Day 42), so
  // this only drops any copy a router has cached.
  revalidatePath("/orders");
  revalidatePath("/kitchen");

  return Response.json(publicOrder(result.order), { status: 201 });
}
