import { useEffect, useMemo, useState } from "react";

/**
 * Números de página a mostrar, con `null` donde va «…».
 * `getPageRange(5, 10)` → `[1, null, 4, 5, 6, null, 10]`. Siempre incluye primera y última.
 */
export function getPageRange(current: number, total: number, siblings = 1): (number | null)[] {
  if (total <= 0) return [];
  const slots = siblings * 2 + 5; // primera, última, actual, vecinos y dos «…»
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);
  const left = Math.max(current - siblings, 2);
  const right = Math.min(current + siblings, total - 1);
  const out: (number | null)[] = [1];
  if (left > 2) out.push(left === 3 ? 2 : null);
  for (let p = left; p <= right; p++) out.push(p);
  if (right < total - 1) out.push(right === total - 2 ? total - 1 : null);
  out.push(total);
  return out;
}

export interface UsePaginationResult<T> {
  /** Página actual (empieza en 1). */
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
  /** Elementos de la página actual. */
  items: T[];
  /** Posición (1-based) del primer y último elemento visible; 0 si no hay datos. */
  from: number;
  to: number;
  total: number;
}

/** Pagina un arreglo en memoria. Si los datos encogen, la página se ajusta sola. */
export function usePagination<T>(data: readonly T[], pageSize = 10): UsePaginationResult<T> {
  const [page, setRawPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);

  // Si filtrar deja menos páginas, no quedamos en una vacía.
  useEffect(() => {
    if (page !== safePage) setRawPage(safePage);
  }, [page, safePage]);

  const items = useMemo(
    () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, safePage, pageSize],
  );
  const total = data.length;
  return {
    page: safePage,
    pageCount,
    setPage: (p) => setRawPage(Math.min(Math.max(Math.trunc(p) || 1, 1), pageCount)),
    items,
    from: total === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, total),
    total,
  };
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Cuántos números a cada lado de la página actual. Por defecto 1. */
  siblings?: number;
  /** Nombre de la región para lectores de pantalla. */
  label?: string;
}

const btn =
  "min-w-9 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 aria-[current=page]:border-indigo-500 aria-[current=page]:bg-indigo-500 aria-[current=page]:text-white dark:border-zinc-700 dark:hover:bg-zinc-800";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblings = 1,
  label = "Paginación",
}: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label={label}>
      <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-1 p-0">
        <li>
          <button
            type="button"
            className={btn}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <span aria-hidden="true">‹</span>
          </button>
        </li>
        {getPageRange(page, pageCount, siblings).map((p, i) =>
          p === null ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: los «…» no tienen identidad propia y su posición es estable
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-zinc-500">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={btn}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Página ${p}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={btn}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <span aria-hidden="true">›</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
