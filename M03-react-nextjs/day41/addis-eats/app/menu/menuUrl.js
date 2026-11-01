// Day 41. The menu's address: /menu?category=Drink&q=wat&page=2.
//
// Three pieces of state are kept in it, by two owners: the category belongs
// to the layout (MenuFilterProvider), the search term and the page to the
// list (FilterShell). Each writes only its own keys and leaves the others as
// they are — on Day 40 the provider rewrote the whole query string, which
// would now wipe the search every time a category was picked.
//
// replaceState, not router.replace: the router would ask the server for
// /menu again just to filter a list the browser already holds, and typing a
// word should not cost a press of Back per letter. Next.js listens to the
// history API, so its own idea of the URL stays correct. The address is
// always the current result, so it can be copied and shared, and
// readMenuUrl() restores it on arrival.
//
// Browser only: both functions touch window, and are called from effects and
// event handlers, never during render.
import { isCategory } from "@/lib/categories";

export function readMenuUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const page = Number(params.get("page"));
  return {
    category: isCategory(category) ? category : "All",
    q: (params.get("q") ?? "").slice(0, 40),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

// `changes` maps a key to its new value; null, "" or a default removes it.
export function writeMenuUrl(changes) {
  if (window.location.pathname !== "/menu") return;
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(changes)) {
    const isDefault = value === null || value === "" || (key === "category" && value === "All") || (key === "page" && value === 1);
    if (isDefault) params.delete(key);
    else params.set(key, String(value));
  }
  // A fixed order, so the same state is always the same address.
  const ordered = new URLSearchParams();
  for (const key of ["category", "q", "page"]) {
    if (params.has(key)) ordered.set(key, params.get(key));
  }
  const query = ordered.size ? `?${ordered}` : "";
  if (window.location.search !== query) {
    window.history.replaceState(null, "", `/menu${query}`);
  }
}

// The address of one page of results, for the pager's links. Built the same
// way as the address bar, so "copy link" on Next gives what Next shows.
export function menuHref({ category, q, page }) {
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/menu?${params}` : "/menu";
}
