# Motion (Framer Motion)

## Qué es

La librería de animación más usada en React. Framer Motion pasó a llamarse **Motion**; se importa desde `motion/react`. Describes el estado inicial, el final y la transición, y ella se encarga de interpolar. Incluye resortes, gestos (`whileHover`, `whileTap`), animaciones de entrada/salida (`AnimatePresence`) y de layout.

## Cuándo usarla

- Entradas y salidas de elementos (modales, paneles, badges): CSS puro no puede animar un elemento que se desmonta.
- Movimientos con física (resortes) que se sienten naturales.
- Reordenar o redimensionar con `layout`.

## Cuándo no usarla

- Transiciones simples de color o de opacidad: una transición CSS pesa menos.
- Animaciones de scroll complejas y continuas: valora Lenis o la API nativa `animation-timeline`.
- Respeta siempre `prefers-reduced-motion` (`useReducedMotion`); es parte de la accesibilidad.

## Ejemplo

```tsx
import { AnimatePresence, motion } from "motion/react";

<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    />
  )}
</AnimatePresence>
```

Usado en los módulos `ui/theme-toggle` y `ui/floating-action-button`.

## Alternativas

| Opción | Cuándo preferirla |
|---|---|
| CSS transitions | Cambios simples de estado. |
| React Spring | Física pura con otro modelo de API. |
| GSAP | Líneas de tiempo complejas y control fino. |
| auto-animate | Animar listas con una sola línea. |

## Referencias

- https://motion.dev
