/** Formatea fechas ISO (aware) a la zona horaria local de forma legible. */
const FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : FORMATTER.format(date);
}

/** Convierte un ISO a valor para <input type="datetime-local"> (local). */
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Convierte un valor de datetime-local (local) a ISO 8601 con offset. */
export function fromDatetimeLocalValue(value: string): string {
  if (!value) return "";
  return new Date(value).toISOString();
}
