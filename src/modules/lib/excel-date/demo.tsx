import { useState } from "react";
import { excelSerialToDate, toIsoDate } from "./index";

export default function Demo() {
  const [text, setText] = useState("45292.5");
  const serial = Number(text);
  let result = "Escribe un número de serie válido.";
  if (text.trim() !== "" && Number.isFinite(serial)) {
    const d = excelSerialToDate(serial);
    result = `${toIsoDate(d)} ${d.toISOString().slice(11, 19)} UTC`;
  }
  return (
    <div className="max-w-sm space-y-3 text-sm">
      <label className="block space-y-1">
        <span className="font-medium">Número de serie de Excel</span>
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <p aria-live="polite" className="font-mono">
        → {result}
      </p>
      <p className="text-xs text-zinc-500">
        Prueba 1, 59, 61 (febrero/marzo de 1900), 45292 o 45292.75 (con hora).
      </p>
    </div>
  );
}
