# CodeVaultFront

Biblioteca y documentación de módulos de frontend reutilizables, pensada como la documentación de un framework y como portafolio. Cada módulo se copia a otro proyecto (estilo shadcn) y trae su propia documentación al lado.

**Stack:** React 19 · TypeScript · Vite · Tailwind 4 · Motion · Biome · Vitest · pnpm.

## Empezar

```bash
pnpm install
pnpm dev        # sitio de documentación con demos
pnpm validate   # valida estructura de módulos
pnpm index      # regenera INDEX.md
pnpm lint && pnpm typecheck && pnpm test
```

## Instalar un módulo en tu proyecto

Cada módulo se copia a tu código (como shadcn): es tuyo, sin dependencia de este repositorio.

```bash
npx tsx cli/codevault.ts list                         # o: pnpm codevault list
pnpm codevault add ui/command-palette --dir src/codevault
```

La CLI copia el módulo **con los módulos internos que necesita** (aquí también `hooks/use-hotkey`), conserva la estructura de carpetas y te dice qué paquetes instalar (`pnpm add motion react`). Sin `--force` no sobrescribe nada; con `--demo` añade también la demo.

El registro es un conjunto de JSON estáticos que se publican con el sitio (`/r/index.json`). Para usar uno local: `--registry ./public/r` (tras `pnpm registry`) o la variable `CODEVAULT_REGISTRY`.

## Calidad y despliegue

- **CI** (`.github/workflows/ci.yml`): validación de módulos, lint, tipos, pruebas (incluida accesibilidad con axe-core), comprobación de archivos generados y build.
- **Despliegue** (`.github/workflows/deploy.yml`): publica el sitio y el registro en GitHub Pages al subir a `main`. Activa *Settings → Pages → Source: GitHub Actions*.

## Contenido

- [`INDEX.md`](INDEX.md): índice generado de módulos.
- [`docs/POLITICAS.md`](docs/POLITICAS.md): reglas del proyecto.
- [`docs/CONVENCIONES.md`](docs/CONVENCIONES.md): estructura y plantilla de módulos.
- [`docs/DECISIONES.md`](docs/DECISIONES.md): registro de decisiones.
- [`docs/PENDIENTES.md`](docs/PENDIENTES.md): pendientes e ideas.

Proyecto hermano: [CodeVaultBack](https://github.com/innerYho/CodeVaultBack).
