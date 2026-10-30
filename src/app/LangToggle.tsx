import { useLocale } from "./i18n";

/** Cambia entre español e inglés. Muestra el código del idioma al que se cambia. */
export function LangToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <button
      type="button"
      lang={locale === "es" ? "en" : "es"}
      aria-label={t.lang.switchTo}
      onClick={() => setLocale(locale === "es" ? "en" : "es")}
      className="grid size-10 place-items-center rounded-full border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      {t.lang.code}
    </button>
  );
}
