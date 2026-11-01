import { useState } from "react";
import PropTypes from "prop-types";
import Card from "./Card";

function Dish({ dish, onAdd }) {
  const [count, setCount] = useState(0);

  function handleAdd() {
    setCount((currentCount) => currentCount + 1);
    onAdd(dish.price);
  }

  return (
    <Card>
      <h2>{dish.name}</h2>
      <p>
        {dish.price} {dish.currency}
      </p>

      {dish.spicy === true && <span>🌶️ Spicy</span>}

      <button onClick={handleAdd}>Add</button>

      <p>Added: {count}</p>
    </Card>
  );
}

Dish.propTypes = {
  dish: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    spicy: PropTypes.bool,
    currency: PropTypes.string,
  }).isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default Dish;
