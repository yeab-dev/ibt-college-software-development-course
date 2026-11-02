// Day 47. Rows to CSV — where the escaping is the whole problem.
//
// A naive rows.map((r) => r.join(",")) works on test data and corrupts the
// first real export: one comma inside one value ("Bole, Kitfo") shifts every
// column after it. The rules (RFC 4180, and what every spreadsheet reads):
//
//   - a value containing a comma, a double quote, a carriage return or a
//     newline is wrapped in double quotes
//   - a double quote inside it is doubled:  He said "hi"  →  "He said ""hi"""
//   - a newline inside quotes is part of the value, not the end of the row
//   - rows end with CRLF (\r\n)
//
// The slides' test is /[",\n]/. It misses \r — a lone carriage return in a
// value is a line break to Excel — so \r is in the test here too.
//
// One more rule the slides do not mention: formula injection. A spreadsheet
// treats a cell that starts with =, +, - or @ as a formula, and the notes
// field is free text anyone can type (=HYPERLINK("http://…") runs when the
// file is opened). Text values that start with one of those characters (or a
// tab or a carriage return) get a leading apostrophe, the OWASP advice:
// the spreadsheet shows the text, and never runs it. Numbers are left alone,
// so totals stay numbers that can be summed.
//
// No React and no Node: pure functions, usable on either side. Addis Eats
// builds its exports on the server (app/api/orders/export/route.js).

const NEEDS_QUOTES = /[",\r\n]/;
const FORMULA_START = /^[=+\-@\t\r]/;

export function cell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// columns: [{ header: "Total (ETB)", value: (row) => row.total }, …]
// The header row is escaped like any other: a header could contain a comma.
export function toCsv(rows, columns) {
  const lines = [columns.map((c) => cell(c.header)), ...rows.map((row) => columns.map((c) => cell(c.value(row))))];
  return `${lines.map((line) => line.join(",")).join("\r\n")}\r\n`;
}

// A byte-order mark at the very start. Excel on Windows otherwise reads a
// CSV as the local legacy code page, and "Mekdes" survives but an Amharic
// name or "—" turns to mojibake. Every other reader ignores it.
export const BOM = "﻿";
