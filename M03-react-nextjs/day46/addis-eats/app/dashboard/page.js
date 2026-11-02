import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { Suspense } from "react";
import OrderTable from "@/components/OrderTable";
import PageLinks from "@/components/PageLinks";
import { summarise } from "@/lib/dashboard";
import { applyDemoState, demoState } from "@/lib/demoState";
import { etb } from "@/lib/formatMoney";
import { listOrders, pageOf } from "@/lib/orders";
import { getSession } from "@/lib/session";
import { privatePage } from "@/lib/site";
import { readTableQuery } from "@/lib/tableQuery";
import DashboardSkeleton from "./DashboardSkeleton";
import DataTable from "./DataTable";
import OrdersChart from "./OrdersChart";
import RevenueChart from "./RevenueChart";

// "/dashboard" — Day 46. Revenue by neighbourhood, orders per day, and every
// order in a sortable, paged table. Staff only.
//
// Who may see it. It is revenue across every customer, and its table names
// whose order is whose, so it is a staff screen, behind the same three
// layers as /kitchen (AUTH.md):
//
//   proxy.js   "/dashboard/:path*" is in the matcher: no session-shaped
//              cookie → 307 to /login?next=/dashboard
//   this page  getSession(), then role === "staff" or forbidden() → 403
//   the data   nothing here writes, so there is no action to re-check; the
//              reads below run only after the check
//
// A server component, and it stays one. Everything is added up here
// (lib/dashboard.js) and two small arrays cross to the two client leaves:
// four rows for the bar chart and thirty for the line. The order table is a
// server component too — it ships no JavaScript at all.
//
// The order of things matters for the status code. The session and the role
// are checked *before* the Suspense boundary, so the HTTP status is decided
// before a byte is streamed: a customer gets a real 403. The course puts a
// loading.js beside the page instead; that would wrap this whole function in
// a boundary, start the response with a 200 and the skeleton, and turn the
// 403 into a streamed one (node_modules/next/dist/docs, loading.md, "Status
// codes"). So the boundary is here, around the data only.
//
// Dynamic (ƒ): it reads the session and the query string.
export const metadata = privatePage({
  title: "Dashboard",
  description: "Addis Eats revenue by neighbourhood, orders per day and every order, for staff.",
});

export default async function DashboardPage({ searchParams }) {
  const user = await getSession();
  if (!user) {
    redirect("/login?next=/dashboard");
  }
  if (user.role !== "staff") {
    console.warn(`/dashboard refused: ${user.id} is a ${user.role}`);
    forbidden();
  }

  // Next.js 15+: searchParams is a promise. The slides read
  // searchParams.sort directly, which is the Next.js 14 shape.
  const params = await searchParams;
  const query = readTableQuery(params);
  const state = demoState(params);

  return (
    <main className="wide">
      <h1>Dashboard</h1>
      <p className="board__built">
        Signed in as <strong>{user.name}</strong>, staff.{" "}
        <Link href="/kitchen">Today&apos;s kitchen board</Link>
      </p>
      {/* The loading state. Its fallback is shaped like the page, and it
          shows while DashboardData reads and adds up the orders. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData query={query} state={state} />
      </Suspense>
    </main>
  );
}

async function DashboardData({ query, state }) {
  await applyDemoState(state); // ?state=loading waits, ?state=error throws
  const orders = state === "empty" ? [] : await listOrders();

  // The empty state, written first (the sheet's advice): why it is empty and
  // what to do next. "No data" would be a failure; this is a screen.
  if (orders.length === 0) {
    return (
      <div className="state">
        <p>
          <strong>No orders yet.</strong> The charts and the table fill in as soon as the first order
          is placed — there is nothing to add up until then.
        </p>
        <p>
          <Link href="/kitchen">Watch the kitchen board</Link> or{" "}
          <Link href="/menu">place a test order from the menu</Link>.
        </p>
      </div>
    );
  }

  const { range, byArea, byDay, totals, today } = summarise(orders);
  const table = pageOf(orders, query);

  // Exactly what each chart needs, and nothing else: the client leaves get
  // { area, revenue } and { label, orders }. The order counts per area and
  // the revenue per day stay on the server, in the tables below the charts.
  const revenueRows = byArea.map(({ area, revenue }) => ({ area, revenue }));
  const orderRows = byDay.map(({ label, orders: count }) => ({ label, orders: count }));

  return (
    <>
      <p className="dashboard__summary">
        <strong>{totals.orders}</strong> orders and <strong>{etb(totals.revenue)}</strong> in the 30
        days {range.label}. Today so far: <strong>{today.orders}</strong>{" "}
        {today.orders === 1 ? "order" : "orders"}, {etb(today.revenue)}.
      </p>

      {totals.orders === 0 ? (
        <p className="state">
          No orders between {range.label}, so there is nothing to chart. Today&apos;s orders are in
          the table below.
        </p>
      ) : (
        <div className="dashboard__charts">
          <section className="chart" aria-labelledby="revenue-heading">
            <h2 id="revenue-heading">Revenue by neighbourhood, {range.label}</h2>
            <p className="chart__unit">
              In Ethiopian birr (ETB), largest first. Cancelled orders are not counted.
            </p>
            <div className="chart__frame">
              <RevenueChart data={revenueRows} title={`Revenue by neighbourhood, ${range.label}, in ETB`} />
            </div>
            <DataTable
              caption={`Revenue by neighbourhood, ${range.label}`}
              rowKey="area"
              columns={[
                { key: "area", label: "Neighbourhood" },
                { key: "orders", label: "Orders", numeric: true },
                { key: "revenue", label: "Revenue", numeric: true, format: etb },
              ]}
              rows={byArea}
            />
          </section>

          <section className="chart" aria-labelledby="orders-heading">
            <h2 id="orders-heading">Orders per day, {range.label}</h2>
            <p className="chart__unit">
              Number of orders placed each day (Addis Ababa time). Cancelled orders are not counted;
              today is left out until it is over.
            </p>
            <div className="chart__frame">
              <OrdersChart data={orderRows} title={`Orders per day, ${range.label}`} />
            </div>
            {/* Thirty rows: folded away by default, one press to open, and
                in the HTML either way (copy, print, find in page). */}
            <details className="chart__numbers">
              <summary>Orders per day as a table</summary>
              <DataTable
                caption={`Orders per day, ${range.label}`}
                rowKey="day"
                columns={[
                  { key: "label", label: "Day" },
                  { key: "orders", label: "Orders", numeric: true },
                  { key: "revenue", label: "Revenue", numeric: true, format: etb },
                ]}
                rows={byDay}
              />
            </details>
          </section>
        </div>
      )}

      <section aria-labelledby="table-heading">
        <h2 id="table-heading">Every order</h2>
        <OrderTable
          id="all-orders"
          title="Every order"
          rows={table.rows}
          query={query}
          path="/dashboard"
          page={table.page}
          pages={table.pages}
          showCustomer
        />
        <PageLinks
          label="Order table pages"
          path="/dashboard"
          query={query}
          page={table.page}
          pages={table.pages}
          total={table.total}
        />
      </section>
    </>
  );
}
