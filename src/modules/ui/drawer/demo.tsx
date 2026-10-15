import { useState } from "react";
import { Drawer } from "./index";

export default function Demo() {
  const [side, setSide] = useState<"left" | "right" | null>(null);
  return (
    <div className="space-y-3 text-sm">
      <div className="flex gap-2">
        {(["left", "right"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700"
          >
            Abrir a la {s === "left" ? "izquierda" : "derecha"}
          </button>
        ))}
      </div>
      <Drawer
        open={side !== null}
        onClose={() => setSide(null)}
        label="Panel de ejemplo"
        side={side ?? "left"}
      >
        <h2 className="mb-2 text-lg font-semibold">Panel</h2>
        <p className="mb-4 text-zinc-500">
          Cierra con Escape, pulsando el fondo o con el botón. El foco queda dentro del panel.
        </p>
        <button
          type="button"
          onClick={() => setSide(null)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
        >
          Cerrar
        </button>
      </Drawer>
    </div>
  );
}
