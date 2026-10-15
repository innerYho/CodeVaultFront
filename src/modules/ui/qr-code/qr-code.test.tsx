import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QrCode } from "./index";

const pathOf = (c: HTMLElement) => c.querySelector("path")?.getAttribute("d") ?? "";

describe("<QrCode />", () => {
  it("es una imagen con nombre accesible y el tamaño pedido", () => {
    render(<QrCode value="https://ejemplo.test" label="QR del sitio" size={120} />);
    const svg = screen.getByRole("img", { name: "QR del sitio" });
    expect(svg.getAttribute("width")).toBe("120");
    expect(svg.getAttribute("height")).toBe("120");
  });
  it("dibuja un solo path y cambia con el contenido", () => {
    const a = render(<QrCode value="uno" label="a" />);
    const b = render(<QrCode value="dos" label="b" />);
    expect(a.container.querySelectorAll("path")).toHaveLength(1);
    expect(pathOf(a.container)).not.toBe("");
    expect(pathOf(a.container)).not.toBe(pathOf(b.container));
  });
  it("el mismo valor produce el mismo dibujo", () => {
    const a = render(<QrCode value="igual" label="a" />);
    const b = render(<QrCode value="igual" label="b" />);
    expect(pathOf(a.container)).toBe(pathOf(b.container));
  });
});
