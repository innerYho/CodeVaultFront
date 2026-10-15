import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { RegistryIndexEntry, RegistryModule } from "../scripts/registry-lib.ts";

export interface RegistrySource {
  index(): Promise<RegistryIndexEntry[]>;
  module(id: string): Promise<RegistryModule>;
}

/** Registro remoto (https) o local (carpeta generada por `pnpm registry`). */
export function createSource(registry: string): RegistrySource {
  const remote = /^https?:\/\//.test(registry);
  const read = async (rel: string): Promise<unknown> => {
    if (!remote) return JSON.parse(readFileSync(join(registry, rel), "utf8"));
    const res = await fetch(`${registry.replace(/\/$/, "")}/${rel}`);
    if (!res.ok) throw new Error(`No se pudo leer ${rel} (HTTP ${res.status})`);
    return res.json();
  };
  return {
    index: async () => (await read("index.json")) as RegistryIndexEntry[],
    module: async (id) => (await read(`${id}.json`)) as RegistryModule,
  };
}

/**
 * Une `base` y `rel` garantizando que el resultado queda dentro de `base`.
 * El contenido del registro no es de confianza: una ruta `../../x` no debe poder escribir fuera.
 */
export function safeJoin(base: string, rel: string): string {
  if (isAbsolute(rel) || rel.includes("\0"))
    throw new Error(`Ruta no permitida en el registro: ${rel}`);
  const root = resolve(base);
  const target = resolve(root, rel);
  if (target !== root && !target.startsWith(root + sep))
    throw new Error(`Ruta fuera de la carpeta de instalación: ${rel}`);
  return target;
}

/** Orden de instalación: dependencias internas primero, sin duplicados y tolerando ciclos. */
export async function resolvePlan(
  source: RegistrySource,
  ids: string[],
): Promise<RegistryModule[]> {
  const known = new Set((await source.index()).map((e) => e.id));
  const done = new Map<string, RegistryModule>();
  const visiting = new Set<string>();

  async function visit(id: string, from?: string) {
    if (done.has(id) || visiting.has(id)) return;
    if (!known.has(id)) {
      const hint = [...known].filter((k) => k.includes(id.split("/").pop() ?? id)).slice(0, 3);
      throw new Error(
        `Módulo desconocido: "${id}"${from ? ` (lo requiere ${from})` : ""}.${hint.length ? ` ¿Quisiste decir: ${hint.join(", ")}?` : ""}`,
      );
    }
    visiting.add(id);
    const mod = await source.module(id);
    for (const dep of mod.requires) await visit(dep, id);
    visiting.delete(id);
    done.set(id, mod);
  }

  for (const id of ids) await visit(id);
  return [...done.values()];
}

export interface InstallOptions {
  dir: string;
  demo?: boolean;
  force?: boolean;
}

export interface InstallResult {
  written: string[];
  skipped: string[];
  npm: string[];
}

export function install(
  plan: RegistryModule[],
  { dir, demo = false, force = false }: InstallOptions,
): InstallResult {
  const written: string[] = [];
  const skipped: string[] = [];
  const npm = new Set<string>();

  // Primero se valida todo: no se deja una instalación a medias por una ruta inválida.
  const targets = plan.flatMap((mod) =>
    mod.files
      .filter((f) => demo || !f.demo)
      .map((f) => ({ mod, file: f, abs: safeJoin(dir, f.path) })),
  );

  for (const { mod, file, abs } of targets) {
    for (const n of mod.npm) npm.add(n);
    if (existsSync(abs) && !force) {
      skipped.push(relative(process.cwd(), abs));
      continue;
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.content);
    written.push(relative(process.cwd(), abs));
  }
  return { written, skipped, npm: [...npm].sort() };
}

/** Gestor de paquetes según el lockfile del proyecto. */
export function detectPackageManager(cwd: string): "pnpm" | "yarn" | "bun" | "npm" {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return "bun";
  return "npm";
}

export function installCommand(
  pm: ReturnType<typeof detectPackageManager>,
  pkgs: string[],
): string {
  return `${pm} ${pm === "npm" ? "install" : "add"} ${pkgs.join(" ")}`;
}
