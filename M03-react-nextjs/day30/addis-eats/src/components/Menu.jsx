import { useEffect, useMemo, useRef, useState } from "react";
import CategoryBar from "./CategoryBar";
import SearchBar from "./SearchBar";
import DishList from "./DishList";
import { useFetch } from "../hooks/useFetch";

const CATEGORIES = ["All", "Main", "Side", "Drink", "Dessert"];
const SORTS = [
  { id: "name", label: "Name" },
  { id: "price-asc", label: "Cheapest first" },
  { id: "price-desc", label: "Dearest first" },
];

function Menu() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [breakTheKitchen, setBreakTheKitchen] = useState(false);

  const searchInput = useRef(null);

  useEffect(() => {
    searchInput.current.focus();
  }, []);

  // Everything Day 29 wrote by hand inside this component — the three state
  // variables, the AbortController, the res.ok check, the cleanup — is now one
  // line. The logic did not get smaller; it moved somewhere it can be reused.
  const query = new URLSearchParams({ category });
  if (breakTheKitchen) query.set("fail", "1");

  const {
    data: dishes,
    isLoading,
    error,
    refetch,
  } = useFetch(`/api/menu?${query}`);

  // useMemo, earning its place. Filtering and sorting thirteen dishes is not
  // expensive, but this list is rebuilt on *every* render of Menu — including
  // the ones caused by typing a single character. The memo means the work only
  // happens when something it actually depends on changes.
  //
  // Check the claim in the Profiler before believing it. On a list this small
  // the honest answer is that it makes no measurable difference; the habit is
  // what is being practised here, not the saving.
  const visibleDishes = useMemo(() => {
    if (!dishes) return [];

    const term = search.trim().toLowerCase();
    const matching = term
      ? dishes.filter((dish) => dish.name.toLowerCase().includes(term))
      : dishes;

    // toSorted, not sort: sort mutates, and `dishes` is state we do not own.
    switch (sort) {
      case "price-asc":
        return matching.toSorted((a, b) => a.price - b.price);
      case "price-desc":
        return matching.toSorted((a, b) => b.price - a.price);
      default:
        return matching.toSorted((a, b) => a.name.localeCompare(b.name));
    }
  }, [dishes, search, sort]);

  function handleRetry() {
    setBreakTheKitchen(false);
    refetch();
  }

  return (
    <main className="menu">
      <CategoryBar
        categories={CATEGORIES}
        selectedCategory={category}
        onSelectCategory={setCategory}
      />

      <SearchBar ref={searchInput} value={search} onChange={setSearch} />

      <div className="sort">
        <label className="sort__label" htmlFor="dish-sort">
          Sort by
        </label>
        <select
          id="dish-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          {SORTS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <DishList
        dishes={visibleDishes}
        isLoading={isLoading}
        error={error}
        searchTerm={search}
        category={category}
        onRetry={handleRetry}
      />

      <footer className="menu__footer">
        <label className="menu__switch">
          <input
            type="checkbox"
            checked={breakTheKitchen}
            onChange={(event) => setBreakTheKitchen(event.target.checked)}
          />
          Simulate a broken kitchen
        </label>
      </footer>
    </main>
  );
}

export default Menu;
