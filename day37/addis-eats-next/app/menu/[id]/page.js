import Link from "next/link";
import { notFound } from "next/navigation";
import { getDish, getDishSlugs } from "@/lib/menu";
import AddToOrder from "./AddToOrder";

// "/menu/kitfo", "/menu/shiro", … — one file, thirteen dishes. The square
// brackets make the folder name a parameter: whatever sits in that part of the
// URL arrives as params.id.
//
// Since Next.js 15 `params` is a Promise, so the page is async and awaits it.
// The value is still a string — here a slug, never a number.

// Step 5. A dynamic segment, built statically.
//
// [id] does not have to mean "render on request". The build calls this once,
// gets every slug in data/menu.json, and prerenders one page per dish — the
// build output lists them under /menu/[id] and .next/server/app/menu/ holds
// thirteen .html files. They are then served like any other static file.
//
// A slug this did not list (a dish added after the build, or /menu/pizza) is
// still rendered on request — that is `dynamicParams`, true by default — and
// then cached. Setting `export const dynamicParams = false` would make every
// unlisted slug a 404 without running the page. It stays true here because
// /menu is regenerated hourly from the same file: a dish added in the
// afternoon appears in the list before the next build, and its link has to
// work.
export async function generateStaticParams() {
  const slugs = await getDishSlugs();
  return slugs.map((slug) => ({ id: slug }));
}

// The same window as the list. A dish page shows a price, and so does the menu;
// if the menu refreshed hourly and this page never did, the two would
// disagree. The build marks these pages ● (SSG) with a 1h revalidate.
export const revalidate = 3600;

export default async function DishPage({ params }) {
  const { id } = await params;
  const dish = await getDish(id);

  // Two kinds of missing, as on Day 31. A path nobody claimed — /menuu/kitfo —
  // never reaches this file; Next.js renders app/not-found.js by itself. This
  // path *is* claimed — /menu/pizza matches [id] perfectly — so only this page
  // can know there is no such dish. notFound() stops rendering here and shows
  // that same not-found.js. It is also why /menu/DishList is a 404: the
  // component file next door is not a route, so the URL lands here, as an id
  // with no dish.
  //
  // Day 36 noted a catch here: loading.js streamed the skeleton with a 200
  // before the page found there was no pizza, so the 404 could only arrive as
  // a "noindex" tag. Day 37 removed it without trying. An unlisted slug on an
  // ISR route is rendered to completion on the server — so the result can be
  // cached — before a byte is sent, and the status line is a real 404.
  if (!dish) notFound();

  return (
    <main className="detail">
      <p className="detail__crumb">
        <Link href="/menu">&larr; Menu</Link>
      </p>

      <h2>{dish.name}</h2>

      <p className="detail__price">
        {dish.price} {dish.currency}
      </p>

      <p className="detail__meta">
        {dish.category}
        {dish.spicy && " · 🌶️ Spicy"}
      </p>

      <p className="detail__note">{dish.description}</p>

      {/* Everything above is plain HTML from the server. Only the button
          needs the browser. */}
      <AddToOrder dish={dish} />
    </main>
  );
}
