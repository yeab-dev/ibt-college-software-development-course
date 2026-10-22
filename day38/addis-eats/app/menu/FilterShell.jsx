"use client";

import PropTypes from "prop-types";
import { createContext, use, useEffect, useMemo, useRef, useState } from "react";
import { useMenuFilter } from "./MenuFilterProvider";
import SearchBar from "./SearchBar";

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
// broken-kitchen switch, the focus on the search box, and the decision of
// which dishes are visible. For that it needs a little data about each dish —
// `index`, a plain array of { id, name, category } — not the dishes' markup.
const VisibleContext = createContext(null);

function FilterShell({ index, children }) {
  // The category is the menu layout's state (MenuFilterProvider), chosen in
  // the sidebar. The search term is this page's.
  const { category } = useMenuFilter();
  const [search, setSearch] = useState("");

  // The broken kitchen (Day 37): state, and a throw during render, which
  // app/menu/error.js catches.
  const [broken, setBroken] = useState(false);

  const searchInput = useRef(null);

  useEffect(() => {
    searchInput.current?.focus();
  }, []);

  const visibleIds = useMemo(() => {
    const term = search.trim().toLowerCase();
    return new Set(
      index
        .filter((dish) => category === "All" || dish.category === category)
        .filter((dish) => !term || dish.name.toLowerCase().includes(term))
        .map((dish) => dish.id),
    );
  }, [index, category, search]);

  if (broken) {
    throw new Error("The kitchen is offline.");
  }

  return (
    <>
      <SearchBar ref={searchInput} value={search} onChange={setSearch} />

      <VisibleContext value={visibleIds}>{children}</VisibleContext>

      {/* Day 33's empty states, which used to be DishList's. Only the browser
          knows what was typed, so they live here now. */}
      {visibleIds.size === 0 && (
        <p className="state">
          {search.trim()
            ? `No dish here matches “${search}”.`
            : "This part of the kitchen is empty today."}
        </p>
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
      name: PropTypes.string.isRequired,
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
