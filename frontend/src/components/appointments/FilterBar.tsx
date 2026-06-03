"use client";

import { Select } from "@/components/ui/Field";
import {
  PRODUCT_LINES,
  STATUSES,
  SUPPLIERS,
  type AppointmentFilters,
} from "@/features/appointments/types";

interface FilterBarProps {
  filters: AppointmentFilters;
  onChange: (filters: AppointmentFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  function set<K extends keyof AppointmentFilters>(
    key: K,
    value: string,
  ) {
    onChange({
      ...filters,
      [key]: value === "" ? undefined : value,
      page: 1,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-brand-100 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
      <Select
        aria-label="Filtrar por proveedor"
        value={filters.supplier ?? ""}
        onChange={(e) => set("supplier", e.target.value)}
      >
        <option value="">Proveedor: todos</option>
        {SUPPLIERS.map((s) => (
          <option key={s} value={s}>
            Proveedor {s}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filtrar por sublínea"
        value={filters.product_line ?? ""}
        onChange={(e) => set("product_line", e.target.value)}
      >
        <option value="">Sublínea: todas</option>
        {PRODUCT_LINES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filtrar por estado"
        value={filters.status ?? ""}
        onChange={(e) => set("status", e.target.value)}
      >
        <option value="">Estado: todos</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      <input
        type="date"
        aria-label="Desde"
        className="w-full rounded-lg border border-brand-100 bg-white px-3 py-2.5 text-sm"
        value={filters.date_from?.slice(0, 10) ?? ""}
        onChange={(e) =>
          set("date_from", e.target.value ? `${e.target.value}T00:00:00Z` : "")
        }
      />
      <input
        type="date"
        aria-label="Hasta"
        className="w-full rounded-lg border border-brand-100 bg-white px-3 py-2.5 text-sm"
        value={filters.date_to?.slice(0, 10) ?? ""}
        onChange={(e) =>
          set("date_to", e.target.value ? `${e.target.value}T23:59:59Z` : "")
        }
      />
    </div>
  );
}
