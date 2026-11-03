import PropTypes from "prop-types";
/**
 * @param {object} props
 * @param {string} props.name
 * @param {number} props.price
 * @param {string} [props.currency]
 * @param {boolean} [props.spicy]
 */
function Dish({ name, price, currency = "ETB", spicy = false }) {
  return (
    <div className="dish">
      <h3>
        {name} {Boolean(spicy) && <span className="badge">🌶 Spicy</span>}
      </h3>
      <p>
        {price} {currency}
      </p>
    </div>
  );
}

Dish.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  currency: PropTypes.string,
  spicy: PropTypes.bool,
};

export default Dish;
