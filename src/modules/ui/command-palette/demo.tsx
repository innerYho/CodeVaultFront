import { useState } from "react";
import { formatHotkey } from "../../hooks/use-hotkey";
import { type CommandItem, CommandPalette } from "./index";

const items: CommandItem[] = [
  {
    id: "theme",
    title: "Cambiar tema",
    description: "Alterna claro y oscuro",
    keywords: ["dark", "modo oscuro"],
    group: "Ajustes",
    hint: "T",
  },
  { id: "profile", title: "Ir al perfil", description: "Datos de tu cuenta", group: "Navegación" },
  {
    id: "security",
    title: "Seguridad y 2FA",
    description: "Verificación en dos pasos",
    keywords: ["autenticación", "contraseña"],
    group: "Ajustes",
  },
  { id: "new", title: "Nuevo documento", keywords: ["crear"], group: "Acciones", hint: "N" },
  {
    id: "help",
    title: "Centro de ayuda",
    description: "Preguntas frecuentes",
    group: "Navegación",
  },
];

export default function Demo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="space-y-3 text-sm">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700"
      >
        Abrir paleta <kbd className="ml-2 rounded border px-1 text-xs">{formatHotkey("mod+k")}</kbd>
      </button>
      <p className="text-zinc-500">
        Prueba a buscar "autenticacion" (sin tilde), "oscuro" o "ajustes".
      </p>
      {last && (
        <p>
          Seleccionaste: <strong>{last}</strong>
        </p>
      )}
      <CommandPalette
        items={items}
        open={open}
        onOpenChange={setOpen}
        onSelect={(i) => setLast(i.title)}
      />
    </div>
  );
}
