import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryBar from "../components/CategoryBar";
import DishList from "../components/DishList";
import SearchBar from "../components/SearchBar";
import { useFetch } from "../hooks/useFetch";

const CATEGORIES = ["All", "Main", "Side", "Drink", "Dessert"];

function Menu() {
  // The category used to be useState. It is now in the query string, which
  // makes /menu?category=Drink a real address: shareable, bookmarkable, and
  // still correct after a refresh or a back button.
  //
  // useSearchParams works like useState — a value and a setter — except the
  // value lives in the URL.
  const [params, setParams] = useSearchParams();
  const requested = params.get("category") ?? "All";
  const category = CATEGORIES.includes(requested) ? requested : "All";

  // The search term stays in ordinary state. A URL is public and permanent;
  // filters and pagination belong there, half-typed text does not.
  const [search, setSearch] = useState("");
  const [breakTheKitchen, setBreakTheKitchen] = useState(false);

  const searchInput = useRef(null);

  useEffect(() => {
    searchInput.current.focus();
  }, []);

  const query = new URLSearchParams({ category });
  if (breakTheKitchen) query.set("fail", "1");

  const {
    data: dishes,
    isLoading,
    error,
    refetch,
  } = useFetch(`/api/menu?${query}`);

  const visibleDishes = useMemo(() => {
    if (!dishes) return [];
    const term = search.trim().toLowerCase();
    return term
      ? dishes.filter((dish) => dish.name.toLowerCase().includes(term))
      : dishes;
  }, [dishes, search]);

  function chooseCategory(next) {
    // replace: true keeps the back button useful. Without it, clicking through
    // five categories means five presses of Back to leave the menu.
    setParams(next === "All" ? {} : { category: next }, { replace: true });
  }

  function handleRetry() {
    setBreakTheKitchen(false);
    refetch();
  }

  return (
    <main className="menu">
      <h2>The menu</h2>

      <CategoryBar
        categories={CATEGORIES}
        selectedCategory={category}
        onSelectCategory={chooseCategory}
      />

      <SearchBar ref={searchInput} value={search} onChange={setSearch} />

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
