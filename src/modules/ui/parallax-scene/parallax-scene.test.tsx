import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ParallaxScene } from "./ParallaxScene";
import { mulberry32, Pines, Ridge, ridgeHeights } from "./silhouettes";

describe("ridgeHeights", () => {
  it("es determinista: misma semilla, mismo perfil", () => {
    expect(ridgeHeights(5)).toEqual(ridgeHeights(5));
    expect(ridgeHeights(5)).not.toEqual(ridgeHeights(6));
  });
  it("devuelve 2^detail+1 puntos normalizados a [0, 1]", () => {
    const h = ridgeHeights(3, 5);
    expect(h).toHaveLength(33);
    expect(Math.min(...h)).toBe(0);
    expect(Math.max(...h)).toBe(1);
  });
  it("mulberry32 produce valores en [0, 1) y es reproducible", () => {
    const a = mulberry32(9);
    const b = mulberry32(9);
    const xs = Array.from({ length: 50 }, () => a());
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(xs).toEqual(Array.from({ length: 50 }, () => b()));
  });
});

describe("siluetas", () => {
  it("Ridge dibuja un único trazo cerrado con degradado", () => {
    const { container } = render(<Ridge color="#123" topColor="#456" seed={2} />);
    const d = container.querySelector("path")?.getAttribute("d") ?? "";
    expect(d.startsWith("M0.00,")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(container.querySelector("linearGradient")).not.toBeNull();
  });
  it("Pines dibuja tantos árboles como se pidan", () => {
    const { container } = render(<Pines color="#000" count={12} />);
    expect(container.querySelectorAll("g")).toHaveLength(12);
  });
});

describe("ParallaxScene", () => {
  const layers = [
    { id: "cerca", depth: 0.9, children: <p>Cerca</p> },
    { id: "lejos", depth: 0.1, children: <p>Lejos</p> },
    { id: "medio", depth: 0.5, children: <p>Medio</p> },
  ];

  it("apila las capas de la más lejana a la más cercana (la cercana queda encima)", () => {
    const { container } = render(<ParallaxScene layers={layers} />);
    const order = [...container.querySelectorAll("[data-depth]")].map((el) => el.textContent);
    expect(order).toEqual(["Lejos", "Medio", "Cerca"]);
  });

  it("`top` posiciona la capa y, sin él, ocupa toda la altura con margen extra", () => {
    const { container } = render(
      <ParallaxScene
        bleed={10}
        layers={[
          { id: "a", depth: 0.5, top: "40%", children: <i /> },
          { id: "b", depth: 0.6, children: <i /> },
        ]}
      />,
    );
    const [a, b] = [...container.querySelectorAll<HTMLElement>("[data-depth]")];
    expect(a?.style.top).toBe("40%");
    expect(b?.style.top).toBe("-10%");
    expect(a?.style.left).toBe("-10%");
  });

  it("limita la profundidad a [0, 1]", () => {
    const { container } = render(
      <ParallaxScene layers={[{ id: "x", depth: 7, children: <i /> }]} />,
    );
    expect(container.querySelector("[data-depth]")?.getAttribute("data-depth")).toBe("1");
  });

  it("sin label es decorativa; con label es una imagen descrita", () => {
    const { container, rerender } = render(<ParallaxScene layers={layers} />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    rerender(<ParallaxScene layers={layers} label="Montañas al atardecer" />);
    expect(screen.getByRole("img", { name: "Montañas al atardecer" })).toBeTruthy();
  });

  it("el contenido hijo se renderiza encima y sin moverse", () => {
    render(
      <ParallaxScene layers={layers}>
        <h2>Título</h2>
      </ParallaxScene>,
    );
    expect(screen.getByText("Título").closest("[data-depth]")).toBeNull();
  });

  it("mover el puntero no falla aunque el contenedor no tenga tamaño (jsdom)", () => {
    const { container } = render(<ParallaxScene layers={layers} />);
    expect(() =>
      fireEvent.pointerMove(container.firstElementChild as Element, { clientX: 50, clientY: 20 }),
    ).not.toThrow();
  });
});
