export default async function CheckoutPage() {
  return (
    <main className="page-container">
      <h1 className="page-title">Checkout</h1>

      <div className="checkout-card">
        <div className="checkout-row">
          <span>Kitfo × 1</span>
          <strong>350 ETB</strong>
        </div>

        <div className="checkout-row">
          <span>Pizza × 1</span>
          <strong>500 ETB</strong>
        </div>

        <div className="checkout-row">
          <span>Delivery</span>
          <strong>100 ETB</strong>
        </div>

        <div className="checkout-total">Total: 950 ETB</div>

        <button className="primary-button">Place Order</button>
      </div>
    </main>
  );
}
