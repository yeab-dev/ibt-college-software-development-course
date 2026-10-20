import { normalisePhone, validate } from "./validate";

// A stand-in for the kitchen, until the course builds a real one.
//
// On Vite, placeOrder() POSTed to /api/orders and mock/ordersApi.js answered
// from inside the dev server. That mock was a Vite plugin, and it did not come
// across. Next.js can host an endpoint (app/api/orders/route.js), but that is a
// later day's topic and would add a route this exercise does not ask for. So
// for now the "server" runs in the browser: same signature, same delay, same
// three answers — 422 with field errors, 503 for ?fail=1, success — and the
// same OrderError for Checkout to catch. Checkout cannot tell the difference.
//
// What it cannot do is be trusted. Real server-side validation needs a real
// server; the rules here are re-run only so the failure paths still work.

export class OrderError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = "OrderError";
    this.fieldErrors = fieldErrors;
  }
}

// Long enough to press Order twice — the submitting guard has to survive it.
const DELAY_MS = 1500;

// Try 0900 000 000 to see an error only the "server" can give.
const UNREGISTERED = new Set(["0900000000"]);

let nextId = 1001;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function localNumber(phone) {
  return normalisePhone(phone).replace(/^\+251/, "0");
}

export async function placeOrder(form, items, { fail = false } = {}) {
  await wait(DELAY_MS);

  if (fail) {
    throw new OrderError(
      "The kitchen is not taking orders right now. Nothing was charged — try again in a minute.",
    );
  }

  const fieldErrors = validate(form);
  if (!fieldErrors.phone && UNREGISTERED.has(localNumber(form.phone))) {
    fieldErrors.phone = "That number is not registered with TeleBirr";
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new OrderError("Some details need fixing.", fieldErrors);
  }

  const lines = items.map(({ id, name, price, quantity }) => ({
    id,
    name,
    price,
    quantity,
  }));

  return {
    id: String(nextId++),
    ...form,
    name: form.name.trim(),
    phone: localNumber(form.phone),
    lines,
    total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
  };
}
