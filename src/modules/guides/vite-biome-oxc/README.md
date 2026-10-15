# Vite, Biome y oxc

## Qué es

Tres herramientas que se suelen comparar y que en realidad resuelven problemas distintos:

| Capa | Herramienta | Qué hace |
|---|---|---|
| Servidor de desarrollo y bundler | **Vite** | HMR, empaquetado de producción, plugins. |
| Lint y formato | **Biome** | Un binario que sustituye a ESLint y Prettier. |
| Transpilado y parser | **oxc** (y SWC, esbuild) | Convierte TS/JSX a JS; es la base de Rolldown, el bundler de Vite en versiones recientes. |

`oxlint` y `oxfmt` son el lint y formateador de oxc, alternativa a Biome.

## Cuándo usarla

- **Vite** para cualquier app web: es el estándar con más ecosistema (MDX, Tailwind, PWA).
- **Biome** si quieres una sola configuración y velocidad para lint y formato.
- No hace falta elegir esbuild, SWC u oxc a mano: Vite ya los usa por dentro.

## Cuándo no usarla

- Biome no cubre todas las reglas de plugins de ESLint (p. ej. reglas muy específicas de un framework). Si dependes de ellas, mantén ESLint.
- Bun como bundler es válido, pero tiene menos plugins y menos madurez en HMR que Vite.

## Ejemplo

```json
{
  "scripts": {
    "dev": "vite",
    "lint": "biome check .",
    "format": "biome check --write ."
  }
}
```

La elección y sus motivos están en `docs/DECISIONES.md`.

## Alternativas

| Opción | Cuándo preferirla |
|---|---|
| Rsbuild / Rspack | Proyectos que migran desde webpack. |
| ESLint + Prettier | Plugins que Biome aún no soporta. |
| Bun | Runtime y gestor de paquetes todo en uno. |

## Referencias

- https://vite.dev
- https://biomejs.dev
- https://oxc.rs
