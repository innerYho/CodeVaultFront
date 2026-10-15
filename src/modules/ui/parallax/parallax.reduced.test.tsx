import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Motion lee `matchMedia` una sola vez al cargar: se simula antes de importar nada más.
vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({
    matches: q.includes("reduce"),
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })) as unknown as typeof window.matchMedia;
});

import { Parallax } from "./Parallax";

describe("Parallax con prefers-reduced-motion", () => {
  it("no desplaza la capa", () => {
    render(
      <Parallax distance={200}>
        <p>Quieta</p>
      </Parallax>,
    );
    const el = screen.getByText("Quieta").parentElement as HTMLElement;
    expect(el.style.transform).toMatch(/translateY\(0(px)?\)|none/);
  });
});
