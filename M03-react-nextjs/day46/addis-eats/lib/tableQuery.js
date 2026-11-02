import { SORTS } from "./orders";

// Day 46. A table's state lives in its address:
//
//   /orders?sort=total&dir=desc&page=3
//
// so it can be shared, bookmarked and refreshed, the back button walks
// through it, and the table stays a server component — sorting in the
// browser would mean shipping every row and the code to sort them.
//
// Everything in a query string is user input. readTableQuery() turns it into
// something the store can use, or the default: an unknown column, a
// direction that is not asc/desc, ?page=-2 or ?page=abc all fall back
// quietly. It never throws: a mangled link should still show a table.
//
// Server only in practice (pages and server components call it), but there
// is nothing secret in it.

const DEFAULT_SORT = "date";

function one(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function readTableQuery(searchParams) {
  const sort = Object.hasOwn(SORTS, one(searchParams.sort)) ? one(searchParams.sort) : DEFAULT_SORT;
  const dir = ["asc", "desc"].includes(one(searchParams.dir)) ? one(searchParams.dir) : SORTS[sort];
  const page = Number(one(searchParams.page));
  return { sort, dir, page: Number.isInteger(page) && page >= 1 ? page : 1 };
}

// The address of one state of the table. Defaults are left out, and the keys
// always come in the same order, so one state has exactly one address.
export function tableHref(path, { sort, dir, page }) {
  const params = new URLSearchParams();
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  if (dir !== SORTS[sort]) params.set("dir", dir);
  if (page > 1) params.set("page", String(page));
  return params.size ? `${path}?${params}` : path;
}
