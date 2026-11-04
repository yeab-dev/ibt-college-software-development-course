import PropTypes from "prop-types";
/**
 *
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 */
function Card({ children }) {
  return <div className="card">{children}</div>;
}

export default Card;

Card.propTypes = {
  children: PropTypes.node.isRequired,
};
