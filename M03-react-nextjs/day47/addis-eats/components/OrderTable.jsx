import Link from "next/link";
import { etb, when } from "@/lib/format";
import { orderStage, STAGE_LABEL } from "@/lib/orderStage";
import { SORTS } from "@/lib/orders";
import { tableHref } from "@/lib/tableQuery";

// Day 46. One page of orders, as a real table.
//
// A server component — no directive. A read-only table has no state and no
// handlers, so it ships no JavaScript: the sort headers and the pager are
// plain links, and the server renders the next state of the table when one
// is followed. Two pages use it: /orders (one person's own, linked to each
// receipt) and /dashboard (every order, staff only, with a customer column).
//
// What makes it a table rather than a picture of one:
//
//   <caption>      names the table and says how it is sorted — a screen
//                  reader announces it when the table is entered
//   <thead>, <th scope="col">   each cell is read with its column's name
//   <th scope="row">            ...and with its row's name, the order number
//   aria-sort      on the sorted column's header, and only there: "Total,
//                  sorted descending". Without it nobody hearing the table
//                  knows the order changed
//
// The column rules from the sheet: text left, numbers right, tabular figures
// for money (globals.css, .orders-table), the most important column first,
// six columns at most. On a narrow screen the table scrolls sideways inside a
// labelled region instead of shrinking its text.
//
// Copy it into a spreadsheet and it arrives as rows and columns, because it
// is rows and columns.

const COLUMNS = {
  date: "Placed",
  area: "Neighbourhood",
  total: "Total",
};

const SORT_WORDS = {
  date: { desc: "most recent first", asc: "oldest first" },
  area: { asc: "neighbourhood A to Z", desc: "neighbourhood Z to A" },
  total: { desc: "largest total first", asc: "smallest total first" },
};

function SortHeader({ column, path, query, className }) {
  const active = query.sort === column;
  // Following the active column's link reverses it; another column starts in
  // its own natural direction. Either way back to page one: page three of a
  // different order is a different set of rows.
  const dir = active ? (query.dir === "asc" ? "desc" : "asc") : SORTS[column];
  const href = tableHref(path, { sort: column, dir, page: 1 });
  return (
    <th
      scope="col"
      className={className}
      aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : undefined}
    >
      <Link href={href} className="sort-link" scroll={false}>
        {COLUMNS[column]}
        {/* The arrow is for eyes; aria-sort already says it to ears. */}
        <span aria-hidden="true" className="sort-link__arrow">
          {active ? (query.dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
        <span className="visually-hidden">, sort {SORT_WORDS[column][dir]}</span>
      </Link>
    </th>
  );
}

export default function OrderTable({ id, title, rows, query, path, page, pages, showCustomer = false, linkToReceipt = false }) {
  const captionId = `${id}-caption`;

  return (
    <div className="table-scroll" role="region" aria-labelledby={captionId} tabIndex={0}>
      <table className="orders-table">
        <caption id={captionId}>
          {title}, {SORT_WORDS[query.sort][query.dir]} — page {page} of {pages}
        </caption>
        <thead>
          <tr>
            <th scope="col">Order</th>
            <SortHeader column="date" path={path} query={query} />
            {showCustomer && <th scope="col">Customer</th>}
            <SortHeader column="area" path={path} query={query} />
            <th scope="col">Status</th>
            <SortHeader column="total" path={path} query={query} className="num" />
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id} className={order.status === "cancelled" ? "orders-table__cancelled" : undefined}>
              <th scope="row">
                {linkToReceipt ? <Link href={`/orders/${order.id}`}>#{order.id}</Link> : `#${order.id}`}
              </th>
              <td>
                <time dateTime={order.placedAt}>{when(order.placedAt)}</time>
              </td>
              {/* First name only, as on the kitchen board: staff need to
                  know whose order it is, not their phone number. */}
              {showCustomer && <td>{order.name.split(" ")[0]}</td>}
              <td>{order.area}</td>
              {/* A word, not a colour: "Cancelled" reads the same in
                  greyscale. */}
              <td>{STAGE_LABEL[orderStage(order)]}</td>
              <td className="num">{etb(order.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
