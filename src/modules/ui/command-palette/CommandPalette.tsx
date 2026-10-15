import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatHotkey, useHotkey } from "../../hooks/use-hotkey";
import { type SearchableItem, searchItems } from "./search";

export interface CommandItem extends SearchableItem {
  /** Texto a la derecha (p. ej. un estado). */
  hint?: string;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  onSelect: (item: CommandItem) => void;
  /** Controlado: si lo pasas, tú decides cuándo está abierta. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Atajo que la abre. Pasa `null` para no registrar ninguno.
   * @default "mod+k" */
  hotkey?: string | null;
  /** @default "Buscar…" */
  placeholder?: string;
  /** @default "Sin resultados" */
  emptyText?: string;
  /** Título accesible del diálogo.
   * @default "Buscar" */
  label?: string;
}

export function CommandPalette({
  items,
  onSelect,
  open: openProp,
  onOpenChange,
  hotkey = "mod+k",
  placeholder = "Buscar…",
  emptyText = "Sin resultados",
  label = "Buscar",
}: CommandPaletteProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (v: boolean) => {
    setOpenState(v);
    onOpenChange?.(v);
  };

  useHotkey(hotkey ?? "mod+k", () => setOpen(!open), { enabled: hotkey !== null });

  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={() => open && setOpen(false)} // Escape cierra el <dialog> nativo
      // mousedown, no click: arrastrar para seleccionar texto y soltar fuera no debe cerrar
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
      className="m-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-black/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {/* Se monta solo abierta: el estado de búsqueda arranca limpio cada vez. */}
      {open && (
        <Panel
          items={items}
          onSelect={(i) => {
            setOpen(false);
            onSelect(i);
          }}
          placeholder={placeholder}
          emptyText={emptyText}
          hotkey={hotkey}
        />
      )}
    </dialog>
  );
}

function Panel({
  items,
  onSelect,
  placeholder,
  emptyText,
  hotkey,
}: Required<Pick<CommandPaletteProps, "items" | "placeholder" | "emptyText">> & {
  onSelect: (i: CommandItem) => void;
  hotkey: string | null;
}) {
  const reduce = useReducedMotion();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchItems(items, query), [items, query]);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    document.getElementById(`${listId}-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current, listId]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") setActive((current + 1) % results.length);
    else if (e.key === "ArrowUp") setActive((current - 1 + results.length) % results.length);
    else if (e.key === "Enter") {
      const item = results[current];
      if (item) onSelect(item);
    } else return;
    e.preventDefault();
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.12 }}
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-700">
        <input
          // biome-ignore lint/a11y/noAutofocus: al abrir un diálogo de búsqueda el foco debe estar en el campo.
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results.length ? `${listId}-${current}` : undefined}
          aria-autocomplete="list"
          placeholder={placeholder}
          aria-label={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="h-12 w-full bg-transparent outline-none placeholder:text-zinc-400"
        />
        {hotkey && (
          <kbd className="shrink-0 rounded border border-zinc-300 px-1.5 text-xs text-zinc-500 dark:border-zinc-700">
            {formatHotkey(hotkey)}
          </kbd>
        )}
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label="Resultados"
        className="max-h-80 overflow-y-auto p-2"
      >
        {results.map((item, i) => (
          <div
            key={item.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === current}
            tabIndex={-1}
            onMouseMove={() => setActive(i)}
            onClick={() => onSelect(item)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
            className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2 ${i === current ? "bg-indigo-50 dark:bg-indigo-950" : ""}`}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.title}</span>
              {item.description && (
                <span className="block truncate text-xs text-zinc-500">{item.description}</span>
              )}
            </span>
            <span className="shrink-0 text-xs text-zinc-500">
              {[item.group, item.hint].filter(Boolean).join(" · ")}
            </span>
          </div>
        ))}
      </div>
      {/* Anuncia el número de resultados a lectores de pantalla. */}
      <p role="status" className={results.length ? "sr-only" : "px-4 pb-4 text-sm text-zinc-500"}>
        {results.length ? `${results.length} resultados` : emptyText}
      </p>
    </motion.div>
  );
}
