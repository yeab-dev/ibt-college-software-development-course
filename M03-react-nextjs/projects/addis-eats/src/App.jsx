import Dish from "./components/Dish";
const menu = [
  { id: 1, name: "Doro Wot", price: 1200 },
  { id: 2, name: "Shiro", price: 120 },
  { id: 3, name: "Tibs", price: 400 },
];
function Header() {
  return <h1>Addis Eats</h1>;
}
function Menu() {
  return (
    <div>
      {menu.map((dish) => (
        <Dish key={dish.id} name={dish.name} price={dish.price} />
      ))}
    </div>
  );
}
function App() {
  return (
    <div>
      <Header />
      <Dish name="Doro Wot" price={240} />
      <Dish name="Tibs" price={400} />
    </div>
  );
}

export default App;
