# Transición de imágenes

Galería que pasa de una imagen a otra con efectos por capas: la imagen que entra se revela encima de la saliente.

## Cuándo usarlo

Portadas, galerías y secciones destacadas donde el cambio entre imágenes es parte de la experiencia. Para listados de contenido (productos, noticias) usa un carrusel convencional: los efectos sobran.

## Instalación

Copia la carpeta y ejecuta `pnpm add motion`. Las fotos de la demo son solo de ejemplo y no son necesarias.

## Uso

```tsx
const images = [
  { src: "/fiordo.webp", alt: "Fiordo azul visto desde un acantilado" },
  { src: "/colinas.webp", alt: "Colinas verdes con niebla" },
];

<ImageTransition images={images} effect="circle" interval={6000} />
<ImageTransition images={images} effect="random" className="aspect-square rounded-full" />
```

Es no controlada por defecto. Con `index` y `onIndexChange` la controlas desde fuera (p. ej. para sincronizarla con un texto).

### Efectos

| Efecto | Qué hace |
|---|---|
| `fade` | Fundido cruzado. |
| `wipe` | Cortina horizontal; cambia de sentido al retroceder. |
| `circle` | Círculo que se expande desde el centro. |
| `zoom` | Entra desenfocada y ampliada, y se enfoca. |
| `blinds` | Ocho persianas verticales con retardo escalonado. |
| `slide` | La nueva entra deslizando; la anterior retrocede y se oscurece (profundidad). |
| `random` | Recorre todos en orden. |

En `wipe`, `circle` y `zoom` la imagen entrante lleva además un contra-zoom que la asienta mientras se revela: es lo que da sensación de profundidad.

## API

La tabla de props se genera automáticamente desde los tipos (`pnpm api`).

## Decisiones de diseño

- **Capas, no una imagen que cambia de `src`:** la saliente permanece debajo mientras la entrante se revela encima. No hay fotograma vacío ni parpadeo.
- **`clip-path` y `transform`/`opacity`/`filter`:** se componen en la GPU y no recalculan el diseño. Nunca se animan tamaños ni posiciones con `top`/`left`.
- **Raíz de capa estable:** el zoom lento (Ken Burns) vive en el elemento raíz de cada capa, que no cambia cuando la capa pasa de entrar a quedar debajo. Si cambiara, React la desmontaría y el zoom daría un salto.
- **Estado derivado en el render:** al cambiar el índice se calcula la transición durante el render (patrón permitido por React) en vez de en un efecto, para no mostrar un fotograma intermedio con la imagen nueva sin animar.
- **Precarga de todas las imágenes** al montar, para que ninguna transición revele un hueco mientras descarga.
- **Reproducción automática responsable:** se pausa al pasar el ratón o poner el foco dentro, con la pestaña oculta y con el botón de pausa. Con `prefers-reduced-motion` no se reproduce sola.
- **Sin dependencias de imagen:** funciona con cualquier URL; el recorte con `object-cover` adapta cualquier proporción.
- **Limitación:** si cambias de imagen en mitad de una transición, la capa saliente anterior desaparece de golpe. Es un compromiso a cambio de no acumular capas.

## Accesibilidad

Sigue el patrón de carrusel de WAI-ARIA: región con `aria-roledescription="carrusel"`, cada diapositiva como grupo con etiqueta "2 de 5: descripción" y botones con nombre. La reproducción automática se puede pausar (WCAG 2.2.2), se detiene al interactuar y no se activa con movimiento reducido, donde además todo efecto pasa a un fundido corto. Las flechas ← → del teclado navegan. Escribe siempre un `alt` descriptivo en cada imagen.

## Pruebas

`image-transition.test.tsx`: navegación, puntos, teclado, capas durante el cambio, modo controlado, reproducción automática con reloj simulado, pausa por ratón y por botón, y lógica de los efectos. El resultado visual de cada efecto se comprueba en la demo.
