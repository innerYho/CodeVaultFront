import { useState } from "react";
import { QrCode } from "./index";

export default function Demo() {
  const [value, setValue] = useState("https://t.me/CodeVaultBot?start=ejemplo");
  return (
    <div className="flex flex-wrap items-start gap-6 text-sm">
      <QrCode value={value} label={`Código QR de: ${value}`} />
      <label className="block max-w-sm flex-1 space-y-1">
        <span className="font-medium">Contenido</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <span className="block text-xs text-zinc-500">
          Se genera en tu navegador; el texto no se envía a ningún servicio.
        </span>
      </label>
    </div>
  );
}
