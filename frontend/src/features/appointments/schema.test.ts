import { describe, expect, it } from "vitest";

import { appointmentSchema, isFutureDate } from "./schema";

const base = {
  scheduled_at: "2030-01-01T10:00:00Z",
  supplier: "A" as const,
  product_line: "Camisetas" as const,
  status: "Programada" as const,
};

describe("appointmentSchema", () => {
  it("acepta una cita válida", () => {
    expect(appointmentSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza 'Entregada' sin delivered_at", () => {
    const result = appointmentSchema.safeParse({
      ...base,
      status: "Entregada",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("delivered_at");
    }
  });

  it("acepta 'Entregada' con delivered_at", () => {
    const result = appointmentSchema.safeParse({
      ...base,
      status: "Entregada",
      delivered_at: "2030-01-02T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("isFutureDate", () => {
  it("es false para fechas pasadas", () => {
    expect(isFutureDate("2000-01-01T00:00:00Z")).toBe(false);
  });

  it("es true para fechas futuras", () => {
    expect(isFutureDate("2999-01-01T00:00:00Z")).toBe(true);
  });
});
