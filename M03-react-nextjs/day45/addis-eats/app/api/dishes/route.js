import { apiError } from "@/lib/apiError";
import { isCategory } from "@/lib/categories";
import { QUERY_MAX, readMenu, searchDishes } from "@/lib/menu";

// GET /api/dishes                        → 200, page 1 of every dish
// GET /api/dishes?q=beef                 → 200, the dishes whose name or description says "beef"
// GET /api/dishes?q=on&page=2            → 200, the second page of those
// GET /api/dishes?category=Drink         → 200, that category's dishes (maybe none)
// GET /api/dishes?category=Pizza         → 400, not a category
// GET /api/dishes?page=0 (or ?page=two)  → 400, not a page number
//
// Every 200 has one shape, a page:
//
//   { "dishes": […], "page": 2, "pages": 3, "pageSize": 4, "total": 9 }
//
// A page past the end is a 200 with no dishes and the real `pages`, so a
// stale link (the menu shrank) can say "there are only 2 pages" instead of
// failing.
//
// The same folder-as-URL rule as the pages: app/api/dishes/route.js answers
// /api/dishes. A folder holds page.js or route.js, never both, which is why
// every endpoint lives under app/api/ and no page does.
//
// Who calls it? Day 40's honest answer was "nobody in this application":
// /menu is a server component and reads lib/menu.js directly. Day 41 changes
// that. The menu's search box (app/menu/SearchBox.jsx) is typed into, so its
// answers can only be fetched by the browser, as the person types — and this
// is what it asks, through SWR. The list on arrival is still the server's.
//
// Dynamic (ƒ in the build): it reads the query string, and a handler that
// reads request.url cannot be prerendered — the answer depends on the
// request. readMenu() is the no-delay read, so each request costs one small
// file read. The browser keeps the answers in SWR's cache, by key, so a term
// typed twice is asked for once.
export async function GET(request) {
  const params = request.nextUrl.searchParams;

  // The query string is user input. A typo gets a 400 that says so, not an
  // empty 200 that looks like "nothing in that category today".
  const category = params.get("category");
  if (category !== null && (!isCategory(category) || category === "All")) {
    return apiError(400, `Unknown category "${category}". Use Main, Side, Drink or Dessert.`);
  }

  const q = params.get("q") ?? "";
  if (q.length > QUERY_MAX) {
    return apiError(400, `Search for at most ${QUERY_MAX} characters.`);
  }

  const rawPage = params.get("page");
  const page = rawPage === null ? 1 : Number(rawPage);
  if (!Number.isInteger(page) || page < 1 || page > 999) {
    return apiError(400, `"page" must be a whole number from 1, not "${rawPage}".`);
  }

  const dishes = await readMenu();
  return Response.json(searchDishes(dishes, { q, category, page }));
}
