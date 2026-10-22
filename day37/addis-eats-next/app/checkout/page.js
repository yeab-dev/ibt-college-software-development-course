import { cookies } from "next/headers";
import Checkout from "./Checkout";
import { CUSTOMER_COOKIE, parseCustomerCookie } from "./customerCookie";

// "/checkout" — dynamic: rendered on the server for every request.
//
// The page has one job: find out who is asking, and hand that to the form.
// Field.jsx, validate.js, placeOrder.js and customerCookie.js sit beside this
// file; none of them is a route.
export default async function CheckoutPage() {
  // ↓ This is the line that makes /checkout dynamic.
  //
  // cookies() reads the incoming request, so there is no way to produce this
  // HTML at build time: it depends on who is asking. Next.js sees the call and
  // renders the route per request (ƒ in the build). It is a Promise since
  // Next.js 15, so it is awaited. app/checkout/layout.js also says
  // `dynamic = "force-dynamic"` — see the note there.
  const cookieStore = await cookies();
  const returning = parseCustomerCookie(cookieStore.get(CUSTOMER_COOKIE)?.value);

  // Day 36 also read ?fail=1 here, from the searchParams prop. That was a
  // second request-time read, and with two of them "which line makes this
  // dynamic?" has no single answer. The switch now lives in the form, which
  // reads it with useSearchParams — fine on a route that renders per request.
  return <Checkout returningCustomer={returning} />;
}
