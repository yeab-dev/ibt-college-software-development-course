"use client";

import PropTypes from "prop-types";
import { createContext, use, useEffect, useMemo, useRef, useState } from "react";
import { useMenuFilter } from "./MenuFilterProvider";
import { readMenuUrl, writeMenuUrl } from "./menuUrl";
import Pager from "./Pager";
import SearchBar from "./SearchBar";
import { useDebounce } from "./useDebounce";
import { useDishSearch } from "./useDishSearch";

// Step 6. The client shell around a server-rendered list.
//
// page.js (a server component) writes
//
//     <FilterShell index={…}>
//       <DishList dishes={dishes} />
//     </FilterShell>
//
// so DishList is *passed in*, already rendered, not imported. This file never
// mentions DishList or Dish, and their code cannot end up in its bundle. Had
// FilterShell imported DishList instead, "use client" would have spread down
// into it, into Dish, and into everything they import — which is exactly what
// Day 37's MenuBrowser did.
//
// What the shell keeps is only what the browser must: the search term, the
// page, the broken-kitchen switch, the focus on the search box, and the
// decision of which dishes are visible.
//
// Day 41: the search is a query now. Day 40 matched the term against the
// dish names it was handed in `index`, in the browser. Today the term goes to
// GET /api/dishes?q=…, debounced, through SWR (useDishSearch.js), and the
// server answers with a page of matching dishes — names *and* descriptions,
// so "chickpea" finds Shiro. The answer only says *which* dishes; the cards
// shown are still the server-rendered ones, so a search never draws a card in
// the browser and the cards' code still never ships. An empty box asks
// nothing (a null key), and the list is the server's, by category, as before.
const VisibleContext = createContext(null);

const DEBOUNCE_MS = 300;

function FilterShell({ index, children }) {
  // The category is the menu layout's state (MenuFilterProvider), chosen in
  // the sidebar. The search term and the page are this page's.
  const { category } = useMenuFilter();
  const [term, setTerm] = useState("");

  // The query only hears about the term once typing pauses. An empty box is
  // the exception: it asks nothing (a null key), so there is nothing to
  // wait for, and clearing the box brings the server's list back at once.
  const debounced = useDebounce(term.trim(), DEBOUNCE_MS);
  const q = term.trim() === "" ? "" : debounced;

  // A page number belongs to one search: page 2 of "on" in Main means
  // nothing for "on" in Drink. So it is stored with the search it was chosen
  // for, and any other search starts on page 1 — no effect to reset it.
  const searchId = `${category}|${q}`;
  const [chosenPage, setChosenPage] = useState({ searchId: null, page: 1 });
  const page = chosenPage.searchId === searchId ? chosenPage.page : 1;

  const { results, error, searching } = useDishSearch({ q, category, page });

  // The broken kitchen (Day 37): state, and a throw during render, which
  // app/menu/error.js catches.
  const [broken, setBroken] = useState(false);

  const searchInput = useRef(null);

  // Once, after hydration: a shared link (/menu?q=on&page=2) restores its
  // search and page. The prerendered HTML cannot know the query string, so
  // this is the first moment it can be read. (The category is restored by
  // MenuFilterProvider the same way.) Then focus the box, as before.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const fromUrl = readMenuUrl();
    if (fromUrl.q) {
      /* eslint-disable react-hooks/set-state-in-effect -- syncing from the URL, an external system, exactly once */
      setTerm(fromUrl.q);
      setChosenPage({ searchId: `${fromUrl.category}|${fromUrl.q.trim()}`, page: fromUrl.page });
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    searchInput.current?.focus();
  }, []);

  // The address follows the results on screen: the term once it has been
  // searched for, and the page. Not before the restore (it would wipe the
  // link being restored), and not while the debounce is still waiting.
  const settled = q === term.trim();
  useEffect(() => {
    if (!restored || !settled) return;
    writeMenuUrl({ q, page });
  }, [restored, settled, q, page]);

  const visibleIds = useMemo(() => {
    // A search answer, for this search or (keepPreviousData) the one before.
    if (results) {
      return new Set(results.dishes.map((dish) => dish.id));
    }
    // No search, or the very first answer is still on its way: the server's
    // list, by category. Never an empty list while waiting.
    return new Set(
      index
        .filter((dish) => category === "All" || dish.category === category)
        .map((dish) => dish.id),
    );
  }, [index, category, results]);

  if (broken) {
    throw new Error("The kitchen is offline.");
  }

  function choosePage(next) {
    setChosenPage({ searchId, page: next });
  }

  return (
    <>
      <SearchBar ref={searchInput} value={term} onChange={setTerm} />

      {/* What the search is doing, said once, for screen readers too. */}
      <p className="search__status" role="status">
        {q && searching && <>Searching for &ldquo;{q}&rdquo;…</>}
        {q && !searching && error && <>Could not search: {error.message}</>}
        {q && !searching && !error && results && results.total > 0 && (
          <>
            {results.total} {results.total === 1 ? "dish matches" : "dishes match"} &ldquo;{q}&rdquo;
            {results.pages > 1 && <> · page {results.page} of {results.pages}</>}
          </>
        )}
      </p>

      <VisibleContext value={visibleIds}>{children}</VisibleContext>

      {/* Day 33's empty states. Only the browser knows what was typed, so
          they live here. */}
      {visibleIds.size === 0 && (
        <p className="state">
          {results && results.total > 0
            ? `There is no page ${results.page} — “${q}” has ${results.pages}.`
            : q
              ? `No dish here matches “${q}”.`
              : "This part of the kitchen is empty today."}
        </p>
      )}

      {results && results.pages > 1 && (
        <Pager
          category={category}
          q={q}
          page={page}
          pages={results.pages}
          onChoose={choosePage}
          busy={searching}
        />
      )}

      <footer className="menu__footer">
        <button
          type="button"
          className="menu__switch"
          onClick={() => setBroken(true)}
        >
          Simulate a broken kitchen
        </button>
      </footer>
    </>
  );
}

FilterShell.propTypes = {
  index: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      category: PropTypes.string.isRequired,
    }),
  ).isRequired,
  children: PropTypes.node.isRequired,
};

// One list item, shown or hidden. A client component — it reads context — but
// all it renders of its own is the <li>; the card inside is `children`, server
// HTML it was handed. On the server, and in the browser's first render, every
// item is visible (category "All", no search), so the HTML and hydration agree.
export function FilterItem({ id, children }) {
  const visibleIds = use(VisibleContext);
  return <li hidden={visibleIds ? !visibleIds.has(id) : false}>{children}</li>;
}

FilterItem.propTypes = {
  id: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
};

export default FilterShell;
