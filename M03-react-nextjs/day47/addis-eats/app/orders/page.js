import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import OrderTable from "@/components/OrderTable";
import PageLinks from "@/components/PageLinks";
import TableSkeleton from "@/components/TableSkeleton";
import { applyDemoState, demoState } from "@/lib/demoState";
import { pageOrdersFor } from "@/lib/orders";
import { getSession } from "@/lib/session";
import { privatePage } from "@/lib/site";
import { readTableQuery } from "@/lib/tableQuery";

// "/orders" — your orders, and nobody else's.
//
// Day 39–41 this address was the kitchen board: every order, the same page
// for everyone, static and rebuilt by revalidatePath. Day 42 splits it in
// two. The board moved to /kitchen, for staff only, and this became the
// slides' own example page:
//
//     const user = await getSession();
//     if (!user) redirect("/login?next=/orders");
//     const orders = await getOrdersFor(user.id);
//
// The important line is the query. It is given the session's account id,
// not anything from the request, so no URL, query string or form field can
// make it return someone else's orders.
//
// Dynamic (ƒ): it depends on who is asking. The proxy has already turned a
// visitor with no session cookie away (proxy.js); this check is the one
// that verifies the cookie is a real, live session.
//
// Day 46: the list became a table — one page of twenty, sorted and paged
// from the address (/orders?sort=total&page=3), with the empty state a
// brand-new customer sees and a loading state while the page is read. The
// query is still the session's: pageOrdersFor(user.id, …) takes the sort and
// the page from the URL and the owner from the session.
//
// The skeleton is a <Suspense> boundary *after* the session check, not the
// course's app/orders/loading.js. A loading.js here would wrap this page
// and every receipt under it, start each response with a 200, and turn the
// receipt's notFound() — the 404 a stranger gets for someone else's order —
// into a streamed 200 (Next.js docs, loading.md, "Status codes").
//
// Day 44: a title and a description for the person who has the tab open,
// and `noindex`: this page is one person's own, so it has no business in
// search results (lib/site.js). robots.js disallows it as well.
export const metadata = privatePage({
  title: "Your orders",
  description: "Every order you have placed with Addis Eats, newest first, with where each one is now.",
});

export default async function MyOrdersPage({ searchParams }) {
  const user = await getSession();
  if (!user) {
    redirect("/login?next=/orders");
  }

  const params = await searchParams;
  const query = readTableQuery(params);
  const state = demoState(params);

  return (
    <main className="prose prose--table">
      <h1>Your orders</h1>
      <p>
        Signed in as <strong>{user.name}</strong> ({user.phone}).
        {/* Interface, not security: /kitchen and /dashboard check the role
            themselves. */}
        {user.role === "staff" && (
          <>
            {" "}
            <Link href="/kitchen">Open the kitchen board</Link> ·{" "}
            <Link href="/dashboard">the dashboard</Link>
          </>
        )}
      </p>

      <Suspense fallback={<TableSkeleton label="Loading your orders…" />}>
        <OrderHistory userId={user.id} query={query} state={state} />
      </Suspense>
    </main>
  );
}

async function OrderHistory({ userId, query, state }) {
  await applyDemoState(state); // ?state=loading waits, ?state=error throws
  const { rows, total, page, pages } =
    state === "empty" ? { rows: [], total: 0, page: 1, pages: 1 } : await pageOrdersFor(userId, query);

  // What a brand-new customer sees: why it is empty, and the way out. Not
  // "No data", and not an empty table with headers and no rows.
  if (total === 0) {
    return (
      <div className="state">
        <p>
          <strong>No orders yet</strong> — browse the menu to place your first. It will be listed
          here, with where it has got to.
        </p>
        <p>
          <Link className="cta" href="/menu">
            Browse the menu
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <OrderTable
        id="your-orders"
        title="Your orders"
        rows={rows}
        query={query}
        path="/orders"
        page={page}
        pages={pages}
        linkToReceipt
      />
      <PageLinks label="Your order pages" path="/orders" query={query} page={page} pages={pages} total={total} />
      {/* Day 47: every order of yours, not just this page. The handler takes
          the owner from the session, like this page does. */}
      <p>
        <a className="export-link" href="/api/orders/export" download>
          Download your orders (CSV, {total} {total === 1 ? "row" : "rows"})
        </a>
      </p>
    </>
  );
}
