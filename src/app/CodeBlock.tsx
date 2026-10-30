import { useEffect, useState } from "react";
import { useLocale } from "./i18n";

type Highlighter = Awaited<ReturnType<typeof load>>;
let highlighterPromise: Promise<Highlighter> | null = null;

// Import de grano fino: solo los lenguajes y temas usados, con el motor JS (sin WASM).
async function load() {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
  ]);
  return createHighlighterCore({
    themes: [import("shiki/themes/github-light.mjs"), import("shiki/themes/github-dark.mjs")],
    langs: [
      import("shiki/langs/tsx.mjs"),
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/json.mjs"),
      import("shiki/langs/css.mjs"),
      import("shiki/langs/bash.mjs"),
      import("shiki/langs/markdown.mjs"),
    ],
    engine: createJavaScriptRegexEngine(),
  });
}

const ALIAS: Record<string, string> = {
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  md: "markdown",
};
const KNOWN = new Set(["tsx", "typescript", "json", "css", "bash", "markdown"]);

export function CodeBlock({ code, lang = "text" }: { code: string; lang?: string }) {
  const { t } = useLocale();
  const [html, setHtml] = useState<string | null>(null);
  const resolved = ALIAS[lang] ?? lang;

  useEffect(() => {
    if (!KNOWN.has(resolved)) return setHtml(null);
    let cancelled = false;
    highlighterPromise ??= load();
    highlighterPromise.then((h) => {
      if (cancelled) return;
      setHtml(
        h.codeToHtml(code, {
          lang: resolved,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false, // los colores salen como variables CSS (ver styles.css)
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [code, resolved]);

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(code)}
        className="absolute top-2 right-2 z-10 rounded bg-zinc-200/80 px-2 py-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 dark:bg-zinc-700/80"
      >
        {t.copy}
      </button>
      {html ? (
        <div
          className="shiki-wrap overflow-x-auto text-sm"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML generado y escapado por Shiki desde código fuente propio.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
