import type { TargetAndTransition } from "motion/react";

export type TransitionEffect = "fade" | "wipe" | "circle" | "zoom" | "blinds" | "slide";
export const EFFECTS: TransitionEffect[] = ["fade", "wipe", "circle", "zoom", "blinds", "slide"];

export const EFFECT_LABELS: Record<TransitionEffect, string> = {
  fade: "Fundido",
  wipe: "Cortina",
  circle: "Círculo",
  zoom: "Zoom y desenfoque",
  blinds: "Persianas",
  slide: "Deslizar con profundidad",
};

export interface EffectSpec {
  /** Capa que entra: de `initial` a `animate`. */
  top: { initial: TargetAndTransition; animate: TargetAndTransition };
  /** Contra-zoom de la imagen dentro de la capa que entra (da profundidad al revelado). */
  inner?: { initial: TargetAndTransition; animate: TargetAndTransition };
  /** Movimiento de la capa saliente mientras la otra entra. */
  bottom?: TargetAndTransition;
  /** Número de franjas (solo `blinds`): cada una se anima con retardo. */
  strips?: number;
}

const COUNTER_ZOOM = { initial: { scale: 1.22 }, animate: { scale: 1 } };

/** `dir` es 1 al avanzar y -1 al retroceder: el revelado cambia de sentido. */
export function getEffect(effect: TransitionEffect, dir: 1 | -1): EffectSpec {
  switch (effect) {
    case "fade":
      return { top: { initial: { opacity: 0 }, animate: { opacity: 1 } } };
    case "wipe":
      return {
        top: {
          initial: { clipPath: dir === 1 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" },
          animate: { clipPath: "inset(0 0% 0 0%)" },
        },
        inner: COUNTER_ZOOM,
      };
    case "circle":
      return {
        top: {
          initial: { clipPath: "circle(0% at 50% 50%)" },
          animate: { clipPath: "circle(75% at 50% 50%)" }, // 71 % ya cubre las esquinas
        },
        inner: COUNTER_ZOOM,
      };
    case "zoom":
      return {
        top: {
          initial: { opacity: 0, filter: "blur(18px)" },
          animate: { opacity: 1, filter: "blur(0px)" },
        },
        inner: { initial: { scale: 1.3 }, animate: { scale: 1 } },
      };
    case "slide":
      return {
        top: { initial: { x: `${dir * 100}%` }, animate: { x: "0%" } },
        bottom: { x: `${-dir * 22}%`, filter: "brightness(0.55)" },
      };
    case "blinds":
      return { top: { initial: {}, animate: {} }, strips: 8 };
  }
}

/** Recorte de la franja `i` de `n`, con la altura colapsada (`hidden`) o completa. */
export function stripClip(i: number, n: number, hidden: boolean): string {
  const left = (i * 100) / n;
  const right = 100 - ((i + 1) * 100) / n;
  return `inset(${hidden ? 100 : 0}% ${right}% 0 ${left}%)`;
}
