// Genera api.json por módulo leyendo los tipos exportados desde index.ts.
// Usa la API de compilador de TypeScript 5.9 (alias "typescript-api"): TS 7 no expone createProgram.
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript-api";

const ROOT = join(import.meta.dirname, "..");
const MODULES = join(ROOT, "src/modules");

export interface ApiProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}
export interface ApiType {
  name: string;
  props: ApiProp[];
}

const dirs = (p: string) => readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory());
const entries: string[] = [];
for (const cat of dirs(MODULES)) {
  for (const mod of dirs(join(MODULES, cat.name))) {
    const idx = join(MODULES, cat.name, mod.name, "index.ts");
    if (existsSync(idx)) entries.push(idx);
  }
}

const config = ts.getParsedCommandLineOfConfigFile(
  join(ROOT, "tsconfig.json"),
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    },
  },
);
if (!config) throw new Error("No se pudo leer tsconfig.json");
const program = ts.createProgram(entries, { ...config.options, noEmit: true });
const checker = program.getTypeChecker();

for (const entry of entries) {
  const moduleDir = entry.slice(0, entry.lastIndexOf("/"));
  const source = program.getSourceFile(entry);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!moduleSymbol) continue;

  const types: ApiType[] = [];
  for (const exp of checker.getExportsOfModule(moduleSymbol)) {
    const symbol = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
    // Solo tipos (interfaces / alias), no valores como componentes o hooks.
    if (!(symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) continue;
    if (symbol.flags & ts.SymbolFlags.Value) continue;

    const type = checker.getDeclaredTypeOfSymbol(symbol);
    const props: ApiProp[] = [];
    for (const prop of checker.getPropertiesOfType(type)) {
      const decl = prop.declarations?.[0];
      // Ignora propiedades heredadas de librerías (p. ej. las de <button>).
      if (!decl?.getSourceFile().fileName.startsWith(moduleDir)) continue;
      const tags = prop.getJsDocTags(checker);
      const def = tags
        .find((t) => t.name === "default")
        ?.text?.map((p) => p.text)
        .join("");
      props.push({
        name: prop.name,
        type: checker
          .typeToString(
            checker.getTypeOfSymbolAtLocation(prop, decl),
            decl,
            ts.TypeFormatFlags.NoTruncation,
          )
          .replace(/ \| undefined$/, ""),
        required: !(prop.flags & ts.SymbolFlags.Optional),
        ...(def ? { default: def } : {}),
        description: ts.displayPartsToString(prop.getDocumentationComment(checker)),
      });
    }
    if (props.length) types.push({ name: exp.name, props });
  }
  types.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(join(moduleDir, "api.json"), `${JSON.stringify(types, null, 2)}\n`);
  console.log(
    `✓ ${moduleDir.slice(ROOT.length + 1)}: ${types.map((t) => t.name).join(", ") || "sin tipos"}`,
  );
}
