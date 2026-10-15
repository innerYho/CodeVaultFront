import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./App";

const renderApp = (path = "/ui/theme-toggle") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe("App", () => {
  it("Ctrl+K abre la búsqueda y Enter navega al módulo elegido", async () => {
    renderApp();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "otp" } });
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(2); // "otp" está en las etiquetas de otp-input y login-2fa (totp)
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
  });

  it('la búsqueda ignora tildes: "dia noche" encuentra "día/noche"', () => {
    renderApp();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "dia noche" } });
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]?.textContent).toContain("Theme Toggle");
  });

  it("el botón de menú abre el Drawer con la navegación", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const dialog = screen.getByRole("dialog", { name: "Menú de navegación", hidden: true });
    expect(within(dialog).getByRole("link", { name: "OTP Input" })).toBeTruthy();
  });

  it("elegir un enlace del menú móvil lo cierra", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const dialog = screen.getByRole("dialog", { name: "Menú de navegación", hidden: true });
    fireEvent.click(within(dialog).getByRole("link", { name: "Drawer" }));
    expect(dialog.hasAttribute("open")).toBe(false);
  });
});
