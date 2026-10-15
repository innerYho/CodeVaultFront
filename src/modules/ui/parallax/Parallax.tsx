import { motion } from "motion/react";
import { type ReactNode, useRef } from "react";
import { useParallax } from "./useParallax";

export interface ParallaxProps {
  children: ReactNode;
  /** Recorrido máximo en píxeles. Positivo: capa lejana (se mueve más lento que el scroll).
   * Negativo: capa cercana (más rápida). 0 desactiva el efecto.
   * @default 80 */
  distance?: number;
  /** Eje del movimiento.
   * @default "y" */
  axis?: "x" | "y";
  /** Añade inercia con un muelle.
   * @default false */
  smooth?: boolean;
  className?: string;
}

/** Mueve a sus hijos a distinta velocidad que el scroll mientras cruzan la pantalla. */
export function Parallax({
  children,
  distance = 80,
  axis = "y",
  smooth = false,
  className,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const offset = useParallax(ref, distance, { smooth });

  return (
    <motion.div
      ref={ref}
      style={axis === "x" ? { x: offset } : { y: offset }}
      className={`will-change-transform ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}
