"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BASKET_COOKIE,
  BASKET_COOKIE_OPTIONS,
  parseBasket,
} from "@/cart/basketCookie";
import { orderStage, STAGE_LABEL } from "@/lib/orderStage";
import { createOrder, getOrder, markCancelled } from "@/lib/orders";
import { endSession, getSession, safeNext, startSession } from "@/lib/session";
import { localNumber, phoneError, toOrderForm } from "@/lib/validate";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_COOKIE_OPTIONS,
  customerCookieValue,
} from "./checkout/customerCookie";

// Day 39. Every server action in Addis Eats, in one file.
//
// "use server" at the top marks every export as a function that only ever
// runs on the server, however it is called. A client component may import
// one and call it — the one kind of function that crosses the boundary Day 38
// drew — but what the browser receives is a reference: an encrypted action id
// and a little code that POSTs to it. The bodies below never reach the bundle.
//
// That POST is a real HTTP endpoint, and anyone can send it, with any
// arguments, without the form. So each action checks for itself, every time:
// who is asking (the session cookie, not a field), and whether what they sent
// is acceptable (the Day 33 rules, through lib/orders.js). Hiding a button is
// interface; these checks are the security.
//
// The actions return plain objects, never thrown errors, for the failures a
// person can fix. In production Next.js replaces a thrown error's message
// with a generic one (it might contain a secret), so "Not yours" would arrive
// as "An error occurred". A returned { error } arrives as written, in the
// state useActionState hands back to the form.

// ---- signing in (the stand-in session) --------------------------------------

export async function signIn(previousState, formData) {
  const phone = String(formData.get("phone") ?? "");
  const next = safeNext(formData.get("next"));

  const error = phoneError(phone);
  if (error) {
    return { fieldErrors: { phone: error }, values: { phone } };
  }

  await startSession(localNumber(phone));
  // redirect() throws on purpose — it is how Next.js ends an action with a
  // navigation — so it is never inside a try/catch, and nothing runs after it.
  redirect(next);
}

export async function signOut() {
  await endSession();
  redirect("/");
}

// ---- placing an order ---------------------------------------------------------

// Step 5. The same submission as POST /api/orders, without the fetch.
//
// Called by the checkout form through useActionState, so it receives the
// previous state first and the FormData second. With JavaScript on, React
// sends that FormData for us; with it off, the browser posts the form itself
// and Next.js calls this function with the same arguments. Either way the
// result is the next state of the form.
export async function placeOrder(previousState, formData) {
  // Handed back on every failure, so the fields can be refilled — even when
  // the page was re-rendered on the server because JavaScript was off.
  const values = toOrderForm((key) => formData.get(key));
  // Which answer this is. Checkout uses it to re-mount the area <select>
  // after each one (see the note there).
  const attempt = (Number(previousState?.attempt) || 0) + 1;

  // Check 1: who is asking. The page guards /checkout too, but the page is
  // not the door — this function is. Its id is in the page's HTML.
  const user = await getSession();
  if (!user) {
    return {
      error: "You are not signed in any more. Sign in again — your details are still here.",
      values,
      attempt,
    };
  }

  // The basket comes from the cookie the browser keeps in step with its cart
  // (cart/basketCookie.js), not from a form field: there is no field for it.
  const cookieStore = await cookies();
  const items = parseBasket(cookieStore.get(BASKET_COOKIE)?.value);

  // Check 2: what they sent. The same lib/orders.js the route handler calls,
  // so the same Day 33 rules, the same prices from the menu, the same 422s.
  const result = await createOrder({
    get: (key) => formData.get(key),
    items,
    userId: user.phone,
    fail: formData.get("fail") === "1",
  });

  if (!result.ok) {
    return {
      error: result.status === 422 ? "Some details need fixing." : result.error,
      fieldErrors: result.fieldErrors ?? {},
      values,
      attempt,
    };
  }

  // Remember the name and area for next time (Day 37's cookie, now written
  // here), and empty the server's copy of the basket. The browser's cart sees
  // the empty cookie and clears itself (app/providers.jsx).
  cookieStore.set(CUSTOMER_COOKIE, customerCookieValue(result.order), CUSTOMER_COOKIE_OPTIONS);
  cookieStore.set(BASKET_COOKIE, "", BASKET_COOKIE_OPTIONS);

  // Step 6. /orders is a static page, built once. It does not know about this
  // order, and it will not find out by itself: nothing about it expires.
  // This tells Next.js it is wrong now, so the next visit regenerates it.
  revalidatePath("/orders");

  // Post/redirect/get: the receipt has its own URL, and pressing refresh on
  // it re-reads the order rather than posting it again.
  redirect(`/orders/${result.order.id}`);
}

// ---- cancelling -------------------------------------------------------------

// Step 7. Bound to an order id by the receipt's button:
//
//     cancelOrder.bind(null, order.id)
//
// That id is in the page's HTML and in the request. It is a claim, not a
// fact — anyone can send this action any id they like (the README shows it
// being done from the console). So the id is only where to look; whether
// this person may touch that order is decided here, from the session and the
// record, before anything is written.
export async function cancelOrder(orderId) {
  const user = await getSession();
  if (!user) {
    return { ok: false, status: 401, error: "Not signed in." };
  }

  const order = await getOrder(orderId);
  if (!order) {
    return { ok: false, status: 404, error: "No such order." };
  }

  // The check that matters: the record's owner, compared with the session.
  // Not "is there a session", and not "did the page show them a button".
  if (order.userId !== user.phone) {
    console.warn(`cancelOrder refused: ${user.name} asked to cancel order ${order.id}, which is not theirs`);
    return { ok: false, status: 403, error: "That order is not yours." };
  }

  // Day 40: only while it is still in the kitchen. Once the rider has it,
  // there is nothing left to cancel.
  const stage = orderStage(order);
  if (stage !== "kitchen") {
    return { ok: false, status: 409, error: `Order ${order.id} is already ${STAGE_LABEL[stage].toLowerCase()}.` };
  }

  await markCancelled(order.id);
  revalidatePath("/orders");
  return { ok: true, message: `Order ${order.id} is cancelled. Nothing will be charged.` };
}
