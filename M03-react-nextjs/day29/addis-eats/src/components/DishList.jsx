import PropTypes from "prop-types";
import Dish from "./Dish";

function DishList({
  dishes,
  isLoading,
  error,
  searchTerm,
  category,
  onAdd,
  onRetry,
}) {
  // Early return #1: the request is still in the air.
  if (isLoading) {
    return (
      <p className="state" role="status">
        Loading the {category.toLowerCase()} menu&hellip;
      </p>
    );
  }

  // Early return #2: the request finished badly. Say what went wrong and give
  // the user a way out.
  if (error) {
    return (
      <div className="state state--error" role="alert">
        <p>{error}</p>
        <button type="button" className="state__retry" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  // Early return #3: the request worked, there is just nothing to show.
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
          <Dish dish={dish} onAdd={onAdd} />
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
  onAdd: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
};

export default DishList;
