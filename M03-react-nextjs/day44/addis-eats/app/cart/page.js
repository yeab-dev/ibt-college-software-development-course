import CartContents from "./CartContents";
import { privatePage } from "@/lib/site";

// "/cart" — client rendering, in the Day 37 sense: the HTML is a static shell
// (○ in the build) and the basket is drawn in the browser, from localStorage.
//
// Day 38: the page is a server component again. On Days 36–37 this file began
// with "use client", which put the heading and the layout around the list into
// the bundle too. They need no browser, so they stay here; the one component
// that does — the list, which reads the store and handles clicks — carries the
// directive instead.
// Day 44: a title and a description for the person who has the tab open,
// and `noindex`: this page is one person's own, so it has no business in
// search results (lib/site.js). robots.js disallows it as well.
export const metadata = privatePage({
  title: "Your order",
  description: "The dishes in your basket, with the total in birr, before you check out.",
});

export default function CartPage() {
  return (
    <main className="prose">
      <h1>Your order</h1>
      <CartContents />
    </main>
  );
}
