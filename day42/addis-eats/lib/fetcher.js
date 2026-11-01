// Day 41. The one fetcher every client query uses.
//
// SWR calls it with the query's key — here always a URL on this site — and
// treats whatever it returns as the data and whatever it throws as the error.
// The slides' one-liner
//
//     const fetcher = (url) => fetch(url).then((r) => r.json());
//
// has a hole in it: fetch() only rejects when the network fails. A 401, 403
// or 500 resolves like a 200, its { "error": … } body would be handed to the
// component as if it were the order, and the screen would try to draw
// `undefined`. So a response that is not OK is turned into a thrown error
// here, once, and every query gets the same failure branch.
//
// The thrown error carries what the endpoint said. Every handler in this app
// answers failure in one shape, { error, fieldErrors? } (lib/apiError.js), so
// `message` is a sentence a person can read, and `status` lets a caller decide
// what to do next — useOrder() stops retrying on a 4xx, because asking again
// will not make the order theirs.
//
// No React and no Node in here: it runs in the browser, inside SWR.
export class FetchError extends Error {
  constructor(status, body) {
    super(body?.error ?? `The server answered ${status}.`);
    this.name = "FetchError";
    this.status = status;
    this.info = body;
  }
}

export async function fetcher(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  // A failed body is still worth reading: it says why.
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new FetchError(res.status, body);
  }
  return body;
}

export default fetcher;
