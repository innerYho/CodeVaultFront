import { render, waitFor } from "@testing-library/react";
import axe from "axe-core";
import type { ComponentType } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./app/App";

// Cada módulo con demo se audita con axe-core. `color-contrast` se omite: jsdom no calcula estilos
// ni layout, así que ese chequeo solo daría falsos resultados (se revisa en un navegador real).
const demos = import.meta.glob<{ default: ComponentType }>("./modules/*/*/demo.tsx", {
  eager: true,
});

async function audit(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
  );
}

describe("accesibilidad (axe-core)", () => {
  it("el auditor detecta problemas reales (control: si esto falla, las demás pruebas no valen)", async () => {
    const { container } = render(
      <div>
        {/* biome-ignore lint/a11y/useAltText: control intencionado: axe debe detectar esta imagen sin alt */}
        <img src="/x.png" />
        <button type="button" />
      </div>,
    );
    const found = (await audit(container)).join("\n");
    expect(found).toContain("image-alt");
    expect(found).toContain("button-name");
  });

  for (const [path, mod] of Object.entries(demos)) {
    const name = path.replace("./modules/", "").replace("/demo.tsx", "");
    it(`demo ${name} sin violaciones`, async () => {
      const Demo = mod.default;
      const { container } = render(<Demo />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      expect(await audit(container)).toEqual([]);
    });
  }

  it("el sitio completo (shell, navegación y búsqueda cerrada) sin violaciones", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/ui/theme-toggle"]}>
        <App />
      </MemoryRouter>,
    );
    expect(await audit(container)).toEqual([]);
  });
});
