"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/ui/States";
import {
  createAppointment,
  updateAppointment,
} from "@/features/appointments/api";
import {
  appointmentSchema,
  isFutureDate,
} from "@/features/appointments/schema";
import {
  PRODUCT_LINES,
  STATUSES,
  SUPPLIERS,
  type Appointment,
  type AppointmentInput,
} from "@/features/appointments/types";
import type { ApiError } from "@/lib/http";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/date";

type FieldErrors = Partial<Record<keyof AppointmentInput | "form", string>>;

export function AppointmentForm({ appointment }: { appointment?: Appointment }) {
  const router = useRouter();
  const isEdit = Boolean(appointment);

  const [values, setValues] = useState<AppointmentInput>({
    scheduled_at: appointment?.scheduled_at ?? "",
    supplier: appointment?.supplier ?? "A",
    product_line: appointment?.product_line ?? "Camisetas",
    status: appointment?.status ?? "Programada",
    delivered_at: appointment?.delivered_at ?? null,
    observations: appointment?.observations ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof AppointmentInput>(
    key: K,
    value: AppointmentInput[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateClient(): boolean {
    const result = appointmentSchema.safeParse(values);
    const next: FieldErrors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof AppointmentInput;
        next[key] = issue.message;
      }
    }
    // Regla extra solo al crear: la fecha no puede ser pasada.
    if (!isEdit && values.scheduled_at && !isFutureDate(values.scheduled_at)) {
      next.scheduled_at = "La fecha programada no puede estar en el pasado.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateClient()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const payload: AppointmentInput = {
        ...values,
        delivered_at: values.delivered_at || null,
        observations: values.observations || null,
      };
      if (isEdit && appointment) {
        await updateAppointment(appointment.id, payload);
      } else {
        await createAppointment(payload);
      }
      router.push("/appointments");
      router.refresh();
    } catch (err) {
      const apiError = err as ApiError;
      // Mapea errores de validación del backend a cada campo.
      const next: FieldErrors = {};
      if (apiError.details) {
        for (const [key, msgs] of Object.entries(apiError.details)) {
          next[key as keyof AppointmentInput] = msgs.join(" ");
        }
      }
      next.form = Object.keys(next).length ? undefined : apiError.message;
      setErrors(next);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.form && <ErrorBanner message={errors.form} />}

      <Field label="Fecha y hora programada" htmlFor="scheduled_at" required
        error={errors.scheduled_at}>
        <Input
          id="scheduled_at"
          type="datetime-local"
          invalid={Boolean(errors.scheduled_at)}
          value={toDatetimeLocalValue(values.scheduled_at)}
          onChange={(e) =>
            update("scheduled_at", fromDatetimeLocalValue(e.target.value))
          }
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Proveedor" htmlFor="supplier" required error={errors.supplier}>
          <Select
            id="supplier"
            value={values.supplier}
            onChange={(e) => update("supplier", e.target.value as AppointmentInput["supplier"])}
          >
            {SUPPLIERS.map((s) => (
              <option key={s} value={s}>Proveedor {s}</option>
            ))}
          </Select>
        </Field>

        <Field label="Sublínea" htmlFor="product_line" required error={errors.product_line}>
          <Select
            id="product_line"
            value={values.product_line}
            onChange={(e) => update("product_line", e.target.value as AppointmentInput["product_line"])}
          >
            {PRODUCT_LINES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </Field>
      </div>

      {isEdit && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Estado" htmlFor="status" error={errors.status}>
            <Select
              id="status"
              value={values.status}
              onChange={(e) => update("status", e.target.value as AppointmentInput["status"])}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>

          <Field label="Fecha real de entrega" htmlFor="delivered_at"
            error={errors.delivered_at}>
            <Input
              id="delivered_at"
              type="datetime-local"
              invalid={Boolean(errors.delivered_at)}
              value={toDatetimeLocalValue(values.delivered_at ?? null)}
              onChange={(e) =>
                update("delivered_at", e.target.value
                  ? fromDatetimeLocalValue(e.target.value) : null)
              }
            />
          </Field>
        </div>
      )}

      <Field label="Observaciones" htmlFor="observations" error={errors.observations}>
        <Textarea
          id="observations"
          value={values.observations ?? ""}
          onChange={(e) => update("observations", e.target.value)}
          placeholder="Notas adicionales (opcional)"
        />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" loading={submitting}>
          {isEdit ? "Guardar cambios" : "Crear cita"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
