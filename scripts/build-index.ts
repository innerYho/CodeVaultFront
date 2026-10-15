// Valida la estructura de cada módulo y genera INDEX.md.
// Uso: pnpm index (genera) · pnpm validate (solo valida, falla en CI).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const MODULES = join(ROOT, "src/modules");
const REQUIRED_FILES = ["README.md", "meta.json", "index.ts", "demo.tsx"];
const REQUIRED_SECTIONS = [
  "## Cuándo usarlo",
  "## Instalación",
  "## Uso",
  "## API",
  "## Decisiones de diseño",
  "## Accesibilidad",
];
const GUIDE_SECTIONS = [
  "## Qué es",
  "## Cuándo usarla",
  "## Cuándo no usarla",
  "## Ejemplo",
  "## Alternativas",
  "## Referencias",
];
const STATUSES = ["stable", "beta", "experimental"];
const checkOnly = process.argv.includes("--check");

interface Meta {
  name: string;
  title: string;
  category: string;
  description: string;
  status: string;
  kind?: "module" | "guide";
  dependencies: string[];
}

const errors: string[] = [];
const rows: { category: string; meta: Meta }[] = [];
const dirs = (p: string) => readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory());

for (const cat of dirs(MODULES)) {
  for (const mod of dirs(join(MODULES, cat.name))) {
    const dir = join(MODULES, cat.name, mod.name);
    const id = `${cat.name}/${mod.name}`;
    if (!existsSync(join(dir, "meta.json"))) {
      errors.push(`${id}: falta meta.json`);
      continue;
    }
    const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")) as Meta;
    const isGuide = meta.kind === "guide";
    // Las guías explican una librería: solo necesitan README y meta (sin código ni demo).
    for (const f of isGuide ? ["README.md"] : REQUIRED_FILES) {
      if (!existsSync(join(dir, f))) errors.push(`${id}: falta ${f}`);
    }
    if (meta.name !== mod.name) errors.push(`${id}: meta.name ("${meta.name}") != carpeta`);
    if (meta.category !== cat.name) errors.push(`${id}: meta.category != carpeta`);
    if (!STATUSES.includes(meta.status)) errors.push(`${id}: status inválido`);
    if (!meta.description) errors.push(`${id}: description vacía`);
    if (existsSync(join(dir, "README.md"))) {
      const md = readFileSync(join(dir, "README.md"), "utf8");
      for (const s of isGuide ? GUIDE_SECTIONS : REQUIRED_SECTIONS)
        if (!md.includes(s)) errors.push(`${id}: README sin "${s}"`);
    }
    rows.push({ category: cat.name, meta });
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problema(s):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}

if (!checkOnly) {
  rows.sort(
    (a, b) => a.category.localeCompare(b.category) || a.meta.name.localeCompare(b.meta.name),
  );
  let md = "# Índice de módulos\n\n> Generado por `pnpm index`. No editar a mano.\n";
  for (const cat of [...new Set(rows.map((r) => r.category))]) {
    md += `\n## ${cat}\n\n| Módulo | Descripción | Estado | Dependencias |\n|---|---|---|---|\n`;
    for (const { meta } of rows.filter((r) => r.category === cat)) {
      md += `| [${meta.title}](src/modules/${cat}/${meta.name}/README.md) | ${meta.description} | ${meta.status} | ${meta.dependencies.join(", ")} |\n`;
    }
  }
  writeFileSync(join(ROOT, "INDEX.md"), md);
}
console.log(`✓ ${rows.length} módulo(s) válidos${checkOnly ? "" : " · INDEX.md generado"}`);
