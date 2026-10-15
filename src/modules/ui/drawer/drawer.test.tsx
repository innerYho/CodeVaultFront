import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "./Drawer";

describe("Drawer", () => {
  it("muestra el contenido solo cuando está abierto", () => {
    const { rerender } = render(
      <Drawer open={false} onClose={() => {}} label="Menú">
        <p>Contenido</p>
      </Drawer>,
    );
    expect(screen.queryByText("Contenido")).toBeNull();
    rerender(
      <Drawer open onClose={() => {}} label="Menú">
        <p>Contenido</p>
      </Drawer>,
    );
    expect(screen.getByText("Contenido")).toBeTruthy();
    expect(document.querySelector("dialog")?.hasAttribute("open")).toBe(true);
  });
  it("cierra al pulsar el fondo pero no el contenido", () => {
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} label="Menú">
        <p>Contenido</p>
      </Drawer>,
    );
    fireEvent.mouseDown(screen.getByText("Contenido"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(document.querySelector("dialog") as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
