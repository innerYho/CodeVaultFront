import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Parallax } from "./Parallax";

describe("Parallax", () => {
  it("renderiza sus hijos y aplica una transformación", () => {
    render(
      <Parallax distance={50}>
        <p>Capa</p>
      </Parallax>,
    );
    const el = screen.getByText("Capa").parentElement as HTMLElement;
    expect(el.className).toContain("will-change-transform");
    expect(el.style.transform).toBeTruthy();
  });
});
