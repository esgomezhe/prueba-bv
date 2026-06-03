/** Cliente del recurso de citas (vía proxy BFF). */
import { http } from "@/lib/http";

import type {
  Appointment,
  AppointmentFilters,
  AppointmentInput,
  Paginated,
} from "./types";

function buildParams(filters: AppointmentFilters): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== null) {
      params[key] = String(value);
    }
  }
  return params;
}

export async function listAppointments(
  filters: AppointmentFilters = {},
): Promise<Paginated<Appointment>> {
  const { data } = await http.get<Paginated<Appointment>>("/appointments", {
    params: buildParams(filters),
  });
  return data;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data } = await http.get<Appointment>(`/appointments/${id}`);
  return data;
}

export async function createAppointment(
  input: AppointmentInput,
): Promise<Appointment> {
  const { data } = await http.post<Appointment>("/appointments", input);
  return data;
}

export async function updateAppointment(
  id: string,
  input: Partial<AppointmentInput>,
): Promise<Appointment> {
  const { data } = await http.patch<Appointment>(`/appointments/${id}`, input);
  return data;
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const { data } = await http.post<Appointment>(`/appointments/${id}/cancel`);
  return data;
}
