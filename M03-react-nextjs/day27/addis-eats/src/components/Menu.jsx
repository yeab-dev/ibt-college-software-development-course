import PropTypes from "prop-types";
import Dish from "./Dish";
import Card from "./Card";

/**
 * Shows the dishes of one category.
 * @param {object} props
 * @param {Array<{ id: number, name: string, price: number, category: string, spicy?: boolean }>} props.dishes
 * @param {"Main" | "Starter" | "Bread" | "Dessert"} props.category
 */
function Menu({ dishes, category }) {
  const shown = dishes.filter((dish) => dish.category === category);
  return shown.length === 0 ? (
    <p className="empty">No {category} dishes yet.</p>
  ) : (
    <section>
      <h2>{category}</h2>
      {shown.map((dish) => (
        <Card key={dish.id}>
          <Dish {...dish} />
        </Card>
      ))}
    </section>
  );
}

Menu.propTypes = {
  dishes: PropTypes.array.isRequired,
  category: PropTypes.oneOf(["Main", "Starter", "Bread", "Dessert"]).isRequired,
};

export default Menu;
