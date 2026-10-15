import { Suspense, useEffect, useState } from "react";
import Markdown, { type Components } from "react-markdown";
import { useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { ApiTable } from "./ApiTable";
import { CodeBlock } from "./CodeBlock";
import { modules } from "./registry";

type Tab = "demo" | "docs" | "code";

const mdComponents: Components = {
  // Bloques ``` con lenguaje → CodeBlock; `código` en línea se queda como está.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const lang = /language-(\w+)/.exec(className ?? "")?.[1];
    return lang ? (
      <CodeBlock code={String(children).replace(/\n$/, "")} lang={lang} />
    ) : (
      <code>{children}</code>
    );
  },
};

export function ModulePage() {
  const { category, name } = useParams();
  const mod = modules.find((m) => m.category === category && m.name === name);
  const isGuide = mod?.kind === "guide";
  const [tab, setTab] = useState<Tab>("demo");
  const [files, setFiles] = useState<{ path: string; code: string }[]>([]);

  useEffect(() => {
    setTab(mod?.kind === "guide" ? "docs" : "demo");
    setFiles([]);
    mod?.loadFiles().then(setFiles);
  }, [mod]);

  if (!mod) return <p>Módulo no encontrado.</p>;
  const { Demo } = mod;

  return (
    <article>
      <h1 className="text-3xl font-bold">{mod.title}</h1>
      <p className="mt-1 text-zinc-500">{mod.description}</p>
      <p className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{mod.status}</span>
        {mod.dependencies.map((d) => (
          <span key={d} className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
            {d}
          </span>
        ))}
      </p>

      <div role="tablist" className="mt-6 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {(isGuide ? (["docs"] as const) : (["demo", "docs", "code"] as const)).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm capitalize ${tab === t ? "border-indigo-600 font-medium" : "border-transparent text-zinc-500"}`}
          >
            {t === "code" ? "Código" : t === "docs" ? "Documentación" : "Demo"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "demo" &&
          (Demo ? (
            <Suspense fallback={<p>Cargando…</p>}>
              <Demo />
            </Suspense>
          ) : (
            <p className="text-zinc-500">Este módulo no tiene demo.</p>
          ))}
        {tab === "docs" && (
          <div className="prose prose-zinc max-w-none dark:prose-invert">
            <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {mod.readme}
            </Markdown>
            <ApiTable types={mod.api} />
          </div>
        )}
        {tab === "code" &&
          files.map((f) => (
            <section key={f.path}>
              <p className="mt-6 font-mono text-xs text-zinc-500">{f.path}</p>
              <CodeBlock code={f.code} lang={f.path.endsWith("json") ? "json" : "tsx"} />
            </section>
          ))}
      </div>
    </article>
  );
}
