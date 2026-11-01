// What shows while a lazy route's chunk downloads. Roughly the shape of what is
// coming, so the layout does not jump when it arrives — a spinner in an empty
// page does neither. aria-busy plus one line of status text is what a screen
// reader gets instead of the grey boxes.

function Bar({ width = "100%", height = 16 }) {
  return <span className="skeleton__bar" style={{ width, height }} />;
}

export function CheckoutSkeleton() {
  return (
    <main className="prose skeleton" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading the checkout…
      </p>
      <Bar width="40%" height={32} />
      <Bar width="60%" />
      <Bar height={44} />
      <Bar height={44} />
      <Bar height={44} />
      <Bar height={88} />
      <Bar width="45%" height={44} />
    </main>
  );
}

export function ReceiptSkeleton() {
  return (
    <main className="prose skeleton" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading your receipt…
      </p>
      <Bar width="70%" height={32} />
      <Bar />
      <Bar width="80%" />
      <Bar width="50%" />
    </main>
  );
}
