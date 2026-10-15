import { useState } from "react";
import { formatHotkey, useHotkey } from "./index";

export default function Demo() {
  const [log, setLog] = useState<{ id: number; text: string }[]>([]);
  const add = (text: string) =>
    setLog((l) => [{ id: (l[0]?.id ?? 0) + 1, text }, ...l].slice(0, 5));

  useHotkey("mod+j", () => add("mod+j"));
  useHotkey("shift+/", () => add("shift+/ (?)"));
  useHotkey("g", () => add("g (una tecla)"));

  return (
    <div className="space-y-3 text-sm">
      <p>
        Pulsa <kbd className="rounded border px-1">{formatHotkey("mod+j")}</kbd>,{" "}
        <kbd className="rounded border px-1">?</kbd> o <kbd className="rounded border px-1">g</kbd>.
        La tecla <code>g</code> no se dispara al escribir aquí:
      </p>
      <input
        aria-label="Campo de prueba"
        placeholder="Escribe una g aquí…"
        className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <ul className="font-mono text-xs text-zinc-500">
        {log.length ? log.map((l) => <li key={l.id}>→ {l.text}</li>) : <li>(sin eventos)</li>}
      </ul>
    </div>
  );
}
