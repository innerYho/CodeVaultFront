import {
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

export type StorageKind = "local" | "session";

/**
 * Núcleo compartido: un almacén (`localStorage` o `sessionStorage`) con sus oyentes y su respaldo en memoria.
 * Cada tipo tiene su propio estado, así que una clave en `local` y otra igual en `session` no se pisan.
 */
function createStore(kind: StorageKind) {
  const listeners = new Set<() => void>();
  /** Si el almacenamiento falla (modo privado, cuota, bloqueado) el hook sigue funcionando en memoria. */
  const fallback = new Map<string, string>();

  // Incluso leer `window.localStorage` puede lanzar (SecurityError con cookies bloqueadas).
  const area = (): Storage | null => {
    try {
      return kind === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  };
  const notify = () => {
    for (const l of listeners) l();
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      // `storage` solo llega desde OTRAS pestañas (en `localStorage`); en la misma se avisa con `notify`.
      // `sessionStorage` es propio de cada pestaña: no hay sincronización entre pestañas, solo entre componentes.
      window.addEventListener("storage", listener);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
      };
    },
    read(key: string): string | null {
      let stored: string | null = null;
      try {
        stored = area()?.getItem(key) ?? null;
      } catch {}
      // Con la cuota llena `setItem` falla pero `getItem` funciona: el respaldo cubre ese caso.
      return stored ?? fallback.get(key) ?? null;
    },
    write(key: string, value: string | null) {
      try {
        const a = area();
        if (!a) throw new Error("sin almacenamiento");
        if (value === null) a.removeItem(key);
        else a.setItem(key, value);
        fallback.delete(key);
      } catch {
        if (value === null) fallback.delete(key);
        else fallback.set(key, value);
      }
      notify();
    },
  };
}

type Store = ReturnType<typeof createStore>;
const stores: Record<StorageKind, Store> = {
  local: createStore("local"),
  session: createStore("session"),
};

/** Lee el texto crudo guardado (sin interpretar). Útil fuera de React. */
export function readRaw(key: string, kind: StorageKind = "local"): string | null {
  return stores[kind].read(key);
}

export interface UseWebStorageOptions<T> {
  /** Convierte el valor a texto. Por defecto `JSON.stringify`. */
  serialize?: (value: T) => string;
  /** Convierte el texto a valor; si lanza, se usa el valor inicial. Por defecto `JSON.parse`. */
  deserialize?: (raw: string) => T;
}

function useWebStorage<T>(
  kind: StorageKind,
  key: string,
  initial: T,
  options: UseWebStorageOptions<T>,
): [T, (value: SetStateAction<T>) => void, () => void] {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  // El snapshot es el texto crudo (un primitivo): React compara por igualdad y no re-renderiza sin cambios.
  const store = stores[kind];
  const raw = useSyncExternalStore(
    store.subscribe,
    () => store.read(key),
    () => null,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: `initial`/serializadores suelen ser literales nuevos en cada render; solo importa el texto
  const value = useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      return deserialize(raw) as T;
    } catch {
      return initial;
    }
  }, [raw]);

  // Última versión de las opciones, para que `set` conserve su identidad aunque pasen literales nuevos.
  const latest = useRef({ initial, serialize, deserialize });
  useEffect(() => {
    latest.current = { initial, serialize, deserialize };
  });

  const set = useCallback(
    (next: SetStateAction<T>) => {
      const { initial, serialize, deserialize } = latest.current;
      // Se lee el valor actual del almacenamiento (no del cierre) para que `set(v => v + 1)` dos veces seguidas sume 2.
      const currentRaw = store.read(key);
      let current = initial;
      if (currentRaw !== null) {
        try {
          current = deserialize(currentRaw) as T;
        } catch {}
      }
      const resolved = typeof next === "function" ? (next as (p: T) => T)(current) : next;
      store.write(key, serialize(resolved));
    },
    [store, key],
  );

  const remove = useCallback(() => store.write(key, null), [store, key]);

  return [value, set, remove];
}

/**
 * Estado persistido en `localStorage`: sobrevive a cerrar el navegador y se sincroniza entre componentes y pestañas.
 * Devuelve `[valor, setValor, borrar]`. Con SSR devuelve siempre `initial`.
 */
export function useLocalStorage<T>(key: string, initial: T, options: UseWebStorageOptions<T> = {}) {
  return useWebStorage("local", key, initial, options);
}

/**
 * Estado persistido en `sessionStorage`: vive solo mientras la pestaña esté abierta (sobrevive a recargarla)
 * y cada pestaña tiene el suyo. Se sincroniza entre componentes de la misma pestaña.
 */
export function useSessionStorage<T>(
  key: string,
  initial: T,
  options: UseWebStorageOptions<T> = {},
) {
  return useWebStorage("session", key, initial, options);
}
