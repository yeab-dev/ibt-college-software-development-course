import { menu } from "./data";
import Menu from "./components/Menu";

function Header() {
  return <h1>Addis Eats</h1>;
}
function App() {
  return (
    <div>
      <Header />
      <Menu dishes={menu} category="Main" />
      <Menu dishes={menu} category="Starter" />
      <Menu dishes={menu} category="Bread" />
      <Menu dishes={menu} category="Dessert" />
    </div>
  );
}

export default App;
