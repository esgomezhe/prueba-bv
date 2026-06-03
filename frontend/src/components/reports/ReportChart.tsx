"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ReportRow } from "@/features/reports/types";

export function ReportChart({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="rounded-lg border border-brand-100 bg-surface p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">
        Tiempo promedio de entrega por sublínea (horas)
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="product_line"
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)} h`, "Promedio"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #d6e0f0" }}
            />
            <Bar dataKey="avg_hours" fill="#2b4a7e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
