import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildRegistry,
  classifyDependencies,
  type RegistryModule,
} from "../scripts/registry-lib.ts";
import {
  createSource,
  detectPackageManager,
  install,
  installCommand,
  resolvePlan,
  safeJoin,
} from "./lib.ts";

const ROOT = join(import.meta.dirname, "..");
let registryDir: string;
let index: ReturnType<typeof buildRegistry>;

beforeAll(() => {
  registryDir = mkdtempSync(join(tmpdir(), "cv-registry-"));
  index = buildRegistry(join(ROOT, "src/modules"), registryDir);
});

const tmp = (prefix: string) => mkdtempSync(join(tmpdir(), prefix));

describe("classifyDependencies", () => {
  const ids = new Set(["ui/otp-input", "hooks/use-hotkey"]);
  it("separa npm, módulos internos y nativos de Node", () => {
    expect(
      classifyDependencies(
        ["react", "motion", "ui/otp-input", "node:crypto", "@tailwindcss/vite"],
        ids,
      ),
    ).toEqual({
      npm: ["react", "motion", "@tailwindcss/vite"],
      internal: ["ui/otp-input"],
    });
  });
  it("algo con forma de ruta pero que no es un módulo se trata como paquete npm", () => {
    expect(classifyDependencies(["foo/bar"], ids)).toEqual({ npm: ["foo/bar"], internal: [] });
  });
});

describe("safeJoin", () => {
  it("permite rutas dentro de la carpeta", () => {
    expect(safeJoin("/tmp/x", "ui/a/b.ts")).toBe("/tmp/x/ui/a/b.ts");
  });
  it.each(["../fuera.ts", "ui/../../fuera.ts", "/etc/passwd", "a\0b"])("rechaza %j", (rel) => {
    expect(() => safeJoin("/tmp/x", rel)).toThrow();
  });
});

describe("registro generado", () => {
  it("excluye guías y pruebas, y marca la demo", () => {
    expect(index.some((e) => e.id.startsWith("guides/"))).toBe(false);
    const mod = JSON.parse(
      readFileSync(join(registryDir, "ui/otp-input.json"), "utf8"),
    ) as RegistryModule;
    expect(mod.files.some((f) => f.path.endsWith(".test.tsx"))).toBe(false);
    expect(mod.files.find((f) => f.path.endsWith("demo.tsx"))?.demo).toBe(true);
    expect(mod.files.some((f) => f.path === "ui/otp-input/README.md")).toBe(true);
  });

  it("los módulos son autosuficientes: cada import relativo apunta a un archivo distribuido y cada paquete está declarado", async () => {
    const source = createSource(registryDir);
    const problems: string[] = [];
    for (const entry of index) {
      const plan = await resolvePlan(source, [entry.id]);
      const files = new Map(
        plan.flatMap((m) =>
          m.files.filter((f) => !f.demo).map((f) => [f.path, f.content] as const),
        ),
      );
      const declared = new Set(plan.flatMap((m) => m.npm));
      const mod = plan.find((m) => m.id === entry.id) as RegistryModule;

      for (const file of mod.files.filter((f) => !f.demo && /\.tsx?$/.test(f.path))) {
        for (const m of file.content.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
          const spec = m[1] as string;
          if (spec.startsWith("node:")) continue;
          if (spec.startsWith(".")) {
            const base = join(dirname(file.path), spec).split("\\").join("/");
            const found = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].some((c) =>
              files.has(c),
            );
            if (!found)
              problems.push(`${entry.id}: ${file.path} importa ${spec}, que no se distribuye`);
          } else {
            const pkg = spec.startsWith("@")
              ? spec.split("/").slice(0, 2).join("/")
              : (spec.split("/")[0] as string);
            if (!declared.has(pkg))
              problems.push(
                `${entry.id}: ${file.path} importa "${pkg}" sin declararlo en dependencies`,
              );
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("resolvePlan", () => {
  it("instala primero las dependencias internas y sin duplicados", async () => {
    const plan = await resolvePlan(createSource(registryDir), [
      "ui/command-palette",
      "hooks/use-hotkey",
    ]);
    const ids = plan.map((m) => m.id);
    expect(ids.indexOf("hooks/use-hotkey")).toBeLessThan(ids.indexOf("ui/command-palette"));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("un módulo desconocido da un error con sugerencias", async () => {
    await expect(resolvePlan(createSource(registryDir), ["ui/otp"])).rejects.toThrow(
      /desconocido.*"ui\/otp"/,
    );
    await expect(resolvePlan(createSource(registryDir), ["ui/otp-inpt"])).rejects.toThrow(
      /Módulo desconocido/,
    );
  });
});

describe("install", () => {
  it("copia el módulo con sus dependencias internas y la estructura de carpetas", async () => {
    const dir = tmp("cv-app-");
    const plan = await resolvePlan(createSource(registryDir), ["ui/command-palette"]);
    const r = install(plan, { dir });
    expect(existsSync(join(dir, "ui/command-palette/CommandPalette.tsx"))).toBe(true);
    expect(existsSync(join(dir, "hooks/use-hotkey/use-hotkey.ts"))).toBe(true);
    expect(existsSync(join(dir, "ui/command-palette/demo.tsx"))).toBe(false);
    expect(existsSync(join(dir, "ui/command-palette/command-palette.test.tsx"))).toBe(false);
    expect(r.npm).toEqual(expect.arrayContaining(["react", "motion"]));
  });

  it("--demo incluye la demo y sus archivos de apoyo", async () => {
    const dir = tmp("cv-demo-");
    install(await resolvePlan(createSource(registryDir), ["ui/image-transition"]), {
      dir,
      demo: true,
    });
    expect(existsSync(join(dir, "ui/image-transition/demo.tsx"))).toBe(true);
    expect(existsSync(join(dir, "ui/image-transition/landscapes.ts"))).toBe(true);
  });

  it("no sobrescribe archivos existentes salvo con force", async () => {
    const dir = tmp("cv-force-");
    const plan = await resolvePlan(createSource(registryDir), ["hooks/use-hotkey"]);
    install(plan, { dir });
    const file = join(dir, "hooks/use-hotkey/index.ts");
    writeFileSync(file, "// mío");
    const second = install(plan, { dir });
    expect(second.skipped.length).toBeGreaterThan(0);
    expect(readFileSync(file, "utf8")).toBe("// mío");
    install(plan, { dir, force: true });
    expect(readFileSync(file, "utf8")).not.toBe("// mío");
  });

  it("un registro malicioso no puede escribir fuera de la carpeta, y no deja la instalación a medias", () => {
    const dir = tmp("cv-evil-");
    const evil: RegistryModule = {
      id: "ui/evil",
      title: "x",
      description: "x",
      status: "stable",
      category: "ui",
      npm: [],
      requires: [],
      files: [
        { path: "ui/evil/ok.ts", content: "ok" },
        { path: "../../escapado.ts", content: "pwned" },
      ],
    };
    expect(() => install([evil], { dir })).toThrow(/fuera de la carpeta/);
    expect(existsSync(join(dir, "ui/evil/ok.ts"))).toBe(false); // se valida todo antes de escribir
  });
});

describe("gestor de paquetes", () => {
  it("lo detecta por el lockfile y arma el comando", () => {
    const dir = tmp("cv-pm-");
    expect(detectPackageManager(dir)).toBe("npm");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "pnpm-lock.yaml"), "");
    expect(detectPackageManager(dir)).toBe("pnpm");
    expect(installCommand("pnpm", ["react", "motion"])).toBe("pnpm add react motion");
    expect(installCommand("npm", ["react"])).toBe("npm install react");
  });
});
