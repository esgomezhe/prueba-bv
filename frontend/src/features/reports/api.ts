/** Cliente del reporte de tiempo promedio de entrega (vía proxy BFF). */
import { http } from "@/lib/http";

import type { ReportFilters, ReportResponse } from "./types";

export async function getDeliveryReport(
  filters: ReportFilters,
): Promise<ReportResponse> {
  const { data } = await http.get<ReportResponse>("/reports/delivery-time", {
    params: filters,
  });
  return data;
}
