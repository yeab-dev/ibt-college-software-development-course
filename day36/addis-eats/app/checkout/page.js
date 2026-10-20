import Checkout from "./Checkout";

// "/checkout". The page itself is a server component with one job: read the
// query string and hand the answer to the form.
//
// Day 33's Checkout called useSearchParams() for ?fail=1. A page receives
// searchParams as a prop instead — a Promise since Next.js 15 — so the switch
// is read here and passed down as a plain boolean. Field.jsx, validate.js and
// placeOrder.js sit beside this file; none of them is a route.
export default async function CheckoutPage({ searchParams }) {
  const { fail } = await searchParams;

  return <Checkout simulateFailure={fail === "1"} />;
}
