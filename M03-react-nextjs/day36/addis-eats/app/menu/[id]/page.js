import Link from "next/link";
import { notFound } from "next/navigation";
import { getDish } from "@/lib/menu";
import AddToOrder from "./AddToOrder";

// "/menu/kitfo", "/menu/shiro", … — one file, thirteen dishes. The square
// brackets make the folder name a parameter: whatever sits in that part of the
// URL arrives as params.id.
//
// On Day 31 this screen called useParams(). Here the framework passes params
// in as a prop, which is what lets the page run on the server, where hooks do
// not exist. Since Next.js 15 that prop is a Promise, so the page is async and
// awaits it. The value is still a string, exactly as before — here a slug,
// never a number.
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
  // One catch: loading.js has already streamed the skeleton with a 200 status
  // while getDish() was waiting, so this 404 arrives as the not-found screen
  // plus a "noindex" tag rather than as a 404 status line. See not-found.js.
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
