import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import ThemeProvider from "./theme/ThemeProvider";
import RequireAuth from "./auth/RequireAuth";
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
  // Two providers, and neither of them is the cart.
  //
  // CartProvider used to wrap all of this. It is gone: the store is a module,
  // so there is nothing to mount and nothing to be inside of. What is left is
  // split by how often it changes — the session, read once at startup, and the
  // theme, changed maybe twice a session.
  return (
    <AuthProvider>
      <ThemeProvider>
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
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
