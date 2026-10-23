// The checkout's layout. It adds no markup — it exists for its one export.
//
// Step 5 of the exercise: "force the checkout dynamic". Exported from a layout,
// a segment option applies to every route below it, which is the tidiest way
// to say "everything under /checkout is rendered fresh, per request". If the
// checkout grows a /checkout/confirm page, it inherits this.
//
// The reads that require it are in app/checkout/page.js: the session, the
// returning customer and the basket are all cookies. The checkout greets a
// person by name and shows their own basket, so that HTML is different for
// every person who asks; it must never be built ahead of time or served from
// a cache — one customer would be shown another's order. Any one of those
// cookies() calls is already enough to make the route dynamic (the build
// showed ƒ before this line was added on Day 37); this export states the
// intent where the next person to edit the folder will see it, so the route
// stays dynamic even if those reads move into a helper.
export const dynamic = "force-dynamic";

export default function CheckoutLayout({ children }) {
  return children;
}
