import type { TransitionImage } from "./ImageTransition";

// BASE_URL: el sitio puede publicarse en una subruta (GitHub Pages).
const base = `${import.meta.env.BASE_URL}demo/landscapes`;

/** Fotos de demostración (Unsplash, licencia gratuita). Autores y enlaces en `public/demo/CREDITS.md`. */
export const landscapes: TransitionImage[] = [
  { src: `${base}/1015.webp`, alt: "Fiordo azul visto desde un acantilado de roca clara" },
  { src: `${base}/1018.webp`, alt: "Colinas verdes con niebla y una carretera sinuosa" },
  { src: `${base}/1039.webp`, alt: "Cascada entre un bosque de coníferas" },
  { src: `${base}/1036.webp`, alt: "Tienda amarilla en un paisaje nevado de montaña" },
  { src: `${base}/1050.webp`, alt: "Costa con acantilados y mar turquesa" },
];
