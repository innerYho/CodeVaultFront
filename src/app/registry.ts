import { type ComponentType, lazy } from "react";
import type { ApiType } from "../../scripts/build-api";

export interface ModuleMeta {
  name: string;
  title: string;
  category: string;
  description: string;
  kind?: "module" | "guide";
  status: "stable" | "beta" | "experimental";
  source?: string;
  dependencies: string[];
  tags: string[];
}

export interface RegisteredModule extends ModuleMeta {
  readme: string;
  api: ApiType[];
  Demo: ComponentType | null;
  /** Carga perezosa del código fuente (sin demo ni tests) para la pestaña "Código". */
  loadFiles: () => Promise<{ path: string; code: string }[]>;
}

const metas = import.meta.glob<ModuleMeta>("../modules/*/*/meta.json", {
  eager: true,
  import: "default",
});
const readmes = import.meta.glob<string>("../modules/*/*/README.md", {
  eager: true,
  query: "?raw",
  import: "default",
});
const apis = import.meta.glob<ApiType[]>("../modules/*/*/api.json", {
  eager: true,
  import: "default",
});
const demos = import.meta.glob<{ default: ComponentType }>("../modules/*/*/demo.tsx");
const sources = import.meta.glob<string>(
  ["../modules/*/*/*.{ts,tsx}", "!../modules/*/*/demo.tsx", "!../modules/*/*/*.test.{ts,tsx}"],
  { query: "?raw", import: "default" },
);

const dirOf = (p: string) => p.slice(0, p.lastIndexOf("/"));

export const modules: RegisteredModule[] = Object.entries(metas)
  .map(([metaPath, meta]) => {
    const dir = dirOf(metaPath);
    const demo = demos[`${dir}/demo.tsx`];
    return {
      ...meta,
      readme: readmes[`${dir}/README.md`] ?? "",
      api: apis[`${dir}/api.json`] ?? [],
      Demo: demo ? lazy(demo) : null,
      loadFiles: async () =>
        Promise.all(
          Object.entries(sources)
            .filter(([p]) => dirOf(p) === dir)
            .map(async ([p, load]) => ({ path: p.slice(dir.length + 1), code: await load() })),
        ),
    };
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

export const categories = [...new Set(modules.map((m) => m.category))];
