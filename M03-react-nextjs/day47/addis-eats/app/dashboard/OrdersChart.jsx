"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Day 46. Orders per day: "how has it changed?", so a line.
//
// The same arrangement as RevenueChart: a client leaf in a fixed-height
// wrapper, handed thirty summarised rows — { label, orders } — by the server
// page. One series, drawn with a dot on every day, so nothing depends on
// telling colours apart; the heading above it names the range and the unit.
//
// A line chart may start its axis above zero (the sheet: a bar may not, a
// line may). This one still starts at zero: the question is "are orders
// growing?", and a line that fills the height because its axis starts at 9
// makes ten orders a day look like a boom.
export default function OrdersChart({ data, title }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 4 }} title={title}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        {/* Thirty dates do not fit under a phone-width chart; Recharts
            drops the ones that would overlap, keeping the first and last. */}
        <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={16} tick={{ fill: "var(--text)", fontSize: 13 }} />
        <YAxis domain={[0, "auto"]} allowDecimals={false} width={40} tick={{ fill: "var(--text)", fontSize: 13 }} />
        <Tooltip
          formatter={(value) => [value, "Orders"]}
          contentStyle={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8 }}
        />
        <Line
          type="linear"
          dataKey="orders"
          name="Orders"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--chart-1)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
