import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type ToastOptions, ToastProvider, useToast } from "./index";

let api: ReturnType<typeof useToast>;
function Capture() {
  api = useToast();
  return null;
}
const setup = (max?: number) =>
  render(
    <ToastProvider max={max}>
      <Capture />
    </ToastProvider>,
  );
const show = (o: ToastOptions) => {
  let close = () => {};
  act(() => {
    close = api.toast(o);
  });
  return close;
};

describe("<ToastProvider />", () => {
  it("usa role=status para avisos y role=alert para errores", () => {
    setup();
    show({ title: "Hecho", kind: "success" });
    show({ title: "Falló", kind: "error" });
    expect(screen.getByRole("status").textContent).toContain("Hecho");
    expect(screen.getByRole("alert").textContent).toContain("Falló");
  });

  it("se cierra con el botón", async () => {
    setup();
    show({ title: "Adiós", duration: 0 });
    fireEvent.click(screen.getByRole("button", { name: /Cerrar aviso: Adiós/ }));
    await waitFor(() => expect(screen.queryByText("Adiós")).toBeNull());
  });

  it("se cierra solo al terminar la duración", async () => {
    setup();
    show({ title: "Efímero", duration: 150 });
    expect(screen.getByText("Efímero")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Efímero")).toBeNull(), { timeout: 3000 });
  });

  it("se pausa mientras el cursor está encima y sigue al salir", async () => {
    setup();
    show({ title: "Pausable", duration: 200 });
    const card = screen.getByRole("status");
    fireEvent.mouseEnter(card);
    await new Promise((r) => setTimeout(r, 500));
    expect(screen.getByText("Pausable")).toBeTruthy();
    fireEvent.mouseLeave(card);
    await waitFor(() => expect(screen.queryByText("Pausable")).toBeNull(), { timeout: 3000 });
  });

  it("los errores no se cierran solos por defecto", async () => {
    setup();
    show({ title: "Error persistente", kind: "error" });
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.getByText("Error persistente")).toBeTruthy();
  });

  it("respeta el máximo descartando el más antiguo", async () => {
    setup(2);
    show({ title: "uno", duration: 0 });
    show({ title: "dos", duration: 0 });
    show({ title: "tres", duration: 0 });
    // El descartado sigue en el DOM durante su animación de salida.
    await waitFor(() => expect(screen.queryByText("uno")).toBeNull());
    expect(screen.getByText("dos")).toBeTruthy();
    expect(screen.getByText("tres")).toBeTruthy();
  });

  it("toast() devuelve una función para cerrarlo", async () => {
    setup();
    const close = show({ title: "Subiendo", duration: 0 });
    expect(screen.getByText("Subiendo")).toBeTruthy();
    act(() => close());
    await waitFor(() => expect(screen.queryByText("Subiendo")).toBeNull());
  });

  it("useToast fuera del proveedor lanza un error claro", () => {
    expect(() => render(<Capture />)).toThrow(/ToastProvider/);
  });
});
