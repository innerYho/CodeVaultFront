# Convenciones

## Estructura de un módulo

```
src/modules/<categoria>/<nombre>/
  README.md        documentación (secciones obligatorias)
  meta.json        metadatos para el índice y la web
  index.ts         API pública
  <Componente>.tsx implementación
  demo.tsx         demo (export default)
  *.test.ts(x)     pruebas
```

- Carpetas y archivos de datos en `kebab-case`; componentes en `PascalCase.tsx`; hooks `useX.ts`.
- Categorías actuales: `auth`, `hooks`, `lib`, `notify`, `ui` (más `guides` y `ia` para guías). Al añadir una categoría, ponle etiqueta en `src/app/i18n.tsx` (`categories`); sin ella se muestra el identificador.

## Secciones obligatorias del README

`Cuándo usarlo`, `Instalación`, `Uso`, `API`, `Decisiones de diseño`, `Accesibilidad`.

## meta.json

`name` (= carpeta), `title`, `category` (= carpeta padre), `description`, `status` (`stable|beta|experimental`), `source` (opcional), `dependencies`, `tags`.

## Crear un módulo nuevo

1. Copia `docs/PLANTILLA_MODULO/` a `src/modules/<categoria>/<nombre>/`.
2. Rellena meta.json y README.
3. `pnpm validate && pnpm lint && pnpm test`.
4. `pnpm index` para regenerar `INDEX.md`.

## Guías de librerías (`kind: "guide"`)

Para explicar una librería sin implementarla. Carpeta `src/modules/guides/<nombre>/` con solo `README.md` y `meta.json` (`"category": "guides"`, `"kind": "guide"`). El README lleva estas secciones: `Qué es`, `Cuándo usarla`, `Cuándo no usarla`, `Ejemplo`, `Alternativas`, `Referencias`. Si el proyecto usa la librería, el ejemplo apunta al módulo real.
