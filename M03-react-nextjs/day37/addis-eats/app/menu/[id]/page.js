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

export async function generateStaticParams() {
  return dishes.map((dish) => ({
    id: dish.id,
  }));
}

export default async function DishPage({ params }) {
  const { id } = await params;

  const dish = dishes.find((dish) => dish.id === id);

  if (!dish) {
    return (
      <div className="dish-detail">
        <h1>Dish not found</h1>
      </div>
    );
  }

  return (
    <main className="dish-detail">
      <div className="dish-detail-card">
        <div className="dish-image">{dish.emoji}</div>

        <h1>{dish.name}</h1>

        <p className="dish-description">{dish.description}</p>

        <p className="dish-detail-price">{dish.price} ETB</p>

        <button className="primary-button">Add to Cart</button>
      </div>
    </main>
  );
}
