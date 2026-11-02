// Day 46. Calendar days in Addis Ababa, for the dashboard's "orders per day"
// and the kitchen board's "today".
//
// A day is a key, "2026-11-02": a plain string, so it sorts, compares and
// crosses the server/client boundary as it is (the deck's warning: a chart
// handed a Date-keyed Map from a server component will not work).
//
// Which day an order belongs to depends on the clock it is read against. The
// server may run in UTC, and an order placed at 01:30 in Addis is still the
// previous evening in UTC — so every key is computed in Addis Ababa's time
// zone. Ethiopia has no daylight saving: the offset is +03:00 all year, which
// is what makes the arithmetic below safe.
//
// Day 47: the labels a person reads ("3 Oct") come from lib/format.js, like
// every other date. KEY stays here: it is an identifier for grouping and
// comparing, not something printed, and en-CA is chosen for its YYYY-MM-DD
// shape, not for how it reads.

import { day } from "./format";

const ADDIS_OFFSET = "+03:00";

const KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Addis_Ababa",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// The day an instant (a Date, an ISO string or a timestamp) falls on, in Addis.
export function dayKey(instant) {
  return KEY.format(new Date(instant)); // en-CA writes YYYY-MM-DD
}

// Midnight at the start of that day, Addis time, as a Date.
export function startOfDay(key) {
  return new Date(`${key}T00:00:00${ADDIS_OFFSET}`);
}

// The key `n` days later (or earlier, for a negative n).
export function addDays(key, n) {
  const noon = new Date(`${key}T12:00:00${ADDIS_OFFSET}`);
  return dayKey(noon.getTime() + n * 24 * 60 * 60 * 1000);
}

// "3 Oct" for an axis tick; "3 Oct 2026" when the year matters (a heading).
export function dayLabel(key, { year = false } = {}) {
  const noon = new Date(`${key}T12:00:00${ADDIS_OFFSET}`);
  return day(noon, { year });
}
