import { AppointmentForm } from "@/components/appointments/AppointmentForm";

export default function NewAppointmentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold">Nueva cita</h1>
      <div className="rounded-lg border border-brand-100 bg-surface p-6">
        <AppointmentForm />
      </div>
    </div>
  );
}
