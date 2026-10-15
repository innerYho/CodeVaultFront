import { type ReactNode, useMemo, useState } from "react";
import { Pagination, usePagination } from "./pagination";

export interface Column<T> {
  /** Identificador único de la columna. */
  key: string;
  header: string;
  /** Contenido de la celda. Por defecto `row[key]`. */
  render?: (row: T) => ReactNode;
  /** Valor para ordenar; si falta, la columna no es ordenable. */
  sortValue?: (row: T) => string | number | Date;
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T> {
  columns: readonly Column<T>[];
  rows: readonly T[];
  /** Clave estable de cada fila (nunca el índice). */
  getRowId: (row: T) => string | number;
  /** Texto accesible que describe la tabla. */
  caption: string;
  pageSize?: number;
  /** Qué mostrar si no hay filas. */
  empty?: ReactNode;
}

type Sort = { key: string; dir: "asc" | "desc" } | null;
const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

function compare(a: string | number | Date, b: string | number | Date) {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  pageSize = 10,
  empty = "No hay datos para mostrar.",
}: DataTableProps<T>) {
  const [sort, setSort] = useState<Sort>(null);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!sort || !col?.sortValue) return rows;
    const get = col.sortValue;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => factor * compare(get(a), get(b)));
  }, [rows, columns, sort]);

  const pager = usePagination(sorted, pageSize);

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null,
    );

  if (rows.length === 0) {
    return (
      <p
        role="status"
        className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700"
      >
        {empty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        {/* tabIndex: una región con scroll debe ser alcanzable con el teclado */}
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: región desplazable enfocable (axe: scrollable-region-focusable) */}
        <table className="w-full text-sm" tabIndex={0} aria-label={caption}>
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={`px-3 py-2 font-medium ${alignClass[c.align ?? "left"]}`}
                    aria-sort={
                      active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
                    }
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        {c.header}
                        <span aria-hidden="true" className="text-xs text-zinc-500">
                          {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {pager.items.map((row) => (
              <tr key={getRowId(row)}>
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2 ${alignClass[c.align ?? "left"]}`}>
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p aria-live="polite" className="text-center text-xs text-zinc-500">
        Mostrando {pager.from}–{pager.to} de {pager.total}
      </p>
      <Pagination page={pager.page} pageCount={pager.pageCount} onPageChange={pager.setPage} />
    </div>
  );
}
