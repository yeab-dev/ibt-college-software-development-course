import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// A tiny stand-in for a real backend. It runs inside the Vite dev server, so
// the React app can call `fetch("/api/menu?category=Main")` exactly the way it
// would call a real API: with network latency, HTTP status codes and all.
//
// Day 31 adds a second endpoint, /api/menu/:slug, because the router now has a
// screen for one dish and that screen has to fetch one dish.

const menuFile = fileURLToPath(new URL("./menu.json", import.meta.url));

// Breakfast has no dishes yet. Day 35's "filter to an empty category" check
// needs a category that really is empty, and so does the friendly note.
const CATEGORIES = ["All", "Main", "Side", "Drink", "Dessert", "Breakfast"];

// Without a delay the response comes back before React can paint, and the
// loading state (and the cancelled request) would be invisible.
const DELAY_MS = 900;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readMenu() {
  return JSON.parse(await readFile(menuFile, "utf8"));
}

async function handleMenuRequest(req, res) {
  // The middleware is mounted on /api/menu, so req.url is only what follows
  // it: "/" for the list, "/doro-wat" for one dish.
  const url = new URL(req.url, "http://localhost");
  const slug = url.pathname.replace(/^\/+|\/+$/g, "");
  const shouldFail = url.searchParams.get("fail") === "1";
  // Day 34: ?corrupt=1 serves one dish with its price missing — a bad row,
  // not a failed request. The fetch succeeds; the *render* is what breaks.
  const corrupt = url.searchParams.get("corrupt") === "1";

  await wait(DELAY_MS);

  // ?fail=1 lets the UI show off its error state on demand.
  if (shouldFail) {
    sendJson(res, 503, { message: "The kitchen is offline." });
    return;
  }

  const menu = await readMenu();
  const dishes = corrupt
    ? menu.map((dish) =>
        dish.slug === "kitfo" ? { ...dish, price: undefined } : dish,
      )
    : menu;

  // GET /api/menu/:slug — one dish.
  if (slug !== "") {
    const dish = dishes.find((item) => item.slug === slug);

    if (!dish) {
      sendJson(res, 404, { message: `There is no dish called ${slug}.` });
      return;
    }

    sendJson(res, 200, dish);
    return;
  }

  // GET /api/menu?category=… — the list.
  const category = url.searchParams.get("category") ?? "All";

  if (!CATEGORIES.includes(category)) {
    sendJson(res, 404, { message: `There is no ${category} category.` });
    return;
  }

  sendJson(
    res,
    200,
    category === "All"
      ? dishes
      : dishes.filter((dish) => dish.category === category),
  );
}

// Day 35, "rename the data file". Without this, a missing or broken menu.json
// was a rejected promise nobody caught, and Node took the whole dev server
// down with it. A real server answers 500 with a reason, so this one does too,
// and the app's error state gets something useful to show.
async function safely(req, res) {
  try {
    await handleMenuRequest(req, res);
  } catch (err) {
    console.error("[menu api]", err.message);
    sendJson(res, 500, {
      message: "The kitchen could not read its menu. Nothing is wrong with your connection.",
    });
  }
}

export default function menuApi() {
  return {
    name: "addis-eats-menu-api",
    configureServer(server) {
      server.middlewares.use("/api/menu", safely);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/menu", safely);
    },
  };
}
