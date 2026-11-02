import Link from "next/link";
import { tableHref } from "@/lib/tableQuery";

// Day 46. Numbered pages for a server-rendered table.
//
// Every page is a real <Link> to a real address (/orders?sort=total&page=3):
// the back button returns to it, a middle-click opens it in a new tab, it can
// be pasted into a message, and following one is an ordinary navigation that
// the server answers with that page's twenty rows. Day 41's menu pager is
// different on purpose — it pages results the browser already fetched — so
// this is a new, smaller component rather than a branch in that one.
//
// A server component: there is nothing to click-handle. Link prefetches the
// neighbouring pages when they scroll into view, so the next page is usually
// already there.
//
// Eighteen numbered links would be a wall, so it shows the first and the
// last page, two either side of the current one, and an ellipsis for each
// gap.

function windowOf(page, pages) {
  const shown = new Set([1, pages]);
  for (let n = page - 2; n <= page + 2; n += 1) {
    if (n >= 1 && n <= pages) shown.add(n);
  }
  const sorted = [...shown].sort((a, b) => a - b);
  const items = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push(`gap-${n}`);
    items.push(n);
  });
  return items;
}

export default function PageLinks({ label, path, query, page, pages, total }) {
  if (pages <= 1) return null;
  const href = (n) => tableHref(path, { ...query, page: n });

  return (
    <nav className="pager" aria-label={label}>
      {page > 1 && (
        <Link className="pager__link" href={href(page - 1)} rel="prev">
          ← Previous
        </Link>
      )}
      {windowOf(page, pages).map((item) =>
        typeof item === "string" ? (
          <span key={item} className="pager__gap" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={item}
            className={item === page ? "pager__link pager__link--current" : "pager__link"}
            href={href(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
          >
            {item}
          </Link>
        ),
      )}
      {page < pages && (
        <Link className="pager__link" href={href(page + 1)} rel="next">
          Next →
        </Link>
      )}
      <span className="pager__count">{total} orders</span>
    </nav>
  );
}
