import { useState } from "react";
import CategoryBar from "./CategoryBar";
import DishList from "./DishList";
import DeliveryForm from "./DeliveryForm";

const dishes = [
  {
    id: 1,
    name: "Doro Wat",
    price: 240,
    category: "Main",
    spicy: true,
    currency: "ETB",
  },
  {
    id: 2,
    name: "Shiro",
    price: 120,
    category: "Main",
    spicy: false,
    currency: "ETB",
  },
  {
    id: 3,
    name: "Tibs",
    price: 180,
    category: "Main",
    spicy: true,
    currency: "ETB",
  },
  {
    id: 4,
    name: "Injera",
    price: 40,
    category: "Side",
    spicy: false,
    currency: "ETB",
  },
];

const categories = [
  "All",
  "Main",
  "Side",
  "Drinks",
];

function Menu() {
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [total, setTotal] = useState(0);

  function handleAdd(price) {
    setTotal((currentTotal) =>
      currentTotal + price
    );
  }

  return (
    <div>
      <h1>Addis Eats</h1>

      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <DishList
        dishes={dishes}
        category={selectedCategory}
        onAdd={handleAdd}
      />

      <h2>Order Total: {total} ETB</h2>

      <DeliveryForm />
    </div>
  );
}

export default Menu;