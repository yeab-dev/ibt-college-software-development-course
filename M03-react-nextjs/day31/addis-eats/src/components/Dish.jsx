import { useContext } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { CartContext } from "../cart/CartContext";

function Dish({ dish }) {
  const { items, dispatch } = useContext(CartContext);
  const inCart = items.find((item) => item.id === dish.id);

  return (
    <article className="dish">
      <div className="dish__head">
        {/* The slide wraps the whole card in a Link. That would put the Add
            button inside an anchor — a control inside a control, which
            keyboards and screen readers both handle badly. Linking the title
            gives the same destination without nesting two interactive
            elements. */}
        <h2>
          <Link to={`/menu/${dish.slug}`}>{dish.name}</Link>
        </h2>
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
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    spicy: PropTypes.bool,
    description: PropTypes.string,
  }).isRequired,
};

export default Dish;
