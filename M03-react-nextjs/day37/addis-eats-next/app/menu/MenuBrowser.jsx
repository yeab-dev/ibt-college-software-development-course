"use client";

import PropTypes from "prop-types";
import { useEffect, useMemo, useRef, useState } from "react";
import DishList from "./DishList";
import { useMenuFilter } from "./MenuFilterProvider";
import SearchBar from "./SearchBar";

// The interactive half of the menu. The page (a server component) already has
// every dish; this part only filters them, so it needs state, effects and a
// ref — which is what makes it a client component.
//
// Day 37: the category is no longer chosen here. CategoryBar moved into the
// menu layout's sidebar, and the choice arrives through useMenuFilter() — the
// layout's state. The search term stays here, in the page: it is fine for it
// to reset when you leave the list.
function MenuBrowser({ dishes }) {
  const { category } = useMenuFilter();

  // The search term stays in ordinary state. A URL is public and permanent;
  // half-typed text does not belong in it.
  const [search, setSearch] = useState("");

  // The broken kitchen. Day 36 threw on the server for /menu?fail=1, but a
  // static page cannot read the query string. So the switch is state, and the
  // throw happens while rendering in the browser — app/menu/error.js catches a
  // render error from a client component exactly as it caught the server's.
  const [broken, setBroken] = useState(false);

  const searchInput = useRef(null);

  useEffect(() => {
    searchInput.current?.focus();
  }, []);

  const visibleDishes = useMemo(() => {
    const inCategory =
      category === "All"
        ? dishes
        : dishes.filter((dish) => dish.category === category);
    const term = search.trim().toLowerCase();
    return term
      ? inCategory.filter((dish) => dish.name.toLowerCase().includes(term))
      : inCategory;
  }, [dishes, category, search]);

  if (broken) {
    throw new Error("The kitchen is offline.");
  }

  return (
    <>
      <SearchBar ref={searchInput} value={search} onChange={setSearch} />

      {/* DishList moved across unchanged, props and all. Its loading and
          error branches are never taken: the Suspense boundary in page.js
          covers the wait, and error.js covers the failure. onRetry is
          required by its propTypes, so it gets the nearest honest
          equivalent: clear the search. */}
      <DishList
        dishes={visibleDishes}
        isLoading={false}
        error={null}
        searchTerm={search}
        category={category}
        onRetry={() => setSearch("")}
      />

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

MenuBrowser.propTypes = {
  dishes: PropTypes.array.isRequired,
};

export default MenuBrowser;
