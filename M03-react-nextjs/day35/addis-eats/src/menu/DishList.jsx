import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Probe from "../dev/Probe";
import Dish from "./Dish";

function DishList({ dishes, isLoading, error, searchTerm, category, onRetry }) {
  // "the menu" or "the drink menu" — never "the all menu".
  const which = category === "All" ? "menu" : `${category.toLowerCase()} menu`;

  if (isLoading) {
    return (
      <p className="state" role="status">
        Loading the {which}&hellip;
      </p>
    );
  }

  if (error) {
    return (
      <div className="state state--error" role="alert">
        <p>Could not load the {which}. {error}</p>
        <button type="button" className="state__retry" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  // Empty is not an error: the request worked and the answer was "none".
  // Say so in a friendly voice, and offer the way out.
  if (dishes.length === 0) {
    return (
      <div className="state">
        <p>
          {searchTerm
            ? `No dish here matches “${searchTerm}”.`
            : `Nothing in ${category} yet. This part of the kitchen is empty today.`}
        </p>
        {category !== "All" && (
          <p>
            <Link to="/menu">See the whole menu</Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="dishes">
      {dishes.map((dish) => (
        <li key={dish.id}>
          <Probe id={`Dish:${dish.slug}`}>
            <Dish dish={dish} />
          </Probe>
        </li>
      ))}
    </ul>
  );
}

DishList.propTypes = {
  dishes: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  searchTerm: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

export default DishList;
