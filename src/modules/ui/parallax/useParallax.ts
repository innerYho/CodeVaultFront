import {
  type MotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import type { RefObject } from "react";

export interface UseParallaxOptions {
  /** Suaviza el movimiento con un muelle (añade un poco de inercia).
   * @default false */
  smooth?: boolean;
}

/**
 * Desplazamiento en píxeles de un elemento según su posición en pantalla.
 * Va de `-distance` (el elemento entra por abajo) a `+distance` (sale por arriba).
 * Con `prefers-reduced-motion` devuelve siempre 0.
 */
export function useParallax(
  ref: RefObject<HTMLElement | null>,
  distance: number,
  { smooth = false }: UseParallaxOptions = {},
): MotionValue<number> {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-distance, distance]);
  const smoothed = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.3 });
  return smooth ? smoothed : raw;
}
