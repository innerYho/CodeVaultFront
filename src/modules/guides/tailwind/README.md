# Tailwind CSS 4

## Qué es

Un framework de CSS **utilitario**: compones el estilo con clases pequeñas (`px-4`, `rounded-lg`, `dark:bg-zinc-900`) directamente en el marcado. La versión 4 se configura en el propio CSS (`@import "tailwindcss"`, `@theme`, `@custom-variant`) y se integra con Vite mediante `@tailwindcss/vite`.

## Cuándo usarla

- Interfaces donde quieres consistencia (escala de espaciados, colores y tamaños) sin escribir hojas de estilo a mano.
- Modo oscuro y estados (`hover:`, `focus-visible:`, `md:`) en la misma línea del elemento.

## Cuándo no usarla

- Cuando el equipo exige CSS semántico separado del marcado.
- Si ya tienes un sistema de diseño completo con CSS Modules o CSS-in-JS y migrar no compensa.

## Ejemplo

El modo oscuro por clase (en vez del ajuste del sistema operativo) se declara una vez:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

Después `dark:bg-zinc-900` responde a la clase `dark` de `<html>`, que controla el módulo `ui/theme-toggle`.

## Alternativas

| Opción | Cuándo preferirla |
|---|---|
| CSS Modules | CSS tradicional con alcance local. |
| UnoCSS | Mismo enfoque utilitario con reglas personalizables. |
| Panda CSS | Estilos tipados en TypeScript. |

## Referencias

- https://tailwindcss.com
