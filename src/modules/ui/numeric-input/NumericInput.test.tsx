import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { NumericInput, sanitizeNumeric } from "./index";

describe("sanitizeNumeric", () => {
  it("elimina todo lo que no sea dígito", () => {
    expect(sanitizeNumeric("12a3-4 5")).toBe("12345");
    expect(sanitizeNumeric("(300) 123-4567")).toBe("3001234567");
  });
  it("conserva los ceros a la izquierda", () => {
    expect(sanitizeNumeric("007")).toBe("007");
  });
  it("acepta un solo separador decimal y lo normaliza a punto", () => {
    expect(sanitizeNumeric("1,5", { decimal: true })).toBe("1.5");
    expect(sanitizeNumeric("1.2.3", { decimal: true })).toBe("1.23");
    expect(sanitizeNumeric("1.5")).toBe("15");
  });
  it("recorta a maxLength después de limpiar (no antes)", () => {
    expect(sanitizeNumeric("a1b2c3d4", { maxLength: 3 })).toBe("123");
  });
  it("convierte dígitos de ancho completo", () => {
    expect(sanitizeNumeric("１２３")).toBe("123");
  });
});

function Harness(props: { decimal?: boolean; maxLength?: number; hint?: string }) {
  const [v, setV] = useState("");
  return <NumericInput label="Teléfono" value={v} onValueChange={setV} {...props} />;
}

describe("<NumericInput />", () => {
  it("asocia la etiqueta y pide teclado numérico", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Teléfono");
    expect(input.getAttribute("inputmode")).toBe("numeric");
  });
  it("un texto pegado con letras se limpia en vez de rechazarse entero", () => {
    render(<Harness maxLength={10} />);
    const input = screen.getByLabelText("Teléfono") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "300 abc 123" } });
    expect(input.value).toBe("300123");
  });
  it("respeta maxLength", () => {
    render(<Harness maxLength={4} />);
    const input = screen.getByLabelText("Teléfono") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "123456" } });
    expect(input.value).toBe("1234");
  });
  it("modo decimal usa teclado decimal", () => {
    render(<Harness decimal />);
    expect(screen.getByLabelText("Teléfono").getAttribute("inputmode")).toBe("decimal");
  });
  it("enlaza la ayuda con aria-describedby", () => {
    render(<Harness hint="Solo números" />);
    const input = screen.getByLabelText("Teléfono");
    const id = input.getAttribute("aria-describedby");
    expect(id && document.getElementById(id)?.textContent).toBe("Solo números");
  });
});
