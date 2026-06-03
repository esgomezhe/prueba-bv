/** Tipos del dominio de citas — espejo del contrato del backend (DRF). */

export const SUPPLIERS = ["A", "B", "C"] as const;
export type Supplier = (typeof SUPPLIERS)[number];

export const PRODUCT_LINES = [
  "Camisetas",
  "Pantalones",
  "Zapatos",
  "Accesorios",
] as const;
export type ProductLine = (typeof PRODUCT_LINES)[number];

export const STATUSES = [
  "Programada",
  "En proceso",
  "Entregada",
  "Cancelada",
] as const;
export type AppointmentStatus = (typeof STATUSES)[number];

export interface Appointment {
  id: string;
  scheduled_at: string;
  supplier: Supplier;
  product_line: ProductLine;
  status: AppointmentStatus;
  delivered_at: string | null;
  observations: string | null;
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
}

/** Respuesta paginada estándar de DRF (PageNumberPagination). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Filtros de la lista de citas. */
export interface AppointmentFilters {
  supplier?: Supplier;
  product_line?: ProductLine;
  status?: AppointmentStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
}

/** Payload de creación/edición. */
export interface AppointmentInput {
  scheduled_at: string;
  supplier: Supplier;
  product_line: ProductLine;
  status?: AppointmentStatus;
  delivered_at?: string | null;
  observations?: string | null;
}
