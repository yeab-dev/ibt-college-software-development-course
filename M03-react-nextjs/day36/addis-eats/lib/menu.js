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

// The whole menu, slowly. `fail` is the old ?fail=1 switch: instead of a 503
// from the mock server, the read itself throws — and because it throws inside
// app/menu/page.js, app/menu/error.js catches it.
export async function getMenu({ fail = false } = {}) {
  await wait(DELAY_MS);

  if (fail) {
    throw new Error("The kitchen is offline.");
  }

  return readMenu();
}

// One dish by its slug, or null. Returning null rather than throwing leaves
// the decision with the page: a missing dish is not an error, it is a 404, and
// the page says so with notFound().
export async function getDish(slug) {
  await wait(DELAY_MS);
  const dishes = await readMenu();
  return dishes.find((dish) => dish.slug === slug) ?? null;
}
