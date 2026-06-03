"use client";

import { useState } from "react";

import { ReportChart } from "@/components/reports/ReportChart";
import { ReportTable } from "@/components/reports/ReportTable";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorBanner, Spinner } from "@/components/ui/States";
import { getDeliveryReport } from "@/features/reports/api";
import type { ReportFilters } from "@/features/reports/types";
import { useApi } from "@/lib/useApi";

function defaultRange(): ReportFilters {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  return {
    date_from: from.toISOString().slice(0, 10) + "T00:00:00Z",
    date_to: to.toISOString().slice(0, 10) + "T23:59:59Z",
  };
}

export default function ReportsPage() {
  const [range, setRange] = useState<ReportFilters>(defaultRange);
  const [applied, setApplied] = useState<ReportFilters>(range);

  const { data, loading, error, refetch } = useApi(["report", applied], () =>
    getDeliveryReport(applied),
  );

  const rows = data?.results ?? [];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Reporte de tiempo de entrega</h1>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-brand-100 bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Desde</span>
          <input
            type="date"
            className="rounded-lg border border-brand-100 px-3 py-2.5 text-sm"
            value={range.date_from.slice(0, 10)}
            onChange={(e) =>
              setRange((r) => ({ ...r, date_from: `${e.target.value}T00:00:00Z` }))
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Hasta</span>
          <input
            type="date"
            className="rounded-lg border border-brand-100 px-3 py-2.5 text-sm"
            value={range.date_to.slice(0, 10)}
            onChange={(e) =>
              setRange((r) => ({ ...r, date_to: `${e.target.value}T23:59:59Z` }))
            }
          />
        </label>
        <div className="flex items-end gap-2">
          <Button onClick={() => setApplied(range)}>Aplicar</Button>
          <Button variant="secondary" onClick={refetch} loading={loading}>
            Actualizar
          </Button>
        </div>
      </div>

      {loading && <Spinner label="Generando reporte…" />}
      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {data && !loading && (
        rows.length === 0 ? (
          <EmptyState
            title="Sin entregas en el rango seleccionado"
            description="Ajusta el rango de fechas para ver resultados."
          />
        ) : (
          <div className="space-y-5">
            <ReportChart rows={rows} />
            <ReportTable rows={rows} />
          </div>
        )
      )}
    </div>
  );
}
