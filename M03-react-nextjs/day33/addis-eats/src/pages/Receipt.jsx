import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";

// The "succeeded" state. Checkout navigates here with replace: true, so Back
// skips the form entirely. The order is fetched by id rather than passed in
// router state, so a refresh of this URL still shows it.
function Receipt() {
  const { id } = useParams();
  const { data: order, isLoading, error } = useFetch(`/api/orders/${id}`);

  if (isLoading) {
    return (
      <p className="state" role="status">
        Loading order {id}&hellip;
      </p>
    );
  }

  if (error) {
    return (
      <div className="state state--error" role="alert">
        <p>
          We could not find order {id}. {error}
        </p>
        <p>
          <Link to="/menu">Back to the menu</Link>
        </p>
      </div>
    );
  }

  return (
    <main className="prose">
      <h2>Order {order.id} is in the kitchen</h2>
      <p>
        {order.total} ETB will be requested from TeleBirr {order.phone}. On its
        way to {order.name} in {order.area}.
      </p>

      <ul className="checkout__lines">
        {order.lines.map((line) => (
          <li key={line.id} className="checkout__line checkout__line--summary">
            <span className="checkout__name">
              {line.quantity} × {line.name}
            </span>
            <span className="checkout__amount">
              {line.price * line.quantity} ETB
            </span>
          </li>
        ))}
      </ul>

      {order.notes && <p>Note for the rider: &ldquo;{order.notes}&rdquo;</p>}

      <p>
        <Link className="cta" to="/menu" replace>
          Order something else
        </Link>
      </p>
    </main>
  );
}

export default Receipt;
