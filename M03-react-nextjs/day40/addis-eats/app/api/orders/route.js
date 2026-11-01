import { revalidatePath } from "next/cache";
import { apiError } from "@/lib/apiError";
import { createOrder, publicOrder } from "@/lib/orders";

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
// An order placed here belongs to nobody (userId null): an outside caller has
// no Addis Eats session, so no browser can cancel it. A real API would
// authenticate its callers; that is Day 42.
//
// Never cached: route handlers only ever cache GET, and this file exports
// only POST.
export async function POST(request) {
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
    fail: request.nextUrl.searchParams.get("fail") === "1",
  });

  if (!result.ok) {
    return apiError(result.status, result.error, result.fieldErrors);
  }

  // The kitchen board is a static page; it has just become wrong. From a
  // route handler this marks it, and the next visit to /orders regenerates.
  revalidatePath("/orders");

  return Response.json(publicOrder(result.order), { status: 201 });
}
