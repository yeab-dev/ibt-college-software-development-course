// Day 47. Every price and every time Addis Eats prints goes through this
// file — the reading sheet's lib/format.js.
//
// Until today there were two of these (lib/formatMoney.js from Day 46,
// lib/formatTime.js from Day 39), a third set of date formatters inside
// lib/addisDay.js, and a dozen places that printed `{price} ETB` by hand. One
// module means one answer to "how does this app write money and time", and
// one place to change when that decision does.
//
// The two rules from the deck:
//
//   Build each formatter once. Creating an Intl formatter is expensive;
//   calling one is not. Every formatter below is a module-level constant,
//   built when the module is first imported — never inside a function, a
//   component or a .map() over four hundred rows.
//
//   Always name the locale and the time zone. Relying on the environment
//   means the server (which may run in UTC) and the phone disagree, and React
//   reports a hydration mismatch. Every date formatter names
//   Africa/Addis_Ababa (EAT, UTC+3 all year, no daylight saving).
//
// Each export is a function, not the bare Intl object the slides export
// (`etb.format(14200)`): a function can be handed straight to a chart as a
// tickFormatter, accepts the ISO strings that JSON delivers (JSON has no Date
// type — the deck's own warning), and keeps the call sites short.
//
// No "server-only" and no React: the receipt's client leaves, the cart and
// the charts call it in the browser, the pages and route handlers on the
// server, and both produce the same characters.

// ---- money ------------------------------------------------------------------

// "ETB 14,200". The material's locale. Neither Node 24 nor Chromium has
// en-ET locale data: both quietly resolve it to "en", which prints currency
// this way anyway, so the output is the one the slides show (with a no-break
// space after "ETB"). Whole birr: menu prices are whole numbers, kept as
// integers end to end, so no ".00" and no floating-point totals.
const MONEY = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});

export function etb(value) {
  return MONEY.format(value);
}

// ---- dates and times --------------------------------------------------------

// Not "en-ET" for dates, unlike the slides. Because en-ET falls back to "en"
// (US English) in both Node and Chromium, the slides' formatter prints
// "Jul 14, 2026, 6:40 PM" — not the "14 Jul 2026, 18:40" its comment
// promises. en-GB gives day-month order and a 24-hour clock, which is what
// was meant (and what Addis Eats has printed since Day 39).
const LOCALE = "en-GB";
const ZONE = "Africa/Addis_Ababa";

// "2 Nov 2026, 18:40": when something happened. Receipts and order tables.
const WHEN = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: ZONE });

// "18:40": a time today. The kitchen board and the estimated arrival.
const CLOCK = new Intl.DateTimeFormat(LOCALE, { timeStyle: "short", timeZone: ZONE });

// "3 Oct" and "3 Oct 2026": a calendar day, for chart axes and headings
// (lib/addisDay.js passes noon of that day).
const DAY = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: ZONE });
const DAY_WITH_YEAR = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: ZONE });

// "2026-11-02 18:40": for a spreadsheet. Sortable as text and recognised as a
// date by Excel, LibreOffice and Google Sheets. The sv-SE locale is the usual
// trick for ISO-shaped output; it is still Addis Ababa's clock.
const STAMP = new Intl.DateTimeFormat("sv-SE", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// Anything new Date() accepts: an ISO string, a timestamp, a Date.
export function when(instant) {
  return WHEN.format(new Date(instant));
}

export function clock(instant) {
  return CLOCK.format(new Date(instant));
}

export function day(instant, { year = false } = {}) {
  return (year ? DAY_WITH_YEAR : DAY).format(new Date(instant));
}

export function stamp(instant) {
  return STAMP.format(new Date(instant));
}

// ---- relative times ---------------------------------------------------------

// "12 minutes ago", "in 2 minutes", "now", "yesterday" (numeric: "auto").
// No time zone needed — it is a difference — but the locale is still named.
const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS = [
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

// `now` is a parameter on purpose. A relative time read off each machine's
// own clock is a hydration mismatch waiting to happen: the server renders "2
// minutes ago", the browser hydrates a second later and computes "3 minutes
// ago". The receipt passes the server's own reading (`tracking.at`, sent
// with every update), so both sides compute from the same instant.
export function relative(instant, now = Date.now()) {
  const seconds = (new Date(instant).getTime() - new Date(now).getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return RELATIVE.format(Math.round(seconds / size), unit);
  }
  // Under a minute: "now", or "in 40 seconds" for something about to happen.
  return Math.abs(seconds) < 10 ? RELATIVE.format(0, "second") : RELATIVE.format(Math.round(seconds), "second");
}
