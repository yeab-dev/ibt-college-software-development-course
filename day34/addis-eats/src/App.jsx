import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import ThemeProvider from "./theme/ThemeProvider";
import RequireAuth from "./auth/RequireAuth";
import ErrorBoundary from "./ErrorBoundary";
import Probe from "./dev/Probe";
import Layout from "./Layout";
import CartPanel from "./components/CartPanel";
import Cart from "./pages/Cart";
import DishDetail from "./pages/DishDetail";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import NotFound from "./pages/NotFound";
import { AppCrashed, CartUnavailable, MenuUnavailable } from "./ui/Fallbacks";
import { CheckoutSkeleton, ReceiptSkeleton } from "./ui/Skeleton";
import "./App.css";

// Split at the routes most visits never reach. Someone browsing the menu does
// not download the checkout form, its validation, or the receipt — Vite turns
// each import() into its own file, and React fetches it the first time the
// component actually renders. The menu, the first screen most people land on,
// stays in the main bundle: splitting it would only add a loading state.
const Checkout = lazy(() => import("./checkout/Checkout"));
const Receipt = lazy(() => import("./pages/Receipt"));

function App() {
  return (
    // The last resort. If something above every other boundary throws — a
    // provider, the router, Layout itself — this is all that is left.
    <ErrorBoundary name="app" fallback={<AppCrashed />}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              {/* Layout wraps its <Outlet /> in a page-level boundary too, so
                  a crash on any screen keeps the header and nav. */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />

                {/* Two regions, two boundaries. Ask what should survive if
                    this part breaks: a damaged dish takes down the menu, not
                    the basket beside it — and a broken basket panel leaves
                    the menu working. */}
                <Route
                  path="menu"
                  element={
                    <div className="menu-screen">
                      <ErrorBoundary name="menu" fallback={MenuUnavailable}>
                        <Probe id="Menu">
                          <Menu />
                        </Probe>
                      </ErrorBoundary>
                      <ErrorBoundary name="cart-panel" fallback={<CartUnavailable />}>
                        <Probe id="CartPanel">
                          <CartPanel />
                        </Probe>
                      </ErrorBoundary>
                    </div>
                  }
                />
                <Route path="menu/:slug" element={<DishDetail />} />
                <Route path="cart" element={<Cart />} />

                {/* Suspense directly around each lazy route, not around
                    <Routes>: a Suspense up there would swap the whole Layout
                    for a skeleton every time a chunk loads. Here the header
                    stays put and only the page area waits.

                    Suspense outside RequireAuth: a signed-out visitor is
                    redirected before <Checkout /> ever renders, so they never
                    download its chunk at all. */}
                <Route
                  path="checkout"
                  element={
                    <Suspense fallback={<CheckoutSkeleton />}>
                      <RequireAuth>
                        <Checkout />
                      </RequireAuth>
                    </Suspense>
                  }
                />
                <Route
                  path="orders/:id"
                  element={
                    <Suspense fallback={<ReceiptSkeleton />}>
                      <Receipt />
                    </Suspense>
                  }
                />

                <Route path="login" element={<Login />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
