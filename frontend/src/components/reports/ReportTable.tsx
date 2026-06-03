import type { ReportRow } from "@/features/reports/types";

export function ReportTable({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-brand-100">
      <table className="w-full text-sm">
        <thead className="bg-brand-50 text-left text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Sublínea</th>
            <th className="px-4 py-3 text-right font-medium">Entregas</th>
            <th className="px-4 py-3 text-right font-medium">Promedio (h)</th>
            <th className="px-4 py-3 text-right font-medium">Promedio (min)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-100">
          {rows.map((row) => (
            <tr key={row.product_line} className="bg-surface">
              <td className="px-4 py-3 font-medium">{row.product_line}</td>
              <td className="px-4 py-3 text-right">{row.total_deliveries}</td>
              <td className="px-4 py-3 text-right">{row.avg_hours.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{row.avg_minutes.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
