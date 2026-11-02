// Times are printed on the server, in Addis Ababa's time, so the HTML says
// the same thing whoever opens it and wherever the server happens to run.
// (Only server components call this: a client render in another time zone
// would disagree with the server's HTML — a hydration mismatch.)
const TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Addis_Ababa",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatTime(iso) {
  return TIME.format(new Date(iso));
}

// Day 46. A date and a time together, for the order tables: "1 Nov, 14:05".
// Same rule as above — server only, Addis Ababa's clock.
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Addis_Ababa",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso) {
  return DATE_TIME.format(new Date(iso));
}
