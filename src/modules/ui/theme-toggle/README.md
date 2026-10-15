# Theme Toggle

Botón día/noche con modo `system`, persistencia, sin destello inicial y transición circular.

## Cuándo usarlo

Cualquier app con Tailwind (variante `dark:`) que necesite tema claro/oscuro controlado por el usuario.

## Instalación

Copia esta carpeta a tu proyecto y haz tres cosas:

1. Instala dependencias: `pnpm add motion`.
2. En tu CSS (Tailwind 4) declara la variante por clase:
   ```css
   @custom-variant dark (&:where(.dark, .dark *));
   ```
3. Pega en el `<head>` de `index.html` el script anti-destello (ver `index.html` de este repo). Su clave de `localStorage` debe coincidir con `STORAGE_KEY`.

Para la transición circular añade a tu CSS:

```css
::view-transition-old(root),
::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
```

## Uso

```tsx
import { ThemeToggle, useTheme } from "./theme-toggle";

<ThemeToggle />
const { mode, resolved, setMode } = useTheme();
```

## API

La tabla de props se genera automáticamente desde los tipos (`pnpm api`). Exports: `ThemeToggle` (botón accesible), `useTheme()` (`{ mode, resolved, setMode, toggle }`, sin Provider) y `themeStore` (store externo).

## Decisiones de diseño

Frente a la versión original de Hydra:

- **Store externo + `useSyncExternalStore`** en lugar de `Context`. No hay Provider que olvidar ni re-render de todo el árbol.
- **Aplica la clase `dark` de forma síncrona**, no en un `useEffect`. Es requisito de View Transitions y evita un frame con el tema equivocado.
- **Script anti-destello** en el `<head>`: la versión original leía `localStorage` en un efecto y mostraba un parpadeo claro al cargar.
- **Tres modos** (`light`/`dark`/`system`); el original solo tenía booleano y copiaba la preferencia del SO una sola vez.
- **`localStorage` protegido** con `try/catch` (modo privado, iframes).
- **Accesibilidad:** `aria-label`, `aria-pressed`, foco visible y `prefers-reduced-motion` respetado, en vez de emojis sin etiqueta.
- **Iconos SVG inline**, sin depender de `react-icons`.

## Accesibilidad

Botón nativo, operable con teclado, etiqueta dinámica y animaciones reducidas si el usuario lo pide.

## Pruebas

`theme-store.test.ts` cubre aplicación de clase y persistencia. Ejecuta `pnpm test`.
