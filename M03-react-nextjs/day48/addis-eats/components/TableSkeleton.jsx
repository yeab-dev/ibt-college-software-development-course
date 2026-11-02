// Day 46. The loading state of an order table: a skeleton the shape of what
// is coming — a caption line, a header row and five rows — rather than a
// spinner, which says only that something is happening. It reserves roughly
// the space the table will take, so nothing jumps when the rows arrive.
//
// Pure decoration to a screen reader: the container says "Loading" once
// (role="status"), and the bars themselves are hidden.
export default function TableSkeleton({ label = "Loading orders…", rows = 5 }) {
  return (
    <div className="skeleton-table" role="status">
      <span className="visually-hidden">{label}</span>
      <div className="skeleton skeleton--caption" aria-hidden="true" />
      <div className="skeleton skeleton--head" aria-hidden="true" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton skeleton--row" aria-hidden="true" />
      ))}
    </div>
  );
}
