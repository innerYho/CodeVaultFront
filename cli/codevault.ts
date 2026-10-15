#!/usr/bin/env -S node --experimental-strip-types
// CLI de CodeVault: lista e instala módulos copiándolos a tu proyecto (sin dependencias).
import { createSource, detectPackageManager, install, installCommand, resolvePlan } from "./lib.ts";

const DEFAULT_REGISTRY = "https://inneryho.github.io/CodeVaultFront/r";

const HELP = `codevault — módulos reutilizables que se copian a tu proyecto

Uso:
  codevault list [--registry <url|carpeta>]
  codevault add <categoria/nombre>... [opciones]

Opciones de add:
  --dir <carpeta>        Dónde copiar (por defecto: src/codevault)
  --registry <url|ruta>  Registro (por defecto: $CODEVAULT_REGISTRY o el público)
  --demo                 Incluye también la demo y sus archivos de apoyo
  --force                Sobrescribe archivos existentes

Ejemplos:
  codevault list
  codevault add ui/theme-toggle
  codevault add ui/command-palette --dir src/components/codevault
`;

function parseArgs(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const takesValue = ["dir", "registry"].includes(key);
      flags[key] = takesValue ? (argv[++i] ?? "") : true;
    } else positional.push(a);
  }
  return { flags, positional };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { flags, positional } = parseArgs(rest);
  const registry = (flags.registry as string) || process.env.CODEVAULT_REGISTRY || DEFAULT_REGISTRY;

  if (!command || command === "help" || flags.help) return console.log(HELP);
  const source = createSource(registry);

  if (command === "list") {
    const index = await source.index();
    const width = Math.max(...index.map((e) => e.id.length));
    for (const e of index)
      console.log(`${e.id.padEnd(width)}  ${e.status.padEnd(8)}  ${e.description}`);
    return;
  }

  if (command === "add") {
    if (!positional.length)
      throw new Error("Indica al menos un módulo. Ejemplo: codevault add ui/theme-toggle");
    const plan = await resolvePlan(source, positional);
    const dir = (flags.dir as string) || "src/codevault";
    const result = install(plan, { dir, demo: !!flags.demo, force: !!flags.force });

    const extra = plan.map((m) => m.id).filter((id) => !positional.includes(id));
    console.log(`✓ ${result.written.length} archivo(s) copiado(s) a ${dir}`);
    if (extra.length)
      console.log(`  También se añadieron sus dependencias internas: ${extra.join(", ")}`);
    if (result.skipped.length)
      console.log(
        `! ${result.skipped.length} archivo(s) ya existían y no se tocaron (usa --force para sobrescribir).`,
      );
    if (result.npm.length)
      console.log(
        `\nInstala los paquetes necesarios:\n  ${installCommand(detectPackageManager(process.cwd()), result.npm)}`,
      );
    console.log(
      "\nLos módulos se importan entre sí con rutas relativas: conserva la estructura de carpetas.",
    );
    return;
  }

  throw new Error(`Comando desconocido: "${command}". Prueba: codevault help`);
}

main().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
