import { EditClient } from "./EditClient";

/** Next 16: los params de página son asíncronos (Promise). */
export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold">Editar cita</h1>
      <div className="rounded-lg border border-brand-100 bg-surface p-6">
        <EditClient id={id} />
      </div>
    </div>
  );
}
