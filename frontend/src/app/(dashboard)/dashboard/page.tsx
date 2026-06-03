"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorBanner, Spinner } from "@/components/ui/States";
import { listAppointments } from "@/features/appointments/api";
import { STATUSES, type AppointmentStatus } from "@/features/appointments/types";
import { useApi } from "@/lib/useApi";

interface Summary {
  byStatus: Record<AppointmentStatus, number>;
  today: number;
  total: number;
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { date_from: start.toISOString(), date_to: end.toISOString() };
}

async function loadSummary(): Promise<Summary> {
  const [counts, todayRes, totalRes] = await Promise.all([
    Promise.all(
      STATUSES.map((status) =>
        listAppointments({ status }).then((r) => [status, r.count] as const),
      ),
    ),
    listAppointments(todayRange()),
    listAppointments({}),
  ]);

  const byStatus = Object.fromEntries(counts) as Record<
    AppointmentStatus,
    number
  >;
  return { byStatus, today: todayRes.count, total: totalRes.count };
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useApi(
    "dashboard-summary",
    loadSummary,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link href="/appointments/new">
          <Button size="sm">Nueva cita</Button>
        </Link>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-brand-100 bg-surface p-4">
              <p className="text-xs uppercase text-muted">Total</p>
              <p className="mt-1 text-2xl font-semibold">{data.total}</p>
            </div>
            <div className="rounded-lg border border-brand-100 bg-surface p-4">
              <p className="text-xs uppercase text-muted">Hoy</p>
              <p className="mt-1 text-2xl font-semibold">{data.today}</p>
            </div>
            {STATUSES.map((status) => (
              <div
                key={status}
                className="rounded-lg border border-brand-100 bg-surface p-4"
              >
                <StatusBadge status={status} />
                <p className="mt-2 text-2xl font-semibold">
                  {data.byStatus[status] ?? 0}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-brand-100 bg-surface p-5">
            <h2 className="text-sm font-medium">Accesos rápidos</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/appointments">
                <Button variant="secondary" size="sm">Ver todas las citas</Button>
              </Link>
              <Link href="/appointments/new">
                <Button variant="secondary" size="sm">Crear cita</Button>
              </Link>
              <Link href="/reports">
                <Button variant="secondary" size="sm">Ver reporte</Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
