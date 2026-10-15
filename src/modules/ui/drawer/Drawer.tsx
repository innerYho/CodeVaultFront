import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Nombre accesible del panel (p. ej. "Menú de navegación"). */
  label: string;
  children: ReactNode;
  /** Borde del que sale el panel.
   * @default "left" */
  side?: "left" | "right";
  /** Ancho del panel.
   * @default "18rem" */
  width?: string;
}

/** Panel lateral modal sobre `<dialog>`: atrapa el foco, cierra con Escape o al pulsar el fondo. */
export function Drawer({
  open,
  onClose,
  label,
  children,
  side = "left",
  width = "18rem",
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      // mousedown, no click: arrastrar para seleccionar texto y soltar fuera no debe cerrar
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className="m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-0 backdrop:bg-black/40"
    >
      {open && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { x: side === "left" ? "-100%" : "100%" }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
          style={{ width }}
          className={`h-full overflow-y-auto bg-white p-4 text-zinc-900 shadow-xl dark:bg-zinc-950 dark:text-zinc-100 ${side === "right" ? "ml-auto" : ""}`}
        >
          {children}
        </motion.div>
      )}
    </dialog>
  );
}
