// The checkout's layout. It adds no markup — it exists for its one export.
//
// Step 5 of the exercise: "force the checkout dynamic". Exported from a layout,
// a segment option applies to every route below it, which is the tidiest way
// to say "everything under /checkout is rendered fresh, per request". If the
// checkout grows a /checkout/confirm page, it inherits this.
//
// The read that requires it is in app/checkout/page.js:
//
//     const cookieStore = await cookies();
//
// The checkout greets a returning customer by the name in their own cookie.
// That HTML is different for every person who asks, so it must never be built
// ahead of time or served from a cache — one customer would be greeted with
// another's name. That cookies() call on its own is already enough to make
// the route dynamic (the build showed ƒ before this line was added); this
// export states the intent where the next person to edit the folder will see
// it, so the route stays dynamic even if that read moves into a helper or is
// briefly removed.
export const dynamic = "force-dynamic";

export default function CheckoutLayout({ children }) {
  return children;
}
