import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

export interface FabAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
}

export interface FloatingActionButtonProps {
  /** Texto accesible del botón principal. */
  label: string;
  icon: ReactNode;
  /** Contador sobre el botón. 0 o undefined lo oculta; se muestra "99+" desde 100. */
  badge?: number;
  /** Si se define, el botón abre un panel con estas acciones; si no, llama a `onClick`. */
  actions?: FabAction[];
  onClick?: () => void;
  /** Esquina de la pantalla donde se ancla.
   * @default "bottom-right" */
  position?: "bottom-right" | "bottom-left";
  /** Cambia el color del badge (p. ej. "danger" para pendientes urgentes).
   * @default "neutral" */
  tone?: "neutral" | "danger";
}

const POSITION = {
  "bottom-right": "right-6 items-end",
  "bottom-left": "left-6 items-start",
} as const;

export function FloatingActionButton({
  label,
  icon,
  badge,
  actions,
  onClick,
  position = "bottom-right",
  tone = "neutral",
}: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const reduce = useReducedMotion();
  const hasPanel = !!actions?.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const badgeText = badge && badge > 0 ? (badge > 99 ? "99+" : String(badge)) : null;

  return (
    <div ref={rootRef} className={`fixed bottom-6 z-50 flex flex-col gap-3 ${POSITION[position]}`}>
      <AnimatePresence>
        {open && hasPanel && (
          <motion.ul
            id={panelId}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="min-w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            {actions?.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    a.onSelect();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {a.icon}
                  {a.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={label}
        aria-expanded={hasPanel ? open : undefined}
        aria-controls={hasPanel ? panelId : undefined}
        onClick={() => (hasPanel ? setOpen((o) => !o) : onClick?.())}
        whileHover={reduce ? undefined : { scale: 1.08 }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        className="relative grid size-14 place-items-center rounded-full bg-indigo-600 text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      >
        {icon}
        <AnimatePresence>
          {badgeText && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              aria-label={`${badgeText} pendientes`}
              className={`absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full px-1 text-xs font-bold ${tone === "danger" ? "bg-red-600" : "bg-zinc-700"} text-white`}
            >
              {badgeText}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
