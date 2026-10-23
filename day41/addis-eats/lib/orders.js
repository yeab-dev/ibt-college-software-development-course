import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { readMenu } from "./menu";
import { orderStage, STAGE_LABEL } from "./orderStage";
import { localNumber, toOrderForm, validate } from "./validate";

// Orders: the one thing in Addis Eats that is written, not just read.
//
// Day 33's mock/ordersApi.js kept them in a Map inside the Vite dev server and
// forgot them on restart. This keeps them in a JSON file, .data/orders.json
// (gitignored), for two reasons that matter today:
//
//   - Three different server entry points touch them: the route handler
//     (POST /api/orders), the server actions (placeOrder, cancelOrder) and
//     the pages (/orders, /orders/[id]). A file is the same file for all of
//     them, however Next.js bundles each one.
//   - /orders is a *static* page. It is prerendered once and then
//     regenerated only when revalidatePath("/orders") says it is out of date.
//     A regeneration has to read what the write just stored.
//
// A real database replaces this file in Module 4; nothing above this module
// would change.
//
// "server-only": it reads the disk and stores phone numbers. No client file
// may import it, and the build fails if one tries.

const ORDERS_FILE = path.join(process.cwd(), ".data", "orders.json");

// Day 33's delay. Long enough to press Order twice — the pending state has to
// survive it — and to see the button say "Sending…".
const DELAY_MS = 1200;

// Try 0900 000 000 at the checkout to see an error only the server can give.
const UNREGISTERED = new Set(["0900000000"]);

const FIRST_ID = 1001;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function load() {
  try {
    return JSON.parse(await readFile(ORDERS_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function save(orders) {
  await mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  // Write a temporary file, then rename it over the old one: a reader never
  // sees half a file.
  const temp = `${ORDERS_FILE}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(orders, null, 2)}\n`);
  await rename(temp, ORDERS_FILE);
}

// Writes are queued, one after another, so two orders placed in the same
// instant cannot both read the file, both add one, and lose each other. The
// queue lives on globalThis so every bundle in this process shares it.
const queue = (globalThis.__addisEatsOrderQueue ??= { tail: Promise.resolve() });

function mutate(change) {
  const run = queue.tail.then(async () => {
    const orders = await load();
    const result = await change(orders);
    await save(orders);
    return result;
  });
  queue.tail = run.catch(() => {}); // one failed write must not jam the rest
  return run;
}

// ---- reads ------------------------------------------------------------------

export async function listOrders() {
  const orders = await load();
  return orders.toReversed(); // newest first
}

// An id from a URL or an action argument is user input. Anything that is not
// a plain number string is simply not an order.
export async function getOrder(id) {
  if (typeof id !== "string" || !/^\d{1,9}$/.test(id)) return null;
  const orders = await load();
  return orders.find((order) => order.id === id) ?? null;
}

// What leaves the server about an order. The owner's id is how the server
// decides who may cancel; nobody needs to be told it.
export function publicOrder({ userId, ...order }) {
  return order;
}

// Day 41. An order as its owner sees it: the public fields plus the stage it
// has reached. GET /api/orders/[id] answers with exactly this, and the receipt
// page renders exactly this and hands it to the client query as fallbackData.
// One function, so the first paint and every poll can never disagree on shape.
export function orderView(order, now = Date.now()) {
  const stage = orderStage(order, now);
  return { ...publicOrder(order), stage, stageLabel: STAGE_LABEL[stage] };
}

// ---- placing an order -------------------------------------------------------

// Prices come from the menu, never from the request: a browser can send any
// total it likes. Unknown ids and silly quantities are dropped.
async function priceLines(items) {
  const menu = await readMenu();
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const dish = menu.find((d) => d.id === item?.id);
      const quantity = item?.quantity;
      const ok = Number.isInteger(quantity) && quantity > 0 && quantity <= 99;
      return dish && ok
        ? { id: dish.id, slug: dish.slug, name: dish.name, price: dish.price, quantity }
        : null;
    })
    .filter(Boolean);
}

// The lines the checkout page shows, priced exactly as createOrder will price
// them — the person sees the same total the server is about to charge.
export async function priceBasket(items) {
  const lines = await priceLines(items);
  return { lines, total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0) };
}

// The one place an order is judged and written. Both doors lead here:
// app/api/orders/route.js with a JSON body, and the placeOrder action with a
// FormData and the basket cookie. Each passes `get` (how to read a field),
// the items, and who is asking (`userId`, or null for an API caller).
//
// It answers in one shape, which each door translates for its own caller:
//   { ok: true, order }
//   { ok: false, status, error, fieldErrors? }
// `status` is the HTTP code the route handler sends. The action has no status
// line to set, so it hands `error` and `fieldErrors` to the form instead.
export async function createOrder({ get, items, userId = null, fail = false }) {
  await wait(DELAY_MS);

  // ?fail=1 — the kitchen is offline. Day 33's 503, kept so the form's
  // "failed" state still has something to show.
  if (fail) {
    return {
      ok: false,
      status: 503,
      error: "The kitchen is not taking orders right now. Nothing was charged — try again in a minute.",
    };
  }

  const form = toOrderForm(get);

  // The same pure function the form calls on every render.
  const fieldErrors = validate(form);

  if (!fieldErrors.phone && UNREGISTERED.has(localNumber(form.phone))) {
    fieldErrors.phone = "That number is not registered with TeleBirr";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 422, error: "Validation failed", fieldErrors };
  }

  const lines = await priceLines(items);
  if (lines.length === 0) {
    return {
      ok: false,
      status: 422,
      error: "Validation failed",
      fieldErrors: { items: "The basket is empty — add a dish from the menu first" },
    };
  }

  return mutate((orders) => {
    const last = orders.at(-1);
    const order = {
      id: String(last ? Number(last.id) + 1 : FIRST_ID),
      userId,
      status: "placed",
      name: form.name.trim(),
      phone: localNumber(form.phone),
      area: form.area,
      notes: form.notes.trim(),
      lines,
      total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      currency: "ETB",
      placedAt: new Date().toISOString(),
    };
    orders.push(order);
    return { ok: true, order };
  });
}

// ---- cancelling -------------------------------------------------------------

// This function does not ask *who* is cancelling. That question belongs to
// the caller (cancelOrder in app/actions.js), which must answer it before it
// gets here. It only knows whether the order can still be cancelled.
export async function markCancelled(id) {
  return mutate((orders) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return null;
    if (order.status === "placed") {
      order.status = "cancelled";
      order.cancelledAt = new Date().toISOString();
    }
    return order;
  });
}
