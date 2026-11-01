import { useContext } from "react";
import PropTypes from "prop-types";
import { CartContext } from "../cart/CartContext";

function Dish({ dish }) {
  // This is the point of context. The cart lives at the top of the app, this
  // card is three components deep, and nothing in between had to carry an
  // `onAdd` prop down to it. Day 28's local `count` is gone too — the quantity
  // is in the cart, which is the only place it can be right.
  const { items, dispatch } = useContext(CartContext);

  const inCart = items.find((item) => item.id === dish.id);

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

        <button
          type="button"
          className="dish__add"
          onClick={() => dispatch({ type: "add", dish })}
        >
          Add
        </button>

        {inCart && (
          <span className="dish__count">{inCart.quantity} in order</span>
        )}
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
};

export default Dish;
