import { getMenu } from "@/lib/menu";
import MenuBrowser from "./MenuBrowser";

// "/menu". This folder also holds DishList.jsx, Dish.jsx, CategoryBar.jsx,
// SearchBar.jsx and MenuBrowser.jsx — and none of them is a route. Only a file
// called page.js is reachable from a URL, so /menu/DishList is a 404 (it falls
// to [id], finds no dish of that name, and calls notFound()).
//
// What changed from Day 33's Menu.jsx is where the waiting happens. That
// component fetched in an effect and passed isLoading and error down to
// DishList. Here the page awaits the data on the server. While it waits,
// Next.js shows loading.js; if the read throws, it shows error.js. Both are
// wired by their file names — there is no <Suspense> or <ErrorBoundary> in
// sight.
//
// searchParams arrives as a prop, like params on the dish page. In Next.js 15+
// it is a Promise, so an async page awaits it.
export default async function MenuPage({ searchParams }) {
  const { fail } = await searchParams;

  // /menu?fail=1 is the deliberate throw. The old checkbox flipped a piece of
  // state; now it is a link to this address (see MenuBrowser), and the throw
  // happens inside getMenu, on the server.
  const dishes = await getMenu({ fail: fail === "1" });

  return (
    <main className="menu">
      <h2>The menu</h2>
      <MenuBrowser dishes={dishes} />
    </main>
  );
}
