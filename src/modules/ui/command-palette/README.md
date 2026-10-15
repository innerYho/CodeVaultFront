# Command Palette

Paleta de búsqueda y acciones que se abre con `⌘K` / `Ctrl+K`, como la de GitHub, Linear o VS Code.

## Cuándo usarlo

Apps o sitios con muchas pantallas, comandos o documentos, donde navegar por menús es lento.

## Instalación

Copia la carpeta, `hooks/use-hotkey` y ejecuta `pnpm add motion`.

## Uso

```tsx
const items = [
  { id: "theme", title: "Cambiar tema", keywords: ["dark"], group: "Ajustes" },
  { id: "docs", title: "Documentación", description: "Guías y API", group: "Navegación" },
];

<CommandPalette items={items} onSelect={(item) => run(item.id)} />
```

Es no controlada por defecto (se abre con el atajo). Para abrirla desde un botón, pásale `open` y `onOpenChange`.

## API

La tabla de props se genera automáticamente desde los tipos (`pnpm api`). Además se exportan `searchItems(items, query)` y `normalize(text)`, útiles por separado.

### Cómo se ordena

Todas las palabras de la consulta deben coincidir. Puntúan, de más a menos: inicio de palabra del título, texto dentro del título, palabras clave, grupo y descripción. Escribir el nombre de un grupo ("guides") filtra ese grupo.

## Decisiones de diseño

- **`<dialog>` nativo con `showModal()`:** aporta de serie el atrapado de foco, `Escape`, el fondo inerte y la capa superior, que antes se resolvían a mano con `z-index` y listeners.
- **Búsqueda propia de ~40 líneas, no una librería de fuzzy-match:** sin tildes ni mayúsculas, con pesos por campo. Para catálogos de miles de elementos conviene sustituirla por una librería (p. ej. `fuse.js` o `minisearch`).
- **Se monta el panel solo al abrir:** la búsqueda y la selección empiezan limpias en cada apertura, sin efectos para reiniciarlas.
- **Genérica:** no conoce rutas ni módulos; recibe `items` y devuelve el elegido en `onSelect`.
- **Sin animación de salida:** el `<dialog>` se cierra al instante. Animar la salida exige mantenerlo abierto mientras dura la transición y complica el foco; no compensa en un diálogo tan breve.

## Accesibilidad

Patrón ARIA *combobox con listbox*: el foco permanece en el campo y `aria-activedescendant` indica la opción activa. Flechas con vuelta circular, `Enter` selecciona, `Escape` cierra. El número de resultados se anuncia con `role="status"`. Respeta `prefers-reduced-motion`. El atajo es un añadido: ofrece también un botón visible.

## Pruebas

`command-palette.test.tsx`: tildes, palabras clave y grupo, ordenación, apertura por atajo, teclado, texto vacío y reinicio al reabrir.
