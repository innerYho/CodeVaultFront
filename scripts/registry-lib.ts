// Construye el registro estático: un JSON por módulo con sus archivos dentro, más un índice.
// Lo consume la CLI (`cli/codevault.ts`) y se publica junto al sitio en /r/.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

export interface ModuleMeta {
  name: string;
  title: string;
  category: string;
  description: string;
  status: string;
  kind?: "module" | "guide";
  dependencies: string[];
  /** Archivos que solo sirven a la demo (se instalan con --demo). */
  demoFiles?: string[];
}

export interface RegistryFile {
  /** Ruta relativa a la carpeta de instalación: `ui/otp-input/OtpInput.tsx`. */
  path: string;
  content: string;
  demo?: boolean;
}

export interface RegistryModule {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  /** Paquetes npm a instalar. */
  npm: string[];
  /** Otros módulos del registro que este necesita. */
  requires: string[];
  files: RegistryFile[];
}

export interface RegistryIndexEntry {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  npm: string[];
  requires: string[];
}

const MODULE_ID = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/** Separa las dependencias declaradas en npm, módulos internos y módulos nativos de Node. */
export function classifyDependencies(deps: string[], moduleIds: Set<string>) {
  const npm: string[] = [];
  const internal: string[] = [];
  for (const d of deps) {
    if (d.startsWith("node:")) continue;
    if (MODULE_ID.test(d) && moduleIds.has(d)) internal.push(d);
    else npm.push(d);
  }
  return { npm, internal };
}

/** Archivos que no se distribuyen: pruebas y la demo (esta última solo con --demo). */
const isTest = (name: string) => /\.test\.tsx?$/.test(name);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

export function buildRegistry(modulesDir: string, outDir: string) {
  const metas: { dir: string; meta: ModuleMeta }[] = [];
  for (const cat of readdirSync(modulesDir, { withFileTypes: true }).filter((d) =>
    d.isDirectory(),
  )) {
    for (const mod of readdirSync(join(modulesDir, cat.name), { withFileTypes: true }).filter((d) =>
      d.isDirectory(),
    )) {
      const dir = join(modulesDir, cat.name, mod.name);
      if (!existsSync(join(dir, "meta.json"))) continue;
      const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")) as ModuleMeta;
      if (meta.kind !== "guide") metas.push({ dir, meta });
    }
  }

  const ids = new Set(metas.map((m) => `${m.meta.category}/${m.meta.name}`));
  const index: RegistryIndexEntry[] = [];

  for (const { dir, meta } of metas) {
    const id = `${meta.category}/${meta.name}`;
    const { npm, internal } = classifyDependencies(meta.dependencies, ids);
    const demoFiles = new Set(["demo.tsx", ...(meta.demoFiles ?? [])]);
    const files: RegistryFile[] = walk(dir)
      .filter((f) => !isTest(f))
      .map((f) => {
        const rel = relative(dir, f).split("\\").join("/");
        return {
          path: `${id}/${rel}`,
          content: readFileSync(f, "utf8"),
          ...(demoFiles.has(rel) ? { demo: true } : {}),
        };
      })
      .sort((a, b) => a.path.localeCompare(b.path));

    const mod: RegistryModule = {
      id,
      title: meta.title,
      description: meta.description,
      status: meta.status,
      category: meta.category,
      npm,
      requires: internal,
      files,
    };
    mkdirSync(join(outDir, meta.category), { recursive: true });
    writeFileSync(join(outDir, `${id}.json`), `${JSON.stringify(mod, null, 2)}\n`);
    index.push({
      id,
      title: meta.title,
      description: meta.description,
      status: meta.status,
      category: meta.category,
      npm,
      requires: internal,
    });
  }

  index.sort((a, b) => a.id.localeCompare(b.id));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
  return index;
}
