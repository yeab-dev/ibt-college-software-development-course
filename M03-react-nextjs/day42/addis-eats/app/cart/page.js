import CartContents from "./CartContents";

// "/cart" — client rendering, in the Day 37 sense: the HTML is a static shell
// (○ in the build) and the basket is drawn in the browser, from localStorage.
//
// Day 38: the page is a server component again. On Days 36–37 this file began
// with "use client", which put the heading and the layout around the list into
// the bundle too. They need no browser, so they stay here; the one component
// that does — the list, which reads the store and handles clicks — carries the
// directive instead.
export default function CartPage() {
  return (
    <main className="prose">
      <h2>Your order</h2>
      <CartContents />
    </main>
  );
}
