import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiTable } from "./ApiTable";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  it("resalta con Shiki y emite variables de doble tema", async () => {
    const { container } = render(<CodeBlock code="const a: number = 1;" lang="ts" />);
    await waitFor(() => expect(container.querySelector(".shiki")).not.toBeNull());
    expect(container.innerHTML).toContain("--shiki-dark");
  });

  it("muestra texto plano si el lenguaje no está soportado", () => {
    const { container } = render(<CodeBlock code="hola" lang="cobol" />);
    expect(container.querySelector(".shiki")).toBeNull();
    expect(container.textContent).toContain("hola");
  });
});

describe("ApiTable", () => {
  it("marca las props obligatorias y muestra el valor por defecto", () => {
    render(
      <ApiTable
        types={[
          {
            name: "XProps",
            props: [{ name: "label", type: "string", required: true, description: "Texto" }],
          },
        ]}
      />,
    );
    expect(screen.getByText("XProps")).toBeTruthy();
    expect(screen.getByTitle("Obligatoria")).toBeTruthy();
  });
});
