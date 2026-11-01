import PropTypes from "prop-types";
import { menuHref } from "./menuUrl";

// Day 41. Numbered pages of search results.
//
// Each page is a real link with the page in its query string
// (/menu?q=on&page=2), so it can be copied, opened in a new tab, or sent to
// someone — FilterShell restores it on arrival. A plain click stays on this
// page: it only changes the page number, which changes the query's key, and
// SWR fetches that page while keepPreviousData holds the current one on
// screen. No navigation, no flash of an empty list.
//
// No directive: FilterShell, a client component, is its only importer.
function Pager({ category, q, page, pages, onChoose, busy }) {
  function follow(event, target) {
    // Ctrl-, Cmd- or Shift-click, or the middle button: the person wants a
    // new tab or window, which is exactly what the href is for.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    onChoose(target);
  }

  const numbers = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <nav className="pager" aria-label="Search result pages" aria-busy={busy}>
      {page > 1 && (
        <a className="pager__link" href={menuHref({ category, q, page: page - 1 })} onClick={(e) => follow(e, page - 1)} rel="prev">
          ← Previous
        </a>
      )}
      {numbers.map((n) => (
        <a
          key={n}
          className={n === page ? "pager__link pager__link--current" : "pager__link"}
          href={menuHref({ category, q, page: n })}
          aria-current={n === page ? "page" : undefined}
          onClick={(e) => follow(e, n)}
        >
          {n}
        </a>
      ))}
      {page < pages && (
        <a className="pager__link" href={menuHref({ category, q, page: page + 1 })} onClick={(e) => follow(e, page + 1)} rel="next">
          Next →
        </a>
      )}
    </nav>
  );
}

Pager.propTypes = {
  category: PropTypes.string.isRequired,
  q: PropTypes.string.isRequired,
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  onChoose: PropTypes.func.isRequired,
  busy: PropTypes.bool.isRequired,
};

export default Pager;
