// Day 46. Forcing a data screen into each of its four states, on demand.
//
// The sheet asks for loading, empty and error to be "written, and each one
// demonstrable". Real data is fast, present and readable, so none of the
// three would ever be seen without a switch:
//
//   ?state=loading   the data takes three seconds: the skeleton shows
//   ?state=empty     the data is read as no orders at all
//   ?state=error     reading the data throws: the segment's error.js shows
//
// on /dashboard and /orders.
//
// Not a backdoor: the switch only exists in `npm run dev`, or on a server
// started with ADDIS_EATS_DEMO_STATES=1 in its environment (server only, no
// NEXT_PUBLIC_ prefix, read when the request is handled — so a production
// build can be shown with it and then restarted without it). Anywhere else
// ?state= is ignored. And it only changes how a page already allowed to the
// viewer looks: the session and role checks run before it is read.
const STATES = ["loading", "empty", "error"];

export function demoStatesOn() {
  return process.env.NODE_ENV === "development" || process.env.ADDIS_EATS_DEMO_STATES === "1";
}

export function demoState(searchParams) {
  if (!demoStatesOn()) return null;
  const value = Array.isArray(searchParams.state) ? searchParams.state[0] : searchParams.state;
  return STATES.includes(value) ? value : null;
}

// What the data component does with it, before it reads anything.
export async function applyDemoState(state) {
  if (state === "loading") await new Promise((resolve) => setTimeout(resolve, 3000));
  if (state === "error") throw new Error("Demo: the order store could not be read (?state=error).");
}
