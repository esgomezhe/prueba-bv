/**
 * Validación de formularios con Zod (espejo de las reglas del backend).
 *
 * La validación en cliente es UX, no seguridad: el backend sigue siendo la
 * autoridad final. Si la API devuelve 400, mapeamos `error.details` a los
 * campos del formulario.
 */
import { z } from "zod";

import { PRODUCT_LINES, STATUSES, SUPPLIERS } from "./types";

export const appointmentSchema = z
  .object({
    scheduled_at: z
      .string()
      .min(1, "La fecha programada es obligatoria."),
    supplier: z.enum(SUPPLIERS),
    product_line: z.enum(PRODUCT_LINES),
    status: z.enum(STATUSES),
    delivered_at: z.string().nullable().optional(),
    observations: z.string().max(2000).nullable().optional(),
  })
  .refine(
    (data) => data.status !== "Entregada" || Boolean(data.delivered_at),
    {
      message: "La fecha real de entrega es obligatoria cuando está 'Entregada'.",
      path: ["delivered_at"],
    },
  );

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

/** Valida que una fecha no esté en el pasado (solo al crear). */
export function isFutureDate(value: string): boolean {
  return new Date(value).getTime() > Date.now();
}
