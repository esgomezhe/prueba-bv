import { cn } from "@/lib/cn";
import type { AppointmentStatus } from "@/features/appointments/types";

const STYLES: Record<AppointmentStatus, string> = {
  Programada: "bg-info-100 text-info-700",
  "En proceso": "bg-warning-100 text-warning-700",
  Entregada: "bg-success-100 text-success-700",
  Cancelada: "bg-danger-100 text-danger-700",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
