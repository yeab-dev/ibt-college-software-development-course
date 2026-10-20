import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";

function Home() {
  // Day 30's hook, unchanged. Each screen that calls it gets its own
  // independent data, isLoading and error.
  const { data: dishes, isLoading, error } = useFetch("/api/menu?category=All");

  const specials = dishes ? dishes.slice(0, 3) : [];

  return (
    <main className="prose">
      <h2>Today at the kitchen</h2>
      <p>
        Injera off the mitad, buna from the jebena, and a berbere pot that has
        been going since morning.
      </p>

      {isLoading && (
        <p className="state" role="status">
          Loading today&rsquo;s specials&hellip;
        </p>
      )}

      {error && (
        <p className="state state--error" role="alert">
          Could not load the specials. {error}
        </p>
      )}

      {specials.length > 0 && (
        <ul className="specials">
          {specials.map((dish) => (
            <li key={dish.id}>
              {/* A dynamic route, linked to. The slug in the URL is what the
                  next screen reads; the key prop is React's own bookkeeping.
                  They come from the same record and do completely different
                  jobs. */}
              <Link to={`/menu/${dish.slug}`}>
                {dish.name} · {dish.price} {dish.currency}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link className="cta" to="/menu">
          See the full menu
        </Link>
      </p>
    </main>
  );
}

export default Home;
