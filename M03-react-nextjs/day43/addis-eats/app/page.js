import Link from "next/link";
import CreditedPhoto from "@/components/CreditedPhoto";
import { readMenu } from "@/lib/menu";
import { heroPhoto } from "@/lib/photos";

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

export default async function HomePage() {
  const dishes = await readMenu();
  const specials = dishes.slice(0, 3);

  return (
    <main className="prose">
      <h2>Today at the kitchen</h2>

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
            <Link href={`/menu/${dish.slug}`}>
              {dish.name} · {dish.price} {dish.currency}
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
