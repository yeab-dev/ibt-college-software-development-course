import "server-only";
import { addDays, dayKey, dayLabel } from "./addisDay";
import { AREAS } from "./validate";

// Day 46. The dashboard's numbers, worked out on the server.
//
// The reading sheet's rule: shape it on the server, chart it on the client.
// The order file holds every order — four hundred and growing, each with a
// name, a phone number and its dishes. The charts need two small tables:
//
//   byArea  one row per neighbourhood   { area, revenue, orders }    4 rows
//   byDay   one row per day             { day, label, orders, revenue }  30 rows
//
// Only these cross to the browser (app/dashboard/RevenueChart.jsx and
// OrdersChart.jsx are client leaves). Plain arrays of plain objects with
// string and number fields — the only kind of thing that can cross — and
// nothing in them identifies a customer.
//
// The range is the 30 *complete* days before today. Including today would
// end the line on a half-finished day, which reads as a sudden drop at the
// right-hand edge — the sheet's "truncated time range" in another form.
// Today's orders get their own line instead (`today`), and the order table
// below the charts has them all.
//
// Cancelled orders are not revenue, and they are not counted as orders
// either: both charts say so under their headings.

export const RANGE_DAYS = 30;

export function summarise(orders, now = Date.now()) {
  const today = dayKey(now);
  const first = addDays(today, -RANGE_DAYS);
  const last = addDays(today, -1);

  const days = Array.from({ length: RANGE_DAYS }, (_, i) => addDays(first, i));
  const byDayMap = new Map(days.map((day) => [day, { orders: 0, revenue: 0 }]));
  const byAreaMap = new Map(AREAS.map((area) => [area, { orders: 0, revenue: 0 }]));
  const todaySoFar = { orders: 0, revenue: 0 };

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const day = dayKey(order.placedAt);
    if (day === today) {
      todaySoFar.orders += 1;
      todaySoFar.revenue += order.total;
      continue;
    }
    const bucket = byDayMap.get(day);
    if (!bucket) continue; // older than the range
    bucket.orders += 1;
    bucket.revenue += order.total;
    // An area that is no longer offered still has history: it gets a bar.
    if (!byAreaMap.has(order.area)) byAreaMap.set(order.area, { orders: 0, revenue: 0 });
    const area = byAreaMap.get(order.area);
    area.orders += 1;
    area.revenue += order.total;
  }

  const byDay = days.map((day) => ({ day, label: dayLabel(day), ...byDayMap.get(day) }));
  // Largest first: the bar chart answers "which is largest?", so the answer
  // is the first bar.
  const byArea = [...byAreaMap]
    .map(([area, totals]) => ({ area, ...totals }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    range: {
      first,
      last,
      label: `${dayLabel(first, { year: first.slice(0, 4) !== last.slice(0, 4) })} – ${dayLabel(last, { year: true })}`,
    },
    byArea,
    byDay,
    totals: {
      orders: byDay.reduce((sum, d) => sum + d.orders, 0),
      revenue: byDay.reduce((sum, d) => sum + d.revenue, 0),
    },
    today: todaySoFar,
  };
}
