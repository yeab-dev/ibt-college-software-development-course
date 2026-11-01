import { apiError } from "@/lib/apiError";
import { isCategory } from "@/lib/categories";
import { readMenu } from "@/lib/menu";

// GET /api/dishes            → 200, every dish
// GET /api/dishes?category=Drink → 200, that category's dishes (maybe [])
// GET /api/dishes?category=Pizza → 400, not a category
//
// The same folder-as-URL rule as the pages: app/api/dishes/route.js answers
// /api/dishes. A folder holds page.js or route.js, never both, which is why
// every endpoint lives under app/api/ and no page does.
//
// Who calls it? None of Addis Eats' own pages. /menu is a server component
// and reads lib/menu.js directly — fetching our own endpoint from our own
// server would be a network hop to reach a function we can import. This is
// for callers outside the UI: a mobile app, a partner's listing, curl.
//
// Dynamic (ƒ in the build): it reads the query string, and a handler that
// reads request.url cannot be prerendered — the answer depends on the
// request. readMenu() is the no-delay read, so each request costs one small
// file read; caching it would buy nothing worth a stale-menu surprise.
export async function GET(request) {
  const category = request.nextUrl.searchParams.get("category");

  // The query string is user input. A typo gets a 400 that says so, not an
  // empty 200 that looks like "nothing in that category today".
  if (category !== null && (!isCategory(category) || category === "All")) {
    return apiError(400, `Unknown category "${category}". Use Main, Side, Drink or Dessert.`);
  }

  const dishes = await readMenu();
  return Response.json(category ? dishes.filter((d) => d.category === category) : dishes);
}
