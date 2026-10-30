import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "es" | "en";

export const LOCALES: readonly Locale[] = ["es", "en"];
export const LOCALE_KEY = "codevault-locale";

const es = {
  nav: { menu: "Menú de navegación", openMenu: "Abrir menú", closeMenu: "Cerrar menú" },
  search: {
    button: "Buscar…",
    placeholder: "Buscar módulos, guías, etiquetas…",
    empty: "Ningún módulo coincide",
    label: "Buscar en CodeVault",
  },
  theme: { toLight: "Cambiar a tema claro", toDark: "Cambiar a tema oscuro" },
  lang: { switchTo: "Cambiar a inglés", code: "EN" },
  page: {
    notFound: "No encontrado.",
    moduleNotFound: "Módulo no encontrado.",
    loading: "Cargando…",
    noDemo: "Este módulo no tiene demo.",
    demo: "Demo",
    docs: "Documentación",
    code: "Código",
  },
  api: {
    generated: "Generada automáticamente desde los tipos (pnpm api).",
    prop: "Prop",
    type: "Tipo",
    default: "Por defecto",
    description: "Descripción",
    required: "Obligatoria",
  },
  copy: "Copiar",
  categories: {
    auth: "Autenticación",
    guides: "Guías",
    hooks: "Hooks",
    ia: "IA",
    lib: "Utilidades",
    notify: "Notificaciones",
    ui: "Interfaz",
  } as Record<string, string>,
};

export type Messages = typeof es;

const en: Messages = {
  nav: { menu: "Navigation menu", openMenu: "Open menu", closeMenu: "Close menu" },
  search: {
    button: "Search…",
    placeholder: "Search modules, guides, tags…",
    empty: "No module matches",
    label: "Search CodeVault",
  },
  theme: { toLight: "Switch to light theme", toDark: "Switch to dark theme" },
  lang: { switchTo: "Switch to Spanish", code: "ES" },
  page: {
    notFound: "Not found.",
    moduleNotFound: "Module not found.",
    loading: "Loading…",
    noDemo: "This module has no demo.",
    demo: "Demo",
    docs: "Documentation",
    code: "Code",
  },
  api: {
    generated: "Generated automatically from the types (pnpm api).",
    prop: "Prop",
    type: "Type",
    default: "Default",
    description: "Description",
    required: "Required",
  },
  copy: "Copy",
  categories: {
    auth: "Authentication",
    guides: "Guides",
    hooks: "Hooks",
    ia: "AI",
    lib: "Utilities",
    notify: "Notifications",
    ui: "Interface",
  },
};

const MESSAGES: Record<Locale, Messages> = { es, en };

/** Elige el idioma: la elección guardada manda; si no hay, el primero compatible del navegador; si no, español. */
export function detectLocale(stored: string | null, languages: readonly string[]): Locale {
  if (stored === "es" || stored === "en") return stored;
  for (const lang of languages) {
    const base = lang.toLowerCase().split("-")[0];
    if (base === "es" || base === "en") return base;
  }
  return "es";
}

function readInitial(): Locale {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(LOCALE_KEY);
  } catch {
    // modo privado o almacenamiento bloqueado: se usa el idioma del navegador
  }
  const languages =
    typeof navigator === "undefined" ? [] : (navigator.languages ?? [navigator.language]);
  return detectLocale(stored, languages);
}

interface LocaleContextValue {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
  /** Etiqueta de una categoría (cae en el identificador si no está traducida). */
  categoryLabel: (category: string) => string;
}

const fallback: LocaleContextValue = {
  locale: "es",
  t: es,
  setLocale: () => {},
  categoryLabel: (c) => es.categories[c] ?? c,
};

const LocaleContext = createContext<LocaleContextValue>(fallback);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** Fuerza el idioma inicial (pruebas); por defecto se detecta. */
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? readInitial());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // sin almacenamiento: el cambio vale solo para esta visita
    }
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const t = MESSAGES[locale];
    return { locale, t, setLocale, categoryLabel: (c) => t.categories[c] ?? c };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
