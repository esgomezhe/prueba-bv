"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Appointment } from "@/features/appointments/types";
import { formatDateTime } from "@/lib/date";

interface Props {
  appointments: Appointment[];
  onCancel: (appointment: Appointment) => void;
  cancellingId?: string | null;
}

const CANCELABLE = new Set(["Programada", "En proceso"]);

export function AppointmentTable({ appointments, onCancel, cancellingId }: Props) {
  return (
    <>
      {/* Tabla en tablet/escritorio */}
      <div className="hidden overflow-hidden rounded-lg border border-brand-100 md:block">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Programada</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Sublínea</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Entregada</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {appointments.map((appt) => (
              <tr key={appt.id} className="bg-surface hover:bg-brand-50/50">
                <td className="px-4 py-3">{formatDateTime(appt.scheduled_at)}</td>
                <td className="px-4 py-3">Proveedor {appt.supplier}</td>
                <td className="px-4 py-3">{appt.product_line}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={appt.status} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDateTime(appt.delivered_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/appointments/${appt.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        Editar
                      </Button>
                    </Link>
                    {CANCELABLE.has(appt.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={cancellingId === appt.id}
                        onClick={() => onCancel(appt)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tarjetas apiladas en móvil */}
      <div className="space-y-3 md:hidden">
        {appointments.map((appt) => (
          <div
            key={appt.id}
            className="rounded-lg border border-brand-100 bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{appt.product_line}</p>
                <p className="text-sm text-muted">Proveedor {appt.supplier}</p>
              </div>
              <StatusBadge status={appt.status} />
            </div>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Programada</dt>
                <dd>{formatDateTime(appt.scheduled_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Entregada</dt>
                <dd>{formatDateTime(appt.delivered_at)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex gap-2">
              <Link href={`/appointments/${appt.id}/edit`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  Editar
                </Button>
              </Link>
              {CANCELABLE.has(appt.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  loading={cancellingId === appt.id}
                  onClick={() => onCancel(appt)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
