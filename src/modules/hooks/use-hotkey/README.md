# useHotkey

Hook para registrar atajos de teclado globales (`mod+k`, `/`, `alt+shift+n`) y utilidades para mostrarlos.

## Cuándo usarlo

Paletas de comandos, búsqueda rápida, acciones frecuentes y navegación por teclado.

## Instalación

Copia la carpeta; solo requiere React.

## Uso

```tsx
useHotkey("mod+k", () => setOpen(true));
useHotkey("/", focusSearch);                     // no dispara al escribir en un campo
useHotkey("mod+s", save, { allowInInputs: true });

<kbd>{formatHotkey("mod+k")}</kbd>               // ⌘K en macOS, Ctrl+K en el resto
```

## API

La tabla de opciones se genera automáticamente desde los tipos (`pnpm api`). Funciones: `useHotkey(combo, handler, options?)`, `parseHotkey`, `matchesHotkey`, `formatHotkey`, `isMacPlatform`.

Modificadores: `mod` (Cmd/Ctrl según el sistema), `shift`, `alt`. La tecla es la última parte del atajo.

## Decisiones de diseño

Frente a los `addEventListener("keydown")` sueltos de Hydra y Heimdall:

- **`mod` en lugar de Ctrl fijo:** el mismo atajo funciona como ⌘ en Mac y Ctrl en Windows/Linux, y se muestra con el símbolo correcto.
- **Coincidencia exacta de modificadores:** `mod+k` no se dispara con `Ctrl+Shift+K`, que suele tener otro significado en el navegador.
- **Una sola tecla no interfiere al escribir:** `/` o `?` se ignoran dentro de `input`, `textarea` y campos editables, salvo que lo pidas.
- **Ignora la composición de texto (IME):** no dispara mientras alguien escribe con un método de entrada japonés, chino, etc.
- **Handler siempre actualizado sin re-suscribir:** se guarda en una referencia, así que pasar una función nueva en cada render no registra y quita listeners continuamente.
- **Limpieza al desmontar** y opción `enabled` para activarlo solo cuando corresponde.

## Accesibilidad

Un atajo nunca debe ser la única vía de acceso: ofrece también un botón visible. No uses atajos de una tecla sin poder desactivarlos (WCAG 2.1.4). Muestra el atajo al usuario con `formatHotkey`.

## Pruebas

`use-hotkey.test.tsx`: `mod` por plataforma, modificadores exactos, formato, campos de texto, `enabled` y desmontaje.
