import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  selectAddItem,
  selectQuantityOf,
  useCartStore,
} from "../cart/cartStore";
import { useRenderCount } from "../hooks/useRenderCount";

function Dish({ dish }) {
  // This is the clearest demonstration in the whole application, and the
  // README has the measured numbers.
  //
  // Under context every card called useCart(), got the entire value object,
  // and re-rendered on every "Add" — thirteen cards, three dishes, thirty-nine
  // renders. Here each card subscribes to a single number: its own quantity.
  // Adding Doro Wat leaves the Shiro card's selector returning the same 0 it
  // returned before, so React skips it. Three renders instead of thirty-nine.
  const quantity = useCartStore(selectQuantityOf(dish.id));

  // One value at a time. Two selectors, not one returning { quantity, addItem }
  // — that object would be new on every call and defeat the comparison.
  const addItem = useCartStore(selectAddItem);

  const renders = useRenderCount(`Dish · ${dish.name}`);

  return (
    <article className="dish">
      <div className="dish__head">
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

        <button type="button" className="dish__add" onClick={() => addItem(dish)}>
          Add
        </button>

        {quantity > 0 && (
          <span className="dish__count">{quantity} in order</span>
        )}

        <span className="dish__renders">{renders} renders</span>
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
