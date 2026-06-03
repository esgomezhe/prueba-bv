import { describe, expect, it } from "vitest";

import { formatDateTime } from "./date";

describe("formatDateTime", () => {
  it("devuelve guion para null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("devuelve guion para una fecha inválida", () => {
    expect(formatDateTime("no-es-fecha")).toBe("—");
  });

  it("formatea una fecha ISO válida", () => {
    const result = formatDateTime("2030-06-15T14:30:00Z");
    expect(result).not.toBe("—");
    expect(result.length).toBeGreaterThan(0);
  });
});
