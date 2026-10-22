import PropTypes from "prop-types";
import Dish from "./Dish";

function DishList({ dishes, isLoading, error, searchTerm, category, onRetry }) {
  if (isLoading) {
    return (
      <p className="state" role="status">
        Loading the {category.toLowerCase()} menu&hellip;
      </p>
    );
  }

  if (error) {
    return (
      <div className="state state--error" role="alert">
        <p>Could not load the {category.toLowerCase()} menu. {error}</p>
        <button type="button" className="state__retry" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (dishes.length === 0) {
    return (
      <p className="state">
        {searchTerm
          ? `No dish here matches “${searchTerm}”.`
          : "This part of the kitchen is empty today."}
      </p>
    );
  }

  return (
    <ul className="dishes">
      {dishes.map((dish) => (
        <li key={dish.id}>
          <Dish dish={dish} />
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
