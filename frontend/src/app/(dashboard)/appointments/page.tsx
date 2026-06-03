"use client";

import Link from "next/link";
import { useState } from "react";

import { AppointmentTable } from "@/components/appointments/AppointmentTable";
import { FilterBar } from "@/components/appointments/FilterBar";
import { Button } from "@/components/ui/Button";
import {
  EmptyState,
  ErrorBanner,
  TableSkeleton,
} from "@/components/ui/States";
import {
  cancelAppointment,
  listAppointments,
} from "@/features/appointments/api";
import type {
  Appointment,
  AppointmentFilters,
} from "@/features/appointments/types";
import { useApi } from "@/lib/useApi";

const PAGE_SIZE = 20;

export default function AppointmentsPage() {
  const [filters, setFilters] = useState<AppointmentFilters>({ page: 1 });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useApi(
    ["appointments", filters],
    () => listAppointments(filters),
  );

  async function handleCancel(appt: Appointment) {
    if (!confirm(`¿Cancelar la cita de ${appt.product_line}?`)) return;
    setCancellingId(appt.id);
    try {
      await cancelAppointment(appt.id);
      refetch();
    } catch (err) {
      alert((err as { message?: string }).message ?? "No se pudo cancelar.");
    } finally {
      setCancellingId(null);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
  const page = filters.page ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Citas de entrega</h1>
        <Link href="/appointments/new">
          <Button size="sm">Nueva cita</Button>
        </Link>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {loading && <TableSkeleton />}
      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {data && !loading && (
        <>
          {data.results.length === 0 ? (
            <EmptyState
              title="No hay citas con esos filtros"
              description="Ajusta los filtros o crea una nueva cita."
              action={
                <Link href="/appointments/new">
                  <Button size="sm">Crear cita</Button>
                </Link>
              }
            />
          ) : (
            <>
              <AppointmentTable
                appointments={data.results}
                onCancel={handleCancel}
                cancellingId={cancellingId}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {data.count} cita{data.count === 1 ? "" : "s"} · página {page} de{" "}
                  {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
