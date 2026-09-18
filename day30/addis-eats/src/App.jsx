import CartProvider from "./cart/CartProvider";
import CartBadge from "./components/CartBadge";
import CheckoutPanel from "./components/CheckoutPanel";
import Menu from "./components/Menu";
import "./App.css";

function App() {
  // One provider, wrapped around everything that needs the cart. The badge in
  // the header and the panel beside the menu are siblings — there is no prop
  // either of them could have received from a common parent without every
  // component in between passing it along.
  return (
    <CartProvider>
      <header className="topbar">
        <div>
          <h1>Addis Eats</h1>
          <p className="topbar__tagline">
            Today&rsquo;s kitchen, served straight from the API.
          </p>
        </div>
        <CartBadge />
      </header>

      <div className="layout">
        <Menu />
        <CheckoutPanel />
      </div>
    </CartProvider>
  );
}

export default App;
