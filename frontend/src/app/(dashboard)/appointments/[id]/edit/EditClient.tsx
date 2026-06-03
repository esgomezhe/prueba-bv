"use client";

import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { ErrorBanner, Spinner } from "@/components/ui/States";
import { getAppointment } from "@/features/appointments/api";
import { useApi } from "@/lib/useApi";

export function EditClient({ id }: { id: string }) {
  const { data, loading, error, refetch } = useApi(["appointment", id], () =>
    getAppointment(id),
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error.message} onRetry={refetch} />;
  if (!data) return null;

  return <AppointmentForm appointment={data} />;
}
