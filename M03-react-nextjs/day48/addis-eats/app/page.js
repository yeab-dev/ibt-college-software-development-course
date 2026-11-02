import Link from "next/link";
import CreditedPhoto from "@/components/CreditedPhoto";
import { etb } from "@/lib/format";
import { readMenu } from "@/lib/menu";
import { heroPhoto } from "@/lib/photos";
import { absoluteUrl, publicPage, SITE_NAME } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

// "/" — the file is app/page.js, so the route is the app folder itself.
//
// On Vite, Home called useFetch and had three states to draw: loading, error
// and data. This is a server component: it is `async`, it awaits the menu
// before any HTML exists, and by the time the browser sees the page the
// specials are already in it. No loading flag, no effect, no empty first paint.
//
// Day 37: static, refreshed hourly. The story above the list never changes
// between builds and would be fine as plain static. The three specials,
// though, print prices from the same file as /menu — so the page takes the
// menu's window, and the home page can never quote a price the menu has
// already changed. The build still marks it ○.
export const revalidate = 3600;

// Day 44. No `title`: the root layout's template applies to child segments
// only, and this page sits in the root segment itself, so it gets the
// layout's default, "Addis Eats — food delivery in Addis Ababa". A title set
// here would be printed as it is, without the brand.
//
// The description is the sheet's "written for the person": what you can
// order, from where, and how you pay, in under 150 characters.
export const metadata = publicPage({
  description:
    "Order Doro Wat, Tibs and Kitfo from one kitchen in Addis Ababa, delivered hot to your door and paid with TeleBirr. See today's menu and prices.",
  path: "/",
});

export default async function HomePage() {
  const dishes = await readMenu();
  const specials = dishes.slice(0, 3);

  // Day 44: the deck's "Restaurant JSON-LD" for the home page. Only what is
  // true and on this site: no street address, phone number or opening hours,
  // because Addis Eats has not published any — structured data that
  // describes things the page does not show is the mistake the sheet warns
  // about.
  const restaurant = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: SITE_NAME,
    description: "Ethiopian dishes delivered across Addis Ababa.",
    url: absoluteUrl("/"),
    image: absoluteUrl(heroPhoto.src),
    servesCuisine: "Ethiopian",
    areaServed: { "@type": "City", name: "Addis Ababa" },
    currenciesAccepted: "ETB",
    hasMenu: absoluteUrl("/menu"),
  };

  return (
    <main className="prose">
      <JsonLd data={restaurant} />
      {/* Day 44: the page's one h1, and it names the page. */}
      <h1>Today at the Addis Eats kitchen</h1>

      {/* Day 43: the platter. .prose is 640px at most, or the page less its
          padding on a narrower screen. It is the largest thing above the
          fold and the LCP element, so it is this page's one preload: a
          <link rel="preload"> in the <head>, fetched before the browser has
          even reached the <img>, and never lazy. */}
      <CreditedPhoto
        photo={heroPhoto}
        sizes="(max-width: 690px) calc(100vw - 50px), 640px"
        preload
      />
      <p>
        Injera off the mitad, buna from the jebena, and a berbere pot that has
        been going since morning.
      </p>

      <ul className="specials">
        {specials.map((dish) => (
          <li key={dish.id}>
            {/* A dynamic route, linked to. The slug becomes the [id] segment
                that app/menu/[id]/page.js receives in its params. */}
            <Link className="tap" href={`/menu/${dish.slug}`}>
              {dish.name} · {etb(dish.price)}
            </Link>
          </li>
        ))}
      </ul>

      <p>
        <Link className="cta" href="/menu">
          See the full menu
        </Link>
      </p>
    </main>
  );
}
