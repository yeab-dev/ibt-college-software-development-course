"use client";

import Link from "next/link";
import PropTypes from "prop-types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CategoryBar from "./CategoryBar";
import DishList from "./DishList";
import SearchBar from "./SearchBar";

const CATEGORIES = ["All", "Main", "Side", "Drink", "Dessert"];

// The interactive half of Day 33's Menu.jsx. The page (a server component)
// already has every dish; this part only filters them, so it needs state,
// effects and a ref — which is what makes it a client component.
//
// Because it is not page.js, it is not a route. It sits beside the page that
// uses it and nothing else can reach it.
function MenuBrowser({ dishes }) {
  // The category still lives in the query string, so /menu?category=Drink is a
  // real, shareable address. useSearchParams comes from next/navigation now,
  // and it only reads — Next.js has no setter like React Router's.
  const params = useSearchParams();
  const requested = params.get("category") ?? "All";
  const category = CATEGORIES.includes(requested) ? requested : "All";

  // The search term stays in ordinary state. A URL is public and permanent;
  // half-typed text does not belong in it.
  const [search, setSearch] = useState("");

  const searchInput = useRef(null);

  useEffect(() => {
    searchInput.current.focus();
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

  function chooseCategory(next) {
    // router.replace() would ask the server to render /menu again — another
    // 900 ms read and the loading skeleton, just to filter a list we already
    // hold. Next.js also listens to the browser's own history API: replacing
    // the URL this way updates useSearchParams above with no server trip.
    // Replace, not push, for the same reason as Day 31: five categories should
    // not cost five presses of Back.
    const query = next === "All" ? "" : `?category=${next}`;
    window.history.replaceState(null, "", `/menu${query}`);
  }

  return (
    <>
      <CategoryBar
        categories={CATEGORIES}
        selectedCategory={category}
        onSelectCategory={chooseCategory}
      />

      <SearchBar ref={searchInput} value={search} onChange={setSearch} />

      {/* DishList moved across unchanged, props and all. Its loading and
          error branches are simply never taken any more: by the time this
          renders the data has arrived, and a failed read never gets this far —
          loading.js and error.js handle those two states for the whole
          segment. onRetry is required by its propTypes, so it gets the
          nearest honest equivalent: clear the search. */}
      <DishList
        dishes={visibleDishes}
        isLoading={false}
        error={null}
        searchTerm={search}
        category={category}
        onRetry={() => setSearch("")}
      />

      <footer className="menu__footer">
        {/* Was a checkbox that flipped state. Now it is an address: the server
            reads ?fail=1, the read throws, and app/menu/error.js takes over. */}
        <Link className="menu__switch" href="/menu?fail=1">
          Simulate a broken kitchen
        </Link>
      </footer>
    </>
  );
}

MenuBrowser.propTypes = {
  dishes: PropTypes.array.isRequired,
};

export default MenuBrowser;
