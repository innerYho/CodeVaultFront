import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getEffect, stripClip } from "./effects";
import { ImageTransition } from "./ImageTransition";

const images = [
  { src: "/a.webp", alt: "Montaña" },
  { src: "/b.webp", alt: "Lago" },
  { src: "/c.webp", alt: "Bosque" },
];
const slide = () => screen.getByRole("group", { name: /de 3:/ });

afterEach(() => vi.useRealTimers());

describe("ImageTransition", () => {
  it("muestra la primera imagen con su descripción accesible", () => {
    render(<ImageTransition images={images} interval={0} />);
    expect(slide().getAttribute("aria-label")).toBe("1 de 3: Montaña");
  });

  it("siguiente y anterior avanzan con vuelta circular", () => {
    render(<ImageTransition images={images} interval={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Imagen anterior" }));
    expect(slide().getAttribute("aria-label")).toContain("3 de 3");
    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(slide().getAttribute("aria-label")).toContain("1 de 3");
  });

  it("los puntos saltan a una imagen y marcan la actual", () => {
    render(<ImageTransition images={images} interval={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Ir a la imagen 3" }));
    expect(slide().getAttribute("aria-label")).toContain("Bosque");
    expect(
      screen.getByRole("button", { name: "Ir a la imagen 3" }).getAttribute("aria-current"),
    ).toBe("true");
  });

  it("las flechas del teclado navegan", () => {
    render(<ImageTransition images={images} interval={0} />);
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    expect(slide().getAttribute("aria-label")).toContain("Lago");
  });

  it("durante el cambio hay dos capas y al terminar queda una", () => {
    const { container } = render(
      <ImageTransition images={images} interval={0} effect="fade" duration={0.01} />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(container.querySelectorAll("img")).toHaveLength(2); // saliente + entrante
  });

  it("al terminar la transición se retira la capa saliente (todos los efectos)", async () => {
    for (const effect of ["fade", "wipe", "circle", "zoom", "slide", "blinds"] as const) {
      const { container, unmount } = render(
        <ImageTransition images={images} interval={0} effect={effect} duration={0.05} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
      await waitFor(
        () =>
          expect(container.querySelectorAll("img").length, effect).toBe(
            effect === "blinds" ? 8 : 1,
          ),
        { timeout: 3000 },
      );
      unmount();
    }
  });

  it("blinds crea ocho franjas recortadas con clip-path durante el cambio", () => {
    const { container } = render(<ImageTransition images={images} interval={0} effect="blinds" />);
    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(container.querySelectorAll('[style*="clip-path"]')).toHaveLength(8);
    expect(container.querySelectorAll("img")).toHaveLength(9); // 8 franjas + la imagen saliente
  });

  it("modo controlado: onIndexChange avisa y el índice lo manda el padre", () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(
      <ImageTransition images={images} interval={0} index={0} onIndexChange={onIndexChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(slide().getAttribute("aria-label")).toContain("Montaña"); // el padre aún no cambió
    rerender(
      <ImageTransition images={images} interval={0} index={1} onIndexChange={onIndexChange} />,
    );
    expect(slide().getAttribute("aria-label")).toContain("Lago");
  });

  it("la reproducción automática avanza, y la pausa manual la detiene", () => {
    vi.useFakeTimers();
    render(<ImageTransition images={images} interval={1000} />);
    act(() => void vi.advanceTimersByTime(1000));
    expect(slide().getAttribute("aria-label")).toContain("Lago");
    fireEvent.click(screen.getByRole("button", { name: "Pausar reproducción" }));
    act(() => void vi.advanceTimersByTime(5000));
    expect(slide().getAttribute("aria-label")).toContain("Lago");
    expect(screen.getByRole("button", { name: "Reanudar reproducción" })).toBeTruthy();
  });

  it("pausa al pasar el ratón por encima", () => {
    vi.useFakeTimers();
    render(<ImageTransition images={images} interval={1000} />);
    fireEvent.mouseEnter(screen.getByRole("region"));
    act(() => void vi.advanceTimersByTime(3000));
    expect(slide().getAttribute("aria-label")).toContain("Montaña");
  });

  it("con una sola imagen no muestra controles", () => {
    render(<ImageTransition images={images.slice(0, 1)} interval={0} />);
    expect(screen.queryByRole("button", { name: "Imagen siguiente" })).toBeNull();
  });
});

describe("efectos", () => {
  it("wipe cambia de sentido al retroceder", () => {
    expect(getEffect("wipe", 1).top.initial).not.toEqual(getEffect("wipe", -1).top.initial);
  });
  it("blinds define franjas y stripClip las recorta sin solaparse", () => {
    expect(getEffect("blinds", 1).strips).toBe(8);
    expect(stripClip(0, 4, false)).toBe("inset(0% 75% 0 0%)");
    expect(stripClip(3, 4, true)).toBe("inset(100% 0% 0 75%)");
  });
});
