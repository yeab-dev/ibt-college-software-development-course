import Link from "next/link";
import { notFound } from "next/navigation";
import { etb } from "@/lib/format";
import { getDish, getDishSlugs } from "@/lib/menu";
import CreditedPhoto from "@/components/CreditedPhoto";
import JsonLd from "@/components/JsonLd";
import { dishPhoto } from "@/lib/photos";
import { absoluteUrl, publicPage } from "@/lib/site";
import AddToCartButton from "../AddToCartButton";

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

// Day 44: the dish's own title and description, from the dish record.
//
// The function receives the same `params` as the page and asks for the same
// dish. That is one 900 ms wait and one file read, not two, because getDish
// is wrapped in React's cache (lib/menu.js says why the slides' "the
// framework dedupes it" needed that help here). On a prerendered dish page
// this runs at build time, and the tags are in the static HTML's <head>.
//
// Thirteen dishes, thirteen descriptions: name, price and the menu's own
// sentence about it. The same description on every dish page would tell a
// crawler they are duplicates. The price is printed exactly as the page
// prints it ("ETB 260", Day 47: through lib/format.js), from the same fields.
//
// No image here: app/menu/[id]/opengraph-image.js, next to this file, is
// found by its name and generates one picture per dish.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const dish = await getDish(id);
  // The page will call notFound(), which also adds a noindex tag.
  if (!dish) return { title: "Dish not found" };

  return publicPage({
    title: dish.name,
    description: `${dish.name}, ${etb(dish.price)}. ${dish.description} Delivered across Addis Ababa.`,
    path: `/menu/${dish.slug}`,
  });
}

// Day 44: what a search engine reads as "this page is a menu item, and this
// is its price". Built from the very object the page renders below — not
// typed in, not looked up again — so the name and the price in it cannot
// disagree with the ones on screen. A structured-data price the page does not
// show is the sheet's "treated as deception".
function menuItemJsonLd(dish, photo) {
  const url = absoluteUrl(`/menu/${dish.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: dish.name,
    description: dish.description,
    url,
    ...(photo && { image: absoluteUrl(photo.src) }),
    offers: {
      "@type": "Offer",
      price: dish.price,
      priceCurrency: dish.currency,
      url,
    },
  };
}

// Day 38: an async server component, and the whole data layer of the page.
// It awaits the dish directly — no hook, no effect, no loading flag. The wait
// is paid by the build (Day 45 removed the menu's loading.js, which covered it
// in `npm run dev`; PERF.md), a throw is caught by error.js, and "no such dish" by
// notFound(): the three states Day 29 kept by hand, now held by the framework.
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
  const photo = dishPhoto(dish.slug);

  return (
    <main className="detail">
      <JsonLd data={menuItemJsonLd(dish, photo)} />

      <p className="detail__crumb">
        <Link href="/menu">&larr; Menu</Link>
      </p>

      {/* Day 44: the page's one h1, the dish's name. */}
      <h1>{dish.name}</h1>

      {/* Day 43: the dish's photograph, the largest thing on the page. The
          column is .detail's 640px, or the page less its padding on a
          phone, or less the sidebar too between 761 and 921px. The page's
          one preloaded image: it is the LCP element. */}
      {photo && (
        <CreditedPhoto
          photo={photo}
          sizes="(max-width: 690px) calc(100vw - 50px), (min-width: 761px) and (max-width: 921px) calc(100vw - 282px), 640px"
          preload
        />
      )}

      <p className="detail__price">{etb(dish.price)}</p>

      <p className="detail__meta">
        {dish.category}
        {dish.spicy && " · 🌶️ Spicy"}
      </p>

      <p className="detail__note">{dish.description}</p>

      {/* Everything above is plain HTML from the server. Only the button
          needs the browser — the same leaf the menu's cards use. */}
      <div className="dish__foot detail__order">
        <AddToCartButton dish={dish} label="Add to order" />
      </div>
    </main>
  );
}
