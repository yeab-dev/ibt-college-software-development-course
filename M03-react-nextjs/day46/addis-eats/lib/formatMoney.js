// Day 46. One formatter for money, used by the chart axes, the chart
// tooltips and every table total — the reading sheet's "one formatter,
// reused by the axis and the tooltip, with no library".
//
// "14200" on an axis means nothing; "ETB 14,200" does. The material's
// locale, en-ET, is what Node and Chromium both print as "ETB 14,200".
// Whole birr only: Addis Eats prices are whole numbers, and a column of
// ".00" is noise.
//
// No "server-only": the charts are client components and need it too. It
// formats numbers only, so the server and the browser agree on the output.
const ETB = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});

export function etb(value) {
  return ETB.format(value);
}

