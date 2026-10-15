import { useSyncExternalStore } from "react";
import { type ResolvedTheme, type ThemeMode, themeStore, toggleTheme } from "./theme-store";

export interface UseTheme {
  /** Preferencia elegida: "light", "dark" o "system". */
  mode: ThemeMode;
  /** Tema efectivo tras resolver "system". */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: typeof toggleTheme;
}

/** No requiere Provider: lee de un store externo, así funciona en cualquier punto del árbol. */
export function useTheme(): UseTheme {
  const mode = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getMode,
    () => "system" as const,
  );
  const resolved = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getResolved,
    () => "light" as const,
  );
  return { mode, resolved, setMode: themeStore.setMode, toggle: toggleTheme };
}
