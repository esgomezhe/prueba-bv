import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("muestra el texto del estado", () => {
    render(<StatusBadge status="Entregada" />);
    expect(screen.getByText("Entregada")).toBeInTheDocument();
  });

  it("aplica el estilo de éxito a 'Entregada'", () => {
    render(<StatusBadge status="Entregada" />);
    expect(screen.getByText("Entregada").className).toContain("success");
  });

  it("aplica el estilo de peligro a 'Cancelada'", () => {
    render(<StatusBadge status="Cancelada" />);
    expect(screen.getByText("Cancelada").className).toContain("danger");
  });
});
