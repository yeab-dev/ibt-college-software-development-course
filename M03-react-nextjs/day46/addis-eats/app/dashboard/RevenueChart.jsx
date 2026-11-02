"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { etb } from "@/lib/formatMoney";

// Day 46. Revenue by neighbourhood: "which is largest?", so a bar chart.
//
// A client leaf, and the only kind of file on the dashboard that is one
// (with OrdersChart): a chart measures the DOM to size itself, and Recharts
// is built from hooks and effects. The page around it stays a server
// component and hands it four rows — { area, revenue } — already added up
// (lib/dashboard.js). The four hundred orders never reach the browser.
//
// Composed, not configured: the axes, the tooltip and the bars are children.
//
// Honest:
//   - the value axis starts at zero (domain [0, "auto"]). A bar's length is
//     its value; an axis starting at 20,000 would make Piassa look a fraction
//     of Bole when it is not
//   - the unit is on every tick and in the tooltip, through one formatter,
//     etb() — the same one the table beneath the chart uses
//   - readable without colour: there is one series, so colour is not a key
//     to anything, and every bar carries its value as text above it
//
// The height comes from the wrapper (.chart__frame, 300px in globals.css):
// ResponsiveContainer's "100%" is a percentage of that. Without it the chart
// is a percentage of nothing — the deck's first bug — and the fixed height
// also reserves the space, so nothing jumps when the chart draws after
// hydration.
export default function RevenueChart({ data, title }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 28, right: 12, bottom: 4, left: 4 }} title={title}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        {/* interval 0: every neighbourhood is named. Left to itself,
            Recharts drops a label it thinks would collide — and a bar with
            no name is a bar nobody can read. */}
        <XAxis dataKey="area" interval={0} tick={{ fill: "var(--text-h)", fontSize: 13 }} tickLine={false} />
        {/* Formatted labels are wider than raw ones: an explicit width, or
            "ETB 40,000" is clipped to "0,000". */}
        <YAxis domain={[0, "auto"]} tickFormatter={etb} width={92} tick={{ fill: "var(--text)", fontSize: 13 }} />
        <Tooltip
          formatter={(value) => [etb(value), "Revenue"]}
          cursor={{ fill: "var(--accent-bg)" }}
          contentStyle={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8 }}
        />
        <Bar dataKey="revenue" name="Revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="revenue" position="top" formatter={etb} fill="var(--text-h)" fontSize={13} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
