import { useEffect, useRef, useState } from "react";
import CategoryBar from "./CategoryBar";
import SearchBar from "./SearchBar";
import DishList from "./DishList";

const CATEGORIES = ["All", "Main", "Side", "Drink", "Dessert"];

function Menu() {
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  // Two switches that exist only so the loading and error states are easy to
  // see: one asks the mock API to fail, the other forces a fresh request.
  const [breakTheKitchen, setBreakTheKitchen] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const searchInput = useRef(null);

  // Runs once, after the first paint: put the cursor in the search box so the
  // page is usable from the keyboard straight away.
  useEffect(() => {
    searchInput.current.focus();
  }, []);

  // Started as a fetch with [] — an empty dependency array, run once. Adding
  // `category` to that array is what turns it into a refetch: React runs the
  // cleanup for the old category, then the effect again for the new one.
  useEffect(() => {
    const controller = new AbortController();

    async function loadDishes() {
      setIsLoading(true);
      setError(null);

      const query = new URLSearchParams({ category });
      if (breakTheKitchen) {
        query.set("fail", "1");
      }

      try {
        const res = await fetch(`/api/menu?${query}`, {
          signal: controller.signal,
        });

        // fetch only rejects when the network itself fails, so a 404 or a 503
        // arrives here as a perfectly resolved promise. Check res.ok yourself.
        if (!res.ok) {
          throw new Error(
            `Could not load the ${category} menu — the server answered ${res.status}.`,
          );
        }

        const data = await res.json();
        setDishes(data);
        setIsLoading(false);
      } catch (err) {
        // An abort is not a failure: the category changed (or the component
        // unmounted) before the answer came back. A newer request is already
        // in flight, so leave the state to it.
        if (err.name === "AbortError") {
          console.log(`Cancelled the request for "${category}"`);
          return;
        }

        setError(err.message);
        setIsLoading(false);
      }
    }

    loadDishes();

    // Cleanup: cancel the request this effect started. Without it, a slow
    // answer for "Main" could land after a fast one for "Drink" and overwrite
    // the list the user is actually looking at.
    return () => controller.abort();
  }, [category, breakTheKitchen, reloadCount]);

  // The category is fetched from the server; the search term filters what we
  // already have. Typing should never hit the network.
  const term = search.trim().toLowerCase();
  const visibleDishes = term
    ? dishes.filter((dish) => dish.name.toLowerCase().includes(term))
    : dishes;

  function handleAdd(price) {
    setTotal((currentTotal) => currentTotal + price);
  }

  function handleRetry() {
    setBreakTheKitchen(false);
    setReloadCount((count) => count + 1);
  }

  // Note that loading and error are handled inside DishList rather than here.
  // If Menu returned early, the search box would be unmounted — the ref would
  // have nothing to focus, and the category buttons would vanish on every
  // refetch.
  return (
    <main className="menu">
      <header className="menu__header">
        <h1>Addis Eats</h1>
        <p className="menu__tagline">
          Today&rsquo;s kitchen, served straight from the API.
        </p>
      </header>

      <CategoryBar
        categories={CATEGORIES}
        selectedCategory={category}
        onSelectCategory={setCategory}
      />

      <SearchBar ref={searchInput} value={search} onChange={setSearch} />

      <DishList
        dishes={visibleDishes}
        isLoading={isLoading}
        error={error}
        searchTerm={search}
        category={category}
        onAdd={handleAdd}
        onRetry={handleRetry}
      />

      <footer className="menu__footer">
        <p className="menu__total">
          Order total: <strong>{total} ETB</strong>
        </p>

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
