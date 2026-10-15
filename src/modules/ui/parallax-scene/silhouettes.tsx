import { useId } from "react";

/** Generador pseudoaleatorio determinista: la misma semilla da siempre el mismo paisaje. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Perfil de montaña por desplazamiento del punto medio: parte de dos extremos y va
 * insertando puntos intermedios con una variación que se reduce en cada ronda.
 * Devuelve `2^detail + 1` alturas normalizadas en [0, 1].
 */
export function ridgeHeights(seed: number, detail = 6, roughness = 0.55): number[] {
  const rand = mulberry32(seed);
  let pts = [rand(), rand()];
  let amp = 1;
  for (let d = 0; d < detail; d++) {
    amp *= roughness;
    const next: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i] as number;
      const b = pts[i + 1] as number;
      next.push(a, (a + b) / 2 + (rand() - 0.5) * amp);
    }
    next.push(pts[pts.length - 1] as number);
    pts = next;
  }
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  return pts.map((p) => (p - min) / (max - min || 1));
}

export interface RidgeProps {
  /** Semilla: misma semilla, misma silueta.
   * @default 1 */
  seed?: number;
  /** Color de la base de la montaña. */
  color: string;
  /** Color de las cumbres (degradado vertical). Por defecto, el mismo que `color`. */
  topColor?: string;
  /** Altura máxima como fracción del alto disponible (0 a 1).
   * @default 0.6 */
  height?: number;
  /** Aspereza: 0.3 suave, 0.7 escarpada.
   * @default 0.55 */
  roughness?: number;
  className?: string;
}

/** Silueta de cordillera a todo el ancho, pensada como capa de una escena. */
export function Ridge({
  seed = 1,
  color,
  topColor,
  height = 0.6,
  roughness = 0.55,
  className = "size-full",
}: RidgeProps) {
  const gradient = useId();
  const h = ridgeHeights(seed, 6, roughness);
  const path = h
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${((i / (h.length - 1)) * 100).toFixed(2)},${(100 - height * 100 * (0.35 + 0.65 * v)).toFixed(2)}`,
    )
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} aria-hidden="true">
      <title>Montañas</title>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={topColor ?? color} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <path d={`${path} L100,100 L0,100 Z`} fill={`url(#${gradient})`} />
    </svg>
  );
}

export interface PinesProps {
  seed?: number;
  /** Cantidad de árboles.
   * @default 28 */
  count?: number;
  color: string;
  className?: string;
}

/** Hilera de pinos como triángulos escalonados; la altura y la posición varían por semilla. */
export function Pines({ seed = 7, count = 28, color, className = "size-full" }: PinesProps) {
  const rand = mulberry32(seed);
  const trees = Array.from({ length: count }, (_, i) => {
    const x = ((i + 0.5 + (rand() - 0.5) * 0.7) / count) * 100;
    const h = 28 + rand() * 42;
    const w = 3.4 + rand() * 2.2;
    const base = 100;
    const tiers = [0, 1, 2].map((t) => {
      const y1 = base - h * (0.18 + t * 0.27);
      const y0 = base - h * (0.5 + t * 0.27);
      const half = (w / 2) * (1 - t * 0.28);
      return `${x - half},${y1} ${x},${y0 - h * 0.12} ${x + half},${y1}`;
    });
    return { id: i, tiers, trunk: { x: x - 0.25, y: base - h * 0.18, h: h * 0.18 } };
  });

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} aria-hidden="true">
      <title>Pinos</title>
      <rect x="0" y="92" width="100" height="8" fill={color} />
      {trees.map((t) => (
        <g key={t.id} fill={color}>
          <rect x={t.trunk.x} y={t.trunk.y} width="0.5" height={t.trunk.h} />
          {t.tiers.map((points) => (
            <polygon key={points} points={points} />
          ))}
        </g>
      ))}
    </svg>
  );
}
