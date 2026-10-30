import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { detectLocale, LOCALE_KEY, LocaleProvider } from "./i18n";

describe("detectLocale", () => {
  it("la elección guardada manda sobre el navegador", () => {
    expect(detectLocale("es", ["en-US"])).toBe("es");
    expect(detectLocale("en", ["es-CO"])).toBe("en");
  });

  it("sin elección guardada usa el primer idioma compatible del navegador", () => {
    expect(detectLocale(null, ["fr-FR", "en-GB", "es"])).toBe("en");
    expect(detectLocale(null, ["es-CO"])).toBe("es");
  });

  it("ignora valores guardados inválidos y cae en español", () => {
    expect(detectLocale("fr", ["de", "fr-FR"])).toBe("es");
    expect(detectLocale(null, [])).toBe("es");
  });
});

describe("cambio de idioma en el sitio", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "es";
  });

  const renderApp = (initialLocale: "es" | "en") =>
    render(
      <MemoryRouter initialEntries={["/ui/theme-toggle"]}>
        <LocaleProvider initialLocale={initialLocale}>
          <App />
        </LocaleProvider>
      </MemoryRouter>,
    );

  it("el botón pasa de español a inglés, traduce la interfaz y lo recuerda", () => {
    renderApp("es");
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar a inglés" }));
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Switch to Spanish" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(LOCALE_KEY)).toBe("en");
  });

  it("de inglés vuelve a español", () => {
    renderApp("en");
    fireEvent.click(screen.getByRole("button", { name: "Switch to Spanish" }));
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("es");
  });

  it("las categorías se traducen en la navegación", () => {
    renderApp("en");
    expect(screen.getAllByRole("navigation", { name: "AI" }).length).toBeGreaterThan(0);
  });
});
