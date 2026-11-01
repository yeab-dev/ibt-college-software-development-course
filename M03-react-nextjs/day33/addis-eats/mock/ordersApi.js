import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { normalisePhone, validate } from "../src/checkout/validate.js";

// Day 33's second pretend backend: POST /api/orders and GET /api/orders/:id.
//
// It validates again, with the same rules the form uses. Client validation is
// a courtesy — fast feedback so nobody waits for a round trip to learn they
// missed a field. This is the actual rule, because anything sent from a
// browser can be forged. Module 4 builds the real one.
//
// It also knows something the browser cannot: which numbers are registered
// with TeleBirr. That is the kind of error only a server can give, and it comes
// back as a 422 with field errors so the form can put it beside the phone.

const menuFile = fileURLToPath(new URL("./menu.json", import.meta.url));

// On a weak Addis mobile signal an order takes a while. Long enough to press
// Order twice — which is exactly what the submitting guard has to survive.
const DELAY_MS = 1500;

// Try 0900 000 000 at the checkout to see a server-side field error.
const UNREGISTERED = new Set(["0900000000"]);

// In memory: restarting the dev server forgets every order.
const orders = new Map();
let nextId = 1001;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || "{}");
}

function localNumber(phone) {
  return normalisePhone(phone).replace(/^\+251/, "0");
}

async function createOrder(req, res, url) {
  let body;
  try {
    body = await readBody(req);
  } catch {
    sendJson(res, 400, { message: "That request was not valid JSON." });
    return;
  }

  await wait(DELAY_MS);

  // ?fail=1 — the kitchen is offline. The form has to keep every value.
  if (url.searchParams.get("fail") === "1") {
    sendJson(res, 503, {
      message: "The kitchen is not taking orders right now. Nothing was charged — try again in a minute.",
    });
    return;
  }

  const form = {
    name: String(body.name ?? ""),
    phone: String(body.phone ?? ""),
    area: String(body.area ?? ""),
    notes: String(body.notes ?? ""),
  };

  // The same pure function the form calls on every render.
  const fieldErrors = validate(form);

  if (!fieldErrors.phone && UNREGISTERED.has(localNumber(form.phone))) {
    fieldErrors.phone = "That number is not registered with TeleBirr";
  }

  if (Object.keys(fieldErrors).length > 0) {
    sendJson(res, 422, { message: "Some details need fixing.", fieldErrors });
    return;
  }

  // Prices come from the menu, never from the request. A browser can send
  // any total it likes.
  const menu = JSON.parse(await readFile(menuFile, "utf8"));
  const lines = (Array.isArray(body.items) ? body.items : [])
    .map(({ id, quantity }) => {
      const dish = menu.find((d) => d.id === id);
      const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
      return dish && qty ? { id, name: dish.name, quantity: qty, price: dish.price } : null;
    })
    .filter(Boolean);

  if (lines.length === 0) {
    sendJson(res, 422, { message: "The basket is empty.", fieldErrors: {} });
    return;
  }

  const order = {
    id: String(nextId++),
    ...form,
    name: form.name.trim(),
    phone: localNumber(form.phone),
    lines,
    total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    placedAt: new Date().toISOString(),
  };
  orders.set(order.id, order);

  sendJson(res, 201, order);
}

async function handleOrdersRequest(req, res) {
  // Mounted on /api/orders, so req.url is "/" or "/1001".
  const url = new URL(req.url, "http://localhost");
  const id = url.pathname.replace(/^\/+|\/+$/g, "");

  if (req.method === "POST" && id === "") {
    await createOrder(req, res, url);
    return;
  }

  if (req.method === "GET" && id !== "") {
    await wait(300);
    const order = orders.get(id);
    if (!order) {
      sendJson(res, 404, { message: `No order ${id}` });
      return;
    }
    sendJson(res, 200, order);
    return;
  }

  sendJson(res, 405, { message: `${req.method} is not supported here.` });
}

export default function ordersApi() {
  return {
    name: "addis-eats-orders-api",
    configureServer(server) {
      server.middlewares.use("/api/orders", handleOrdersRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/orders", handleOrdersRequest);
    },
  };
}
