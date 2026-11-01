import { useState } from "react";
import PropTypes from "prop-types";

function Dish({ dish, onAdd }) {
  const [count, setCount] = useState(0);

  function handleAdd() {
    setCount((currentCount) => currentCount + 1);
    onAdd(dish.price);
  }

  return (
    <article className="dish">
      <div className="dish__head">
        <h2>{dish.name}</h2>
        <p className="dish__price">
          {dish.price} {dish.currency}
        </p>
      </div>

      {dish.description && <p className="dish__note">{dish.description}</p>}

      <div className="dish__foot">
        {dish.spicy === true && <span className="dish__tag">🌶️ Spicy</span>}

        <button type="button" className="dish__add" onClick={handleAdd}>
          Add
        </button>

        {count > 0 && <span className="dish__count">{count} in order</span>}
      </div>
    </article>
  );
}

Dish.propTypes = {
  dish: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    spicy: PropTypes.bool,
    description: PropTypes.string,
  }).isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default Dish;
