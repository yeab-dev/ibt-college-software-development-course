import PropTypes from "prop-types";
import Dish from "./Dish";

function DishList({
  dishes,
  category,
  onAdd,
}) {
  const filteredDishes =
    category === "All"
      ? dishes
      : dishes.filter(
          (dish) =>
            dish.category === category
        );

  if (filteredDishes.length === 0) {
    return (
      <p>
        No dishes found in this category.
      </p>
    );
  }

  return (
    <div>
      {filteredDishes.map((dish) => (
        <Dish
          key={dish.id}
          dish={dish}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}

DishList.propTypes = {
  dishes: PropTypes.array.isRequired,
  category: PropTypes.string.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default DishList;