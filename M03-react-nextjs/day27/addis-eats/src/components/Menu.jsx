import { useState } from "react";
import Dish from "./Dish";

const menu = [
  {
    id: 1,
    name: "Doro Wat",
    price: 240,
    category: "Main",
    spicy: true,
  },
  {
    id: 2,
    name: "Shiro",
    price: 120,
    category: "Main",
    spicy: false,
  },
  {
    id: 3,
    name: "Tibs",
    price: 180,
    category: "Main",
    spicy: true,
  },
  {
    id: 4,
    name: "Injera",
    price: 40,
    category: "Side",
    spicy: false,
  },
];

function Menu() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...new Set(menu.map((dish) => dish.category))];

  const filteredMenu =
    selectedCategory === "All"
      ? menu
      : menu.filter((dish) => dish.category === selectedCategory);

  return (
    <div>
      <h1>Addis Eats Menu</h1>

      <div>
        {categories.map((category) => (
          <button key={category} onClick={() => setSelectedCategory(category)}>
            {category}
          </button>
        ))}
      </div>

      {filteredMenu.length === 0 ? (
        <p>No dishes found in this category.</p>
      ) : (
        filteredMenu.map((dish) => (
          <Dish
            key={dish.id}
            name={dish.name}
            price={dish.price}
            spicy={dish.spicy}
          />
        ))
      )}
    </div>
  );
}

export default Menu;
