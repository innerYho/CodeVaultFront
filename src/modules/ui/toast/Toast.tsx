import { AnimatePresence, animate, motion } from "motion/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastKind = "info" | "success" | "error";

export interface ToastOptions {
  title: string;
  description?: string;
  kind?: ToastKind;
  /** Milisegundos visible. `0` lo deja fijo hasta cerrarlo (recomendado para errores). Por defecto 4000. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "title" | "kind" | "duration">> {
  id: number;
  description?: string;
}

interface ToastApi {
  /** Muestra un aviso; devuelve una función para cerrarlo. */
  toast: (options: ToastOptions) => () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const styles: Record<ToastKind, string> = {
  info: "border-sky-500",
  success: "border-emerald-500",
  error: "border-red-500",
};
const icons: Record<ToastKind, string> = { info: "ℹ", success: "✓", error: "✕" };

function ToastCard({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  const bar = useRef<HTMLDivElement>(null);
  const controls = useRef<ReturnType<typeof animate> | null>(null);
  const close = useCallback(() => onClose(item.id), [onClose, item.id]);

  // La barra de progreso ES el temporizador: al pausarla se pausa el cierre y no pueden desincronizarse.
  useEffect(() => {
    if (!item.duration || !bar.current) return;
    const anim = animate(
      bar.current,
      { scaleX: 0 },
      { duration: item.duration / 1000, ease: "linear", onComplete: close },
    );
    controls.current = anim;
    return () => anim.stop();
  }, [item.duration, close]);

  const pause = () => controls.current?.pause();
  const resume = () => controls.current?.play();

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      // Los errores interrumpen (assertive); el resto espera su turno (polite).
      role={item.kind === "error" ? "alert" : "status"}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className={`pointer-events-auto relative w-80 overflow-hidden rounded-lg border-l-4 bg-white p-3 pr-9 shadow-lg dark:bg-zinc-900 ${styles[item.kind]}`}
    >
      <p className="text-sm font-medium">
        <span aria-hidden="true" className="mr-2">
          {icons[item.kind]}
        </span>
        {item.title}
      </p>
      {item.description && <p className="mt-1 text-xs text-zinc-500">{item.description}</p>}
      <button
        type="button"
        onClick={close}
        aria-label={`Cerrar aviso: ${item.title}`}
        className="absolute top-2 right-2 rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <span aria-hidden="true">×</span>
      </button>
      {item.duration > 0 && (
        <div
          ref={bar}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-current opacity-30"
        />
      )}
    </motion.li>
  );
}

export function ToastProvider({
  children,
  max = 5,
}: {
  children: ReactNode;
  /** Máximo de avisos a la vez; el más antiguo se descarta. */
  max?: number;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    ({ title, description, kind = "info", duration }: ToastOptions) => {
      const id = nextId.current++;
      const item: ToastItem = {
        id,
        title,
        description,
        kind,
        // Un error no debería desaparecer solo antes de poder leerlo.
        duration: duration ?? (kind === "error" ? 0 : 4000),
      };
      setItems((l) => [...l, item].slice(-max));
      return () => dismiss(id);
    },
    [dismiss, max],
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ul
        aria-label="Avisos"
        className="pointer-events-none fixed top-4 right-4 z-50 m-0 flex list-none flex-col gap-2 p-0"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <ToastCard key={t.id} item={t} onClose={dismiss} />
          ))}
        </AnimatePresence>
      </ul>
    </ToastContext.Provider>
  );
}
