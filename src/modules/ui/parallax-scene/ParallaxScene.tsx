import {
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { type PointerEvent, type ReactNode, type RefObject, useRef } from "react";
import { useParallax } from "../parallax";

export interface SceneLayer {
  id: string;
  /** Profundidad de 0 (fondo lejano) a 1 (primer plano). Las cercanas se mueven más. */
  depth: number;
  children: ReactNode;
  /** Borde superior de la capa dentro de la escena (p. ej. `"40%"`). Por defecto ocupa toda la altura.
   * Úsalo en lugar de una clase `top-*`: el margen extra de la capa se aplica con estilos en línea. */
  top?: string;
  className?: string;
}

export interface ParallaxSceneProps {
  layers: SceneLayer[];
  /** Contenido fijo sobre todas las capas (títulos, botones). No se mueve. */
  children?: ReactNode;
  /** Recorrido vertical máximo por scroll, en píxeles (las capas lejanas y cercanas van en sentidos opuestos).
   * @default 90 */
  scrollDistance?: number;
  /** Desplazamiento máximo por el ratón, en píxeles, de la capa más cercana. 0 lo desactiva.
   * @default 36 */
  pointerStrength?: number;
  /** Margen extra de cada capa, en % del contenedor, para que no asomen los bordes al moverse.
   * @default 8 */
  bleed?: number;
  /** Fondo y tamaño del contenedor. */
  className?: string;
  /** Descripción para lectores de pantalla; si no se da, la escena se marca como decorativa. */
  label?: string;
}

/**
 * Escena de capas con profundidad real: cada capa reacciona al scroll y al puntero
 * según su `depth`. Las capas se apilan por profundidad (la más cercana, encima).
 */
export function ParallaxScene({
  layers,
  children,
  scrollDistance = 90,
  pointerStrength = 36,
  bleed = 8,
  className = "h-[30rem] rounded-2xl",
  label,
}: ParallaxSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0); // posición del puntero, de -0.5 a 0.5
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.4 });

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height) return;
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  // Con descripción es una imagen; sin ella, decoración que los lectores de pantalla ignoran.
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true } as const);

  const recenter = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={recenter}
      {...a11y}
      className={`relative isolate overflow-hidden ${className}`}
    >
      {[...layers]
        .sort((a, b) => a.depth - b.depth)
        .map((layer) => (
          <SceneLayerView
            key={layer.id}
            layer={layer}
            sceneRef={ref}
            px={sx}
            py={sy}
            scrollDistance={scrollDistance}
            pointerStrength={reduce ? 0 : pointerStrength}
            bleed={bleed}
          />
        ))}
      {children && <div className="relative z-10 size-full">{children}</div>}
    </div>
  );
}

interface LayerViewProps {
  layer: SceneLayer;
  sceneRef: RefObject<HTMLElement | null>;
  px: MotionValue<number>;
  py: MotionValue<number>;
  scrollDistance: number;
  pointerStrength: number;
  bleed: number;
}

function SceneLayerView({
  layer,
  sceneRef,
  px,
  py,
  scrollDistance,
  pointerStrength,
  bleed,
}: LayerViewProps) {
  const depth = Math.min(1, Math.max(0, layer.depth));
  // Lejanas (0): positivo = más lentas que el scroll. Cercanas (1): negativo = más rápidas.
  const scrollY = useParallax(sceneRef, (0.5 - depth) * 2 * scrollDistance);
  // Con el puntero, lo cercano se mueve más y en sentido contrario, como al asomarse.
  const x = useTransform(px, (v) => -v * pointerStrength * depth);
  const y = useTransform(
    [scrollY, py],
    ([s, p]: number[]) => (s ?? 0) - (p ?? 0) * pointerStrength * 0.5 * depth,
  );

  return (
    <motion.div
      data-depth={depth}
      style={{
        x,
        y,
        left: `-${bleed}%`,
        right: `-${bleed}%`,
        bottom: `-${bleed}%`,
        top: layer.top ?? `-${bleed}%`,
      }}
      className={`absolute will-change-transform ${layer.className ?? ""}`}
    >
      {layer.children}
    </motion.div>
  );
}
