import { dayKey } from "@/lib/addisDay";
import { apiError } from "@/lib/apiError";
import { BOM, toCsv } from "@/lib/csv";
import { stamp } from "@/lib/format";
import { orderStage, STAGE_LABEL } from "@/lib/orderStage";
import { listOrders, listOrdersFor } from "@/lib/orders";
import { getSession } from "@/lib/session";

// GET /api/orders/export            your own orders, as a CSV file
// GET /api/orders/export?scope=all  every order — staff only
//
// Day 47. The order history, for a spreadsheet.
//
//   200  text/csv, as an attachment (Content-Disposition), newest first
//   400  ?scope= is something other than "mine" or "all"
//   401  no session
//   403  ?scope=all from someone who is not staff
//
// Built on the server, not in the browser as the slides do it (a Blob and a
// URL.createObjectURL click). The slides' route is right for data that is
// already on screen. Here it is not: /orders shows one page of twenty and
// /dashboard twenty of four hundred, and the full list must be scoped to the
// person asking — which only the server can do. So a plain link
// (<a href download>) to this handler: no JavaScript needed, nothing large
// sent to the browser first, and the scoping is the same three lines every
// handler has.
//
// The scoping is the receipt's rule again. The owner comes from the session,
// never the URL: listOrdersFor(user.id). The only thing the URL can ask for
// is the wider scope, and the role decides whether it gets it.
//
// The static folder name wins over the dynamic [id] beside it, so this is
// never mistaken for an order called "export".

// What a row says. Prices are plain integers (whole birr) in a column whose
// header names the unit, so the spreadsheet can add them up: "ETB 1,240"
// would be text. Dates twice: Addis Ababa's clock for a person, and the
// stored UTC instant for anything that needs to be exact.
function columnsFor(scope) {
  return [
    { header: "Order", value: (o) => Number(o.id) },
    { header: "Placed (Addis Ababa)", value: (o) => stamp(o.placedAt) },
    { header: "Placed (UTC, ISO 8601)", value: (o) => o.placedAt },
    { header: "Status", value: (o, now) => STAGE_LABEL[orderStage(o, now)] },
    // Staff see first names only, as on the kitchen board and the dashboard
    // table. Nobody's export has phone numbers: the receipt has your own.
    { header: "Name", value: (o) => (scope === "all" ? o.name.split(" ")[0] : o.name) },
    { header: "Neighbourhood", value: (o) => o.area },
    { header: "Items", value: (o) => o.lines.map((l) => `${l.quantity} × ${l.name}`).join("; ") },
    { header: "Total (ETB)", value: (o) => o.total },
    { header: "Note for the rider", value: (o) => o.notes },
  ];
}

export async function GET(request) {
  const user = await getSession();
  if (!user) {
    return apiError(401, "Not signed in.");
  }

  const scope = request.nextUrl.searchParams.get("scope") ?? "mine";
  if (scope !== "mine" && scope !== "all") {
    return apiError(400, 'scope must be "mine" or "all".');
  }
  if (scope === "all" && user.role !== "staff") {
    return apiError(403, "Only staff can export every order.");
  }

  const orders = scope === "all" ? await listOrders() : await listOrdersFor(user.id);
  // One clock reading for the whole file, so every row's status is read
  // against the same instant (as the kitchen board does).
  const now = Date.now();
  const columns = columnsFor(scope).map((c) => ({ header: c.header, value: (o) => c.value(o, now) }));
  const filename = `addis-eats-${scope === "all" ? "all-orders" : "my-orders"}-${dayKey(now)}.csv`;

  // Hundreds of rows: one string is fine. Past tens of thousands, this would
  // become a ReadableStream of rows instead (the route handler docs' own
  // streaming example), so the whole file never sits in memory at once.
  return new Response(BOM + toCsv(orders, columns), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // attachment: save it, do not show it. The name is ours (ASCII, no
      // user input), so it needs no escaping.
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Personal data: never kept by the browser cache or anything between.
      "Cache-Control": "private, no-store",
    },
  });
}
