const dishes = [
  {
    id: "kitfo",
    name: "Kitfo",
    price: 350,
    description: "Traditional Ethiopian minced beef dish.",
    emoji: "🥩",
  },
  {
    id: "pizza",
    name: "Pizza",
    price: 500,
    description: "Freshly baked pizza with delicious toppings.",
    emoji: "🍕",
  },
  {
    id: "burger",
    name: "Burger",
    price: 400,
    description: "Juicy beef burger with fresh vegetables.",
    emoji: "🍔",
  },
];

export default function MenuPage() {
  return (
    <div>
      <h1 className="page-title">Our Menu</h1>

      <p className="page-description">
        Choose from our selection of delicious dishes.
      </p>

      <div className="dish-grid">
        {dishes.map((dish) => (
          <a href={`/menu/${dish.id}`} className="dish-card" key={dish.id}>
            <div className="dish-image">{dish.emoji}</div>

            <div className="dish-content">
              <h2>{dish.name}</h2>

              <p className="dish-description">{dish.description}</p>

              <p className="dish-price">{dish.price} ETB</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
