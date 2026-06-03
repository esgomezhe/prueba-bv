/** Tipos del reporte de tiempo promedio de entrega. */

import type { ProductLine } from "@/features/appointments/types";

export interface ReportRow {
  product_line: ProductLine;
  total_deliveries: number;
  avg_hours: number;
  avg_minutes: number;
}

export interface ReportResponse {
  results: ReportRow[];
}

export interface ReportFilters {
  date_from: string;
  date_to: string;
}
