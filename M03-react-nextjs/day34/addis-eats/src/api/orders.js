// The one place the app talks to /api/orders.
//
// fetch only rejects when the network itself fails, so a 422 or a 503 arrives
// as a resolved promise. This turns every way an order can fail into a single
// thrown OrderError, carrying the reason in words and — on a 422 — the field
// errors the server found, keyed exactly like the ones validate() returns.

export class OrderError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = "OrderError";
    this.fieldErrors = fieldErrors;
  }
}

export async function placeOrder(form, items, { fail = false } = {}) {
  let res;
  try {
    res = await fetch(`/api/orders${fail ? "?fail=1" : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Only ids and quantities: the server looks the prices up itself.
      body: JSON.stringify({
        ...form,
        items: items.map(({ id, quantity }) => ({ id, quantity })),
      }),
    });
  } catch {
    throw new OrderError(
      "We could not reach Addis Eats. Check your connection — your details are still here.",
    );
  }

  const body = await res.json().catch(() => ({}));

  if (res.status === 422) {
    throw new OrderError(body.message ?? "Some details need fixing.", body.fieldErrors ?? {});
  }

  if (!res.ok) {
    throw new OrderError(body.message ?? `The server answered ${res.status}.`);
  }

  return body;
}
