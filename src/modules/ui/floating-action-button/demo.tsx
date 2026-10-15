import { useState } from "react";
import { FloatingActionButton } from "./index";

const Plus = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function Demo() {
  const [count, setCount] = useState(3);
  return (
    <div className="space-y-3 text-sm">
      <p>El botón flotante está abajo a la derecha de la pantalla.</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1"
          onClick={() => setCount((c) => c + 1)}
        >
          +1 pendiente
        </button>
        <button type="button" className="rounded-md border px-3 py-1" onClick={() => setCount(0)}>
          Limpiar
        </button>
      </div>
      <FloatingActionButton
        label="Acciones rápidas"
        icon={Plus}
        badge={count}
        tone="danger"
        actions={[
          { id: "new", label: "Nueva solicitud", onSelect: () => alert("Nueva solicitud") },
          { id: "list", label: "Ver tabla", onSelect: () => alert("Ver tabla") },
        ]}
      />
    </div>
  );
}
