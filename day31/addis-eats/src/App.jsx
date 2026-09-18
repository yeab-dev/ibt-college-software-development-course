import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import CartProvider from "./cart/CartProvider";
import Layout from "./Layout";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import DishDetail from "./pages/DishDetail";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  // The providers sit *outside* BrowserRouter, above everything that reads
  // them and outside anything a navigation could unmount. The cart survives
  // the journey from /menu to /menu/kitfo to /cart because of where this line
  // is, not because of anything the router does.
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* The parent route renders the frame. Every child renders into
                its <Outlet />, so the header and nav are built once and never
                rebuilt on navigation. */}
            <Route path="/" element={<Layout />}>
              {/* index = the parent's own path, nothing more. This is "/". */}
              <Route index element={<Home />} />

              {/* Relative paths: no leading slash, so they compose with the
                  parent. "menu" is /menu. "/menu" would escape the parent. */}
              <Route path="menu" element={<Menu />} />
              <Route path="menu/:slug" element={<DishDetail />} />
              <Route path="cart" element={<Cart />} />

              <Route
                path="checkout"
                element={
                  <RequireAuth>
                    <Checkout />
                  </RequireAuth>
                }
              />

              <Route path="login" element={<Login />} />

              {/* Always include the catch-all. Without it a mistyped URL
                  renders a blank screen with no explanation. */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
