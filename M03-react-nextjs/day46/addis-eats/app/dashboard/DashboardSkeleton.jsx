import TableSkeleton from "@/components/TableSkeleton";

// Day 46. The dashboard while its data is on the way: the same layout as the
// real thing — a summary line, two chart-sized blocks and a table of five
// rows — so the page does not jump when it arrives. Each block is the
// height the real chart reserves (.chart__frame), for the same reason.
export default function DashboardSkeleton() {
  return (
    <div role="status">
      <span className="visually-hidden">Loading the dashboard…</span>
      <div className="skeleton skeleton--caption" aria-hidden="true" />
      <div className="dashboard__charts" aria-hidden="true">
        <div className="skeleton skeleton--chart" />
        <div className="skeleton skeleton--chart" />
      </div>
      <TableSkeleton label="" />
    </div>
  );
}
