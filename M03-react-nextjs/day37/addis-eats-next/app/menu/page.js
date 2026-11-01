import { Suspense } from "react";
import { getMenu } from "@/lib/menu";
import DishSkeleton from "./DishSkeleton";
import MenuBrowser from "./MenuBrowser";

// "/menu" — Incremental Static Regeneration, one hour.
//
// Step 4. This page is built once by `npm run build` and served as a file to
// every visitor. After an hour the next visitor still gets that file,
// instantly, and Next.js re-renders the page behind them; the visitor after
// that gets the fresh one. Nobody ever waits for the menu read.
//
// Why an hour: the dishes and their prices change a few times a day, when the
// kitchen edits the menu — not per visitor, and not by the minute. A price an
// hour out of date is acceptable on a menu; it would not be during a flash
// promotion, which would need a shorter window or an on-demand revalidation.
//
// The value must be a literal: Next.js reads it from the source at build
// time, so `60 * 60` would be rejected.
export const revalidate = 3600;

// Day 36's page read `searchParams` for ?fail=1, and that one read made the
// route dynamic (ƒ in the build). It reads nothing from the request now, which
// is what lets the build mark it ○ static. The category filter runs in the
// browser, on data the page already sent.
export default function MenuPage() {
  return (
    <main className="menu">
      <h2>The menu</h2>

      {/* Step 6. Stream the slow part, not the whole page.

          MenuPage itself awaits nothing, so the layout's sidebar and this
          heading are ready at once. Only DishList waits — 900 ms in
          getMenu() — so only DishList is behind a boundary. The server sends
          the shell and this fallback straight away and streams the dishes
          into the same response when they are ready.

          loading.js could not do this: it wraps the *whole* page, so the
          heading would wait too. On a production build the wait happens at
          build time (see revalidate above), and the HTML arrives complete; in
          `npm run dev`, which renders every request, you can watch the
          skeleton come first. */}
      <Suspense fallback={<DishSkeleton />}>
        <Dishes />
      </Suspense>
    </main>
  );
}

// The slow part, in its own async server component so a Suspense boundary
// can be put around exactly it. It ends where the browser begins: MenuBrowser
// is a client component and receives the dishes as a plain array.
async function Dishes() {
  const dishes = await getMenu();
  return <MenuBrowser dishes={dishes} />;
}
