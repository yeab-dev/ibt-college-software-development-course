export default function CartPage() {
  return (
    <main className="page-container">
      <h1 className="page-title">Your Cart</h1>

      <div className="checkout-card">
        <div className="checkout-row">
          <div>
            <strong>Kitfo</strong>
            <p>1 × 350 ETB</p>
          </div>

          <strong>350 ETB</strong>
        </div>

        <div className="checkout-total">Total: 350 ETB</div>

        <a href="/checkout" className="primary-button">
          Continue to Checkout
        </a>
      </div>
    </main>
  );
}
