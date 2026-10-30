import { useId, useState } from "react";
import type { RunState } from "./reducer";
import type { PageSummary, ScrapeClient } from "./types";
import { useScrapeRun } from "./useScrapeRun";

export interface ScrapePanelProps {
  client: ScrapeClient;
  /** Filas máximas de la tabla de resultados.
   * @default 50 */
  maxRows?: number;
  className?: string;
}

const fmt = (v: unknown): string => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "number") return v.toLocaleString("es-CO");
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
};

const pathOf = (url: string) => {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
};

/** Resumen en una frase, para el lector de pantalla y para la vista. */
export function summarize(state: RunState): string {
  const p = state.progress;
  switch (state.status) {
    case "idle":
      return "Elige un escenario y pulsa Ejecutar.";
    case "error":
      return state.error ?? "La ejecución falló.";
    case "running":
      return p
        ? `Procesando: ${p.done}${p.total === null ? "" : ` de ${p.total}`} páginas, ${p.items} registros, ${p.failed} fallos.`
        : "Iniciando…";
    case "cancelled":
      return `Cancelado: ${p?.done ?? state.pages.length} páginas leídas, ${p?.items ?? 0} registros.`;
    case "done":
      return `Terminado: ${p?.done ?? state.pages.length} páginas, ${p?.items ?? 0} registros, ${p?.failed ?? 0} fallos.`;
  }
}

function columnsOf(pages: PageSummary[]): string[] {
  const cols: string[] = [];
  for (const page of pages)
    for (const item of page.items)
      for (const key of Object.keys(item)) if (!cols.includes(key)) cols.push(key);
  return cols;
}

/**
 * Panel para ver un scraping funcionar: elige un escenario, lo ejecuta y muestra el avance,
 * cada página leída (con el motivo si falló), los reintentos y los datos extraídos.
 */
export function ScrapePanel({ client, maxRows = 50, className = "" }: ScrapePanelProps) {
  const { scenarios, scenariosError, state, start, cancel } = useScrapeRun(client);
  const [chosen, setChosen] = useState<string | null>(null);
  const groupId = useId();

  const selected = chosen ?? scenarios?.find((s) => s.available)?.id ?? null;
  const running = state.status === "running";
  const p = state.progress;
  const known = p?.total != null;
  const percent = known && p.total ? Math.min(100, Math.round((p.done / p.total) * 100)) : null;

  const rows = state.pages.flatMap((page) => page.items).slice(0, maxRows);
  const total = state.pages.reduce((n, page) => n + page.items.length, 0);
  const cols = columnsOf(state.pages);

  return (
    <section className={`space-y-4 ${className}`}>
      <fieldset disabled={running} className="space-y-2">
        <legend className="mb-1 font-medium">Escenario</legend>
        {scenariosError && (
          <p role="alert" className="text-red-700 dark:text-red-400">
            {scenariosError}
          </p>
        )}
        {!scenarios && !scenariosError && (
          <p className="text-sm text-zinc-500">Cargando escenarios…</p>
        )}
        {scenarios?.map((s) => (
          <label
            key={s.id}
            className={`flex gap-3 rounded-lg border border-zinc-300 p-3 dark:border-zinc-700 ${s.available ? "cursor-pointer" : "opacity-60"}`}
          >
            <input
              type="radio"
              name={groupId}
              value={s.id}
              checked={selected === s.id}
              disabled={!s.available}
              onChange={() => setChosen(s.id)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">{s.title}</span>
              <span className="block text-sm text-zinc-600 dark:text-zinc-400">
                {s.description}
              </span>
              {!s.available && (
                <span className="block text-sm text-amber-700 dark:text-amber-400">
                  No disponible: el servidor no tiene Chrome.
                </span>
              )}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={running || !selected}
          onClick={() => selected && start(selected)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
        >
          Ejecutar
        </button>
        <button
          type="button"
          disabled={!running}
          onClick={cancel}
          className="rounded-md border border-zinc-300 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 dark:border-zinc-700"
        >
          Cancelar
        </button>
      </div>

      {(running || p) && (
        <div
          role="progressbar"
          aria-label="Avance del scraping"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? undefined}
          aria-valuetext={summarize(state)}
          className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        >
          <div
            className={`h-full bg-indigo-600 transition-[width] motion-reduce:transition-none ${percent === null && running ? "w-1/3 animate-pulse motion-reduce:animate-none" : ""}`}
            style={
              percent === null
                ? undefined
                : { width: `${state.status === "done" ? 100 : percent}%` }
            }
          />
        </div>
      )}

      <p role="status" aria-live="polite" className="text-sm">
        {summarize(state)}
      </p>

      {state.pages.length > 0 && (
        <div>
          <h3 className="mb-1 font-medium">Páginas</h3>
          <ol className="space-y-1 text-sm">
            {state.pages.map((page, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: la misma URL puede leerse dos veces; la lista solo crece
              <li key={`${i}-${page.url}`} className="flex flex-wrap gap-x-2">
                <span aria-hidden="true">{page.ok ? "✓" : "✗"}</span>
                <span className="sr-only">{page.ok ? "Leída:" : "Falló:"}</span>
                <code>{pathOf(page.url)}</code>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {page.ok
                    ? `${page.items.length} ${page.items.length === 1 ? "registro" : "registros"}${page.issues.length ? `, ${page.issues.length} ${page.issues.length === 1 ? "aviso" : "avisos"}` : ""}`
                    : `${page.reason ?? "error"}${page.description ? `: ${page.description}` : ""}`}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {state.logs.length > 0 && (
        <div>
          <h3 className="mb-1 font-medium">Registro</h3>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {state.logs.map((line, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: el registro solo crece y las líneas pueden repetirse
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <h3 className="mb-1 font-medium">Datos extraídos</h3>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Registros extraídos por el scraping</caption>
              <thead className="bg-zinc-50 text-xs uppercase dark:bg-zinc-900">
                <tr>
                  {cols.map((c) => (
                    <th key={c} scope="col" className="px-3 py-2">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: filas de solo lectura sin identificador propio
                  <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800">
                    {cols.map((c) => (
                      <td key={c} className="px-3 py-2">
                        {fmt(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > rows.length && (
            <p className="mt-1 text-xs text-zinc-500">
              Mostrando {rows.length} de {total} registros.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
