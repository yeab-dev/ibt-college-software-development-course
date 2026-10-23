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

  return <Checkout user={user} returningCustomer={returning} basket={basket} />;
}
