import Link from "next/link";

// Day 40: "no such dish", inside the menu.
//
// /menu/not-a-dish matches app/menu/[id] perfectly, so the dish page runs,
// finds nothing and calls notFound(). Next.js renders the nearest
// not-found.js — and this one sits in the menu segment, so it renders inside
// app/menu/layout.js: the category sidebar stays, and the person is one click
// from a real dish. The status is still a 404.
//
// A path no folder claims at all (/some/bad/url) never reaches the menu, and
// gets the root app/not-found.js instead.
export default function DishNotFound() {
  return (
    <main className="menu">
      <h2>No such dish</h2>
      <p className="state">
        That dish is not on today&rsquo;s menu. Pick a category on the left, or{" "}
        <Link href="/menu">see every dish</Link>.
      </p>
    </main>
  );
}
