import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BASKET_COOKIE, parseBasket } from "@/cart/basketCookie";
import { priceBasket } from "@/lib/orders";
import { getSession } from "@/lib/session";
import Checkout from "./Checkout";
import { CUSTOMER_COOKIE, parseCustomerCookie } from "./customerCookie";

// "/checkout" — dynamic: rendered on the server for every request.
//
// The page finds out who is asking and what they are buying, and hands both
// to the form. Every read below is a cookie, so there is no way to produce
// this HTML at build time — ƒ in the build, and app/checkout/layout.js says
// `dynamic = "force-dynamic"` as well (see the note there).
export default async function CheckoutPage() {
  // Day 31's guard, on the server now. RequireAuth redirected in the browser
  // after a 400 ms "Checking your session…"; this redirect happens before a
  // byte of the checkout is sent, so there is no loading state to get wrong.
  //
  // It is still not the security. It stops someone *browsing* to the
  // checkout signed out; it does nothing about someone *posting* an order.
  // placeOrder checks the session again for exactly that reason.
  //
  // Day 42: the second of three layers. proxy.js has already redirected a
  // visitor with no session cookie, before this file ran. This check catches
  // the cookie that is there but is not a session (forged, signed out,
  // expired), and gives the page the person it is for.
  const user = await getSession();
  if (!user) {
    redirect("/login?next=/checkout");
  }

  const cookieStore = await cookies();
  const returning = parseCustomerCookie(cookieStore.get(CUSTOMER_COOKIE)?.value);

  // Day 39: the basket, from the cookie the browser keeps in step with its
  // cart (cart/basketCookie.js), priced from the menu on the server. Until
  // today Checkout read the cart store, which only exists once JavaScript has
  // run; now the lines are in the first HTML, with or without it.
  const basket = await priceBasket(parseBasket(cookieStore.get(BASKET_COOKIE)?.value));

  // Only what the form shows crosses to the browser: not the account id, not
  // the role.
  //
  // Day 48: plus a fresh idempotency key for this one checkout. It travels
  // in a hidden field, so every copy of the request this form sends — a
  // double tap, a second post with JavaScript off — carries the same key,
  // and placeOrder places one order for it (lib/orders.js). Rendered here,
  // on the server, so it is in the HTML before any JavaScript runs.
  return (
    <Checkout
      user={{ name: user.name, phone: user.phone }}
      returningCustomer={returning}
      basket={basket}
      orderKey={randomUUID()}
    />
  );
}
