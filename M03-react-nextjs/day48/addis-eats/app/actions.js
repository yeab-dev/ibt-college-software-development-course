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
import { createAccount, findAccountByPhone } from "@/lib/accounts";
import { burnTime, PASSWORD_MAX, PASSWORD_MIN, verifyPassword } from "@/lib/password";
import { safeNext } from "@/lib/safeNext";
import { endSession, getSession, startSession } from "@/lib/session";
import { localNumber, NAME_MAX, phoneError, toOrderForm } from "@/lib/validate";
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
// Day 42: of the three layers (AUTH.md), this is the one that counts. The
// proxy only proved a cookie of the right shape was there, and only on the
// paths in its matcher; an action can be posted to any page. So every action
// that writes asks getSession() itself, and then asks whether *this* person
// may touch *this* record.
//
// The actions return plain objects, never thrown errors, for the failures a
// person can fix. In production Next.js replaces a thrown error's message
// with a generic one (it might contain a secret), so "Not yours" would arrive
// as "An error occurred". A returned { error } arrives as written, in the
// state useActionState hands back to the form.

// ---- signing in, signing up, signing out --------------------------------------

// Steps 1 to 3 of the slides' six: the person posts a phone number and a
// password, the server checks them against the stored hash, and a new
// session is set as a cookie. Then back to where they were going.
//
// One answer for every way it can fail — unknown number or wrong password —
// so the form cannot be used to find out which numbers have accounts. The
// unknown number still spends the time a real check would (burnTime), so
// the clock does not tell either.
const NO_MATCH = "That phone number and password do not match an account.";

export async function signIn(previousState, formData) {
  const phone = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  // `next` came from the URL, through a hidden field: anyone can set it.
  // safeNext() keeps it on this site (lib/safeNext.js, attack 3).
  const next = safeNext(formData.get("next"));

  const fieldErrors = {};
  const phoneProblem = phoneError(phone);
  if (phoneProblem) fieldErrors.phone = phoneProblem;
  if (!password) fieldErrors.password = "Enter your password";
  if (Object.keys(fieldErrors).length > 0) {
    // The password is never sent back: the field starts empty again.
    return { fieldErrors, values: { phone } };
  }

  // Step 2: check them against the stored hash.
  const account = await findAccountByPhone(localNumber(phone));
  const attempt = password.slice(0, PASSWORD_MAX);
  let ok = false;
  if (account) {
    ok = await verifyPassword(attempt, account.passwordHash);
  } else {
    await burnTime(attempt);
  }
  if (!ok) {
    return { error: NO_MATCH, values: { phone } };
  }

  await startSession(account.id);
  // redirect() throws on purpose — it is how Next.js ends an action with a
  // navigation — so it is never inside a try/catch, and nothing runs after it.
  redirect(next);
}

// A new customer: a name, a phone number nobody has used, a password. The
// role is always "customer" (lib/accounts.js): there is no field for it,
// and a field added to the form would be ignored.
export async function signUp(previousState, formData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const values = { name, phone };

  const fieldErrors = {};
  if (!name) fieldErrors.name = "We need a name for your deliveries";
  else if (name.length > NAME_MAX) fieldErrors.name = `Keep the name under ${NAME_MAX} characters`;
  const phoneProblem = phoneError(phone);
  if (phoneProblem) fieldErrors.phone = phoneProblem;
  if (password.length < PASSWORD_MIN) fieldErrors.password = `Use at least ${PASSWORD_MIN} characters`;
  else if (password.length > PASSWORD_MAX) fieldErrors.password = `Use at most ${PASSWORD_MAX} characters`;
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  const result = await createAccount({ name, phone: localNumber(phone), password });
  if (!result.ok) {
    // This does say the number has an account. Sign-up cannot avoid it
    // without email or SMS confirmation, which Addis Eats does not have.
    return { fieldErrors: { phone: "An account already uses this number — sign in instead" }, values };
  }

  await startSession(result.account.id);
  redirect(next);
}

// Step 6: the session row is deleted and the cookie cleared (lib/session.js).
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
    // The owner is the session's account, never a field: there is no field
    // for it, and one added to the form would not be read.
    userId: user.id,
    fail: formData.get("fail") === "1",
    // Day 48: the hidden field the checkout page filled with a fresh random
    // key. A second request with the same key (a double tap, or a form
    // posted twice with JavaScript off) gets the first one's order back
    // instead of placing another (lib/orders.js).
    key: formData.get("idempotencyKey"),
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

  // Day 39–41: /orders was the static kitchen board, rebuilt by this call.
  // Day 42 made it the person's own list and moved the board to /kitchen;
  // both read the session, so both are dynamic and rendered fresh anyway.
  // The call stays so the client router's cached copies are dropped too.
  revalidatePath("/orders");
  revalidatePath("/kitchen");

  // Post/redirect/get: the receipt has its own URL, and pressing refresh on
  // it re-reads the order rather than posting it again. A replayed key
  // (result.replayed) lands on the same receipt as the request that placed
  // the order: from the browser's side, the two taps had one answer.
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

  // The check that matters: authorisation, after authentication. The
  // record's owner, compared with the session — or the staff role, which the
  // kitchen board uses to refuse an order. Not "is there a session", and not
  // "did the page show them a button". Both facts come from the server: the
  // owner from the order file, the role from the account the session points
  // at.
  const isOwner = order.userId === user.id;
  const isStaff = user.role === "staff";
  if (!isOwner && !isStaff) {
    console.warn(`cancelOrder refused: ${user.id} asked to cancel order ${order.id}, which is not theirs`);
    return { ok: false, status: 403, error: "That order is not yours." };
  }

  // Day 40: only while it is still in the kitchen. Once the rider has it,
  // there is nothing left to cancel.
  const stage = orderStage(order);
  if (stage !== "kitchen") {
    return { ok: false, status: 409, error: `Order ${order.id} is already ${STAGE_LABEL[stage].toLowerCase()}.` };
  }

  await markCancelled(order.id);
  // The owner's receipt and order list, and the kitchen board. All three are
  // dynamic now; this re-renders whichever one the action was posted from.
  revalidatePath("/orders");
  revalidatePath("/kitchen");
  return { ok: true, message: `Order ${order.id} is cancelled. Nothing will be charged.` };
}
