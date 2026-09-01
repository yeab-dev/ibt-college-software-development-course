import PropTypes from "prop-types";
export default function Dish({ name, price, spicy }) {
  return (
    <p>
      {name}: {price} ETB
    </p>
  );
}

Dish.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  spicy: PropTypes.bool,
};
