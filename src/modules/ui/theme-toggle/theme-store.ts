export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

// Debe coincidir con el script anti-destello de index.html.
export const STORAGE_KEY = "codevault-theme";

const listeners = new Set<() => void>();
// matchMedia puede no existir (SSR, jsdom, navegadores antiguos): sin él "system" equivale a claro.
const media =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

function readMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // localStorage puede no estar disponible (modo privado, iframes).
  }
  return "system";
}

let mode: ThemeMode = typeof window === "undefined" ? "system" : readMode();

export function resolve(m: ThemeMode): ResolvedTheme {
  if (m === "system") return media?.matches ? "dark" : "light";
  return m;
}

function applyToDom() {
  const dark = resolve(mode) === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function emit() {
  for (const l of listeners) l();
}

media?.addEventListener("change", () => {
  if (mode !== "system") return;
  applyToDom();
  emit();
});

export const themeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getMode: () => mode,
  getResolved: () => resolve(mode),
  /** Aplica el tema al DOM de forma síncrona (necesario para View Transitions). */
  setMode(next: ThemeMode) {
    mode = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Se ignora: el tema funciona igual, solo no persiste.
    }
    applyToDom();
    emit();
  },
};

export interface ToggleOrigin {
  x: number;
  y: number;
}

/**
 * Alterna claro/oscuro. Con `origin` y soporte de View Transitions anima un
 * círculo que se expande desde ese punto; si no, cambia sin animación.
 */
export function toggleTheme(origin?: ToggleOrigin) {
  const next: ResolvedTheme = themeStore.getResolved() === "dark" ? "light" : "dark";
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  if (!origin || reduce || !document.startViewTransition) {
    themeStore.setMode(next);
    return;
  }

  const radius = Math.hypot(
    Math.max(origin.x, innerWidth - origin.x),
    Math.max(origin.y, innerHeight - origin.y),
  );
  const transition = document.startViewTransition(() => themeStore.setMode(next));
  transition.ready
    .then(() =>
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
}
