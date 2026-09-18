import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// A tiny stand-in for a real backend. It runs inside the Vite dev server, so
// the React app can call `fetch("/api/menu?category=Main")` exactly the way it
// would call a real API: with network latency, HTTP status codes and all.

const menuFile = fileURLToPath(new URL("./menu.json", import.meta.url));

const CATEGORIES = ["All", "Main", "Side", "Drink", "Dessert"];

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

async function handleMenuRequest(req, res) {
  // The middleware is mounted on /api/menu, so req.url is only what follows it.
  const url = new URL(req.url, "http://localhost");
  const category = url.searchParams.get("category") ?? "All";
  const shouldFail = url.searchParams.get("fail") === "1";

  await wait(DELAY_MS);

  // ?fail=1 lets the UI show off its error state on demand.
  if (shouldFail) {
    sendJson(res, 503, { message: "The kitchen is offline." });
    return;
  }

  if (!CATEGORIES.includes(category)) {
    sendJson(res, 404, { message: `No such category: ${category}` });
    return;
  }

  const dishes = JSON.parse(await readFile(menuFile, "utf8"));

  sendJson(
    res,
    200,
    category === "All"
      ? dishes
      : dishes.filter((dish) => dish.category === category),
  );
}

export default function menuApi() {
  return {
    name: "addis-eats-menu-api",
    configureServer(server) {
      server.middlewares.use("/api/menu", handleMenuRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/menu", handleMenuRequest);
    },
  };
}
