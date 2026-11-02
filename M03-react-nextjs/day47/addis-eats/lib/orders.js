import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { dayKey } from "./addisDay";
import { tracking } from "./delivery";
import { readMenu } from "./menu";
import { orderStage, STAGE_LABEL } from "./orderStage";
import { seedOrders } from "./seedOrders";
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

// Day 46: no file yet means a fresh clone (or a deleted .data/), and the
// store starts from a month of seeded history instead of from nothing — the
// dashboard needs something to chart (lib/seedOrders.js). Any other failure,
// such as a half-written or hand-edited file that is not JSON, is thrown: the
// pages that read orders show their error state rather than an empty list
// that would look like "no orders".
async function load() {
  try {
    return JSON.parse(await readFile(ORDERS_FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    return seedOnce();
  }
}

// The dashboard reads the store twice at once (the summary and the table),
// so on a fresh clone two reads can both find no file. One seeding, shared
// by both, on globalThis like the write queue below: two writers renaming
// the same temporary file would trip over each other.
function seedOnce() {
  const seeding = (globalThis.__addisEatsOrderSeed ??= (async () => {
    const seeded = seedOrders({ menu: await readMenu(), now: Date.now() });
    await save(seeded);
    return seeded;
  })().finally(() => {
    globalThis.__addisEatsOrderSeed = null;
  }));
  return seeding.then((orders) => structuredClone(orders));
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

// Every order, newest first. Staff only — the page that calls it checks the
// role first: the dashboard (Day 46) and, through listOrdersToday, the
// kitchen board.
export async function listOrders() {
  const orders = await load();
  return orders.toReversed(); // newest first
}

// Day 46. Today's orders (Addis Ababa's day), newest first: the kitchen
// board. Until today the board listed every order ever placed, which was a
// handful; with a month of seeded history it would be four hundred rows of
// delivered food. A kitchen screen is about today.
export async function listOrdersToday(now = Date.now()) {
  const today = dayKey(now);
  const orders = await listOrders();
  return orders.filter((order) => dayKey(order.placedAt) === today);
}

// Day 42. One person's orders, newest first. The id comes from the session,
// never from the request: the slides' getOrdersFor(user.id). Whatever the
// URL, the query string or a form said, this cannot return anyone else's.
export async function listOrdersFor(userId) {
  if (typeof userId !== "string" || !userId) return [];
  const orders = await load();
  return orders.filter((order) => order.userId === userId).toReversed();
}

// ---- sorting and paging (Day 46) ----------------------------------------------

// The columns a table may be sorted by, and the direction each starts in
// when it is first chosen: newest and largest first, neighbourhoods A to Z.
// Anything else in the URL is not a sort, and the default is used.
export const SORTS = { date: "desc", total: "desc", area: "asc" };
export const PAGE_SIZE = 20;

const COMPARE = {
  date: (a, b) => a.placedAt.localeCompare(b.placedAt),
  total: (a, b) => a.total - b.total,
  area: (a, b) => a.area.localeCompare(b.area),
};

// One page of a list, sorted: the reading sheet's
// getOrdersFor(session.id, { sort, dir, skip, take }) → { rows, total }.
// A database would do this in the query; here the whole file is in memory
// already, so it is a sort and a slice — but the shape is the same, and only
// `rows` (twenty orders) leaves the server. The dashboard calls it directly,
// on the list it has already read for the charts.
//
// Ties are broken by placedAt, newest first, then by id, so equal totals
// always come out in the same order and a row never appears on two pages.
// The page is clamped: ?page=99 on a three-page list shows page three.
export function pageOf(orders, { sort = "date", dir = SORTS[sort], page = 1 } = {}) {
  const compare = COMPARE[sort] ?? COMPARE.date;
  const sign = dir === "asc" ? 1 : -1;
  const sorted = orders.toSorted(
    (a, b) => sign * compare(a, b) || b.placedAt.localeCompare(a.placedAt) || Number(b.id) - Number(a.id),
  );
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const skip = (current - 1) * PAGE_SIZE;
  return { rows: sorted.slice(skip, skip + PAGE_SIZE), total: sorted.length, page: current, pages };
}

// One person's orders, one page at a time. Scoped by the session's id, as
// listOrdersFor is: the sort and the page come from the URL, the owner never
// does.
export async function pageOrdersFor(userId, options) {
  return pageOf(await listOrdersFor(userId), options);
}

// An id from a URL or an action argument is user input. Anything that is not
// a plain number string is simply not an order.
export async function getOrder(id) {
  if (typeof id !== "string" || !/^\d{1,9}$/.test(id)) return null;
  const orders = await load();
  return orders.find((order) => order.id === id) ?? null;
}

// Day 42. One order, *if it is this person's*: the receipt page's read. The
// id is from the URL and only says which one to look for; the owner is from
// the session and decides whether it is found. Somebody else's order and no
// order are the same answer, null, so the page cannot tell them apart and
// neither can whoever changed the number in the address bar.
export async function getOrderFor(userId, id) {
  const order = await getOrder(id);
  return order && typeof userId === "string" && order.userId === userId ? order : null;
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
//
// Day 47: plus `tracking` — where the courier and the delivery point are
// (lib/delivery.js) — and a third reader: every frame of the order's event
// stream (app/api/orders/[id]/stream/route.js) is this object too. The
// receipt's first render, a poll and a pushed frame are interchangeable, so
// the client can put any of them into the same cache entry.
export function orderView(order, now = Date.now()) {
  const stage = orderStage(order, now);
  return { ...publicOrder(order), stage, stageLabel: STAGE_LABEL[stage], tracking: tracking(order, now) };
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
// the items, and who is asking: `userId`, the session's account id. Day 42:
// both doors require a session now, so every order has an owner.
//
// It answers in one shape, which each door translates for its own caller:
//   { ok: true, order }
//   { ok: false, status, error, fieldErrors? }
// `status` is the HTTP code the route handler sends. The action has no status
// line to set, so it hands `error` and `fieldErrors` to the form instead.
export async function createOrder({ get, items, userId, fail = false }) {
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

  // Belt and braces: both callers have checked the session already. An
  // order with no owner could never be read or cancelled by anyone.
  if (typeof userId !== "string" || !userId) {
    return { ok: false, status: 401, error: "Not signed in." };
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
