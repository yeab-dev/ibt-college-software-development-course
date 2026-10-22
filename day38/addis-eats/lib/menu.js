// Day 38: the guard rail. If a "use client" file ever imports this module, the
// build fails with an error naming the import chain, instead of shipping a
// file-reading module to the browser. Next.js provides the package itself.
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// The menu, read straight from disk.
//
// On Vite this was mock/menuApi.js: a pretend backend living inside the dev
// server, so the browser could fetch("/api/menu"). Next.js has no such plugin —
// and does not need one. Pages here are server components: they run on the
// server, so they can open a file themselves and hand the finished HTML to the
// browser. No endpoint, no useFetch, no loading flag in the component.
//
// Only server components import this file. It uses node:fs, which does not
// exist in a browser, so a "use client" file importing it would fail to build —
// a useful alarm rather than a silent bug.

const MENU_FILE = path.join(process.cwd(), "data", "menu.json");

// Same delay the Vite mock used. A file read finishes in a millisecond, and a
// loading state that is never on screen cannot be checked. 900 ms is long
// enough to see app/menu/loading.js without throttling anything.
const DELAY_MS = 900;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The raw read, no delay. The home page uses this: it sits outside the menu
// segment, has no loading.js of its own, and should not keep anyone waiting.
export async function readMenu() {
  return JSON.parse(await readFile(MENU_FILE, "utf8"));
}

// The whole menu, slowly. The page awaits this inside a <Suspense> boundary,
// so the 900 ms is spent behind the dish skeleton while the menu layout's
// sidebar is already on screen.
//
// Day 37: on a production build this wait happens once, at build time — and
// again in the background at most once an hour (app/menu/page.js exports
// `revalidate = 3600`). Visitors are served the finished HTML and never sit
// through it. `npm run dev` renders every request, so that is where you watch
// the skeleton stream in.
//
// Day 36's `fail` switch is gone from here. Reading ?fail=1 meant reading the
// query string on the server, and that alone makes a route dynamic — the
// opposite of what /menu is now. The broken kitchen is simulated in the
// browser instead (see MenuBrowser.jsx).
export async function getMenu() {
  await wait(DELAY_MS);
  return readMenu();
}

// Every slug, with no delay — for generateStaticParams in
// app/menu/[id]/page.js, which runs once at build time to list the dish pages
// worth prerendering.
export async function getDishSlugs() {
  const dishes = await readMenu();
  return dishes.map((dish) => dish.slug);
}

// One dish by its slug, or null. Returning null rather than throwing leaves
// the decision with the page: a missing dish is not an error, it is a 404, and
// the page says so with notFound().
export async function getDish(slug) {
  await wait(DELAY_MS);
  const dishes = await readMenu();
  return dishes.find((dish) => dish.slug === slug) ?? null;
}
