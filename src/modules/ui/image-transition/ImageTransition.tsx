import { motion, type TargetAndTransition, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { EFFECTS, type EffectSpec, getEffect, stripClip, type TransitionEffect } from "./effects";

export interface TransitionImage {
  src: string;
  /** Descripción de la imagen; se anuncia a lectores de pantalla. */
  alt: string;
}

export interface ImageTransitionProps {
  images: TransitionImage[];
  /** Efecto del cambio. `"random"` recorre todos en orden.
   * @default "circle" */
  effect?: TransitionEffect | "random";
  /** Duración de cada transición, en segundos.
   * @default 1.2 */
  duration?: number;
  /** Milisegundos entre imágenes en reproducción automática. 0 la desactiva.
   * @default 6000 */
  interval?: number;
  /** Zoom lento sobre la imagen visible (efecto Ken Burns).
   * @default true */
  kenBurns?: boolean;
  /** Muestra flechas, puntos y botón de pausa.
   * @default true */
  controls?: boolean;
  /** Índice mostrado: si lo pasas, el componente es controlado. */
  index?: number;
  onIndexChange?: (index: number) => void;
  /** Clases del contenedor (por defecto, 16:9 con esquinas redondeadas). */
  className?: string;
}

interface View {
  from: number | null; // imagen saliente, mientras dura la transición
  to: number;
  fromKey: number; // claves estables: una capa que pasa de arriba a abajo no se desmonta
  toKey: number;
  dir: 1 | -1;
  effect: TransitionEffect;
  /** Franjas con las que entró cada capa: su estructura no debe cambiar mientras siga montada. */
  fromStrips?: number;
  toStrips?: number;
}

const EASE = [0.65, 0, 0.35, 1] as const;

export function ImageTransition({
  images,
  effect = "circle",
  duration = 1.2,
  interval = 6000,
  kenBurns = true,
  controls = true,
  index: indexProp,
  onIndexChange,
  className = "aspect-[16/9] rounded-2xl",
}: ImageTransitionProps) {
  const n = images.length;
  const reduce = useReducedMotion();
  const [innerIndex, setInnerIndex] = useState(0);
  const index = indexProp ?? innerIndex;
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(true);

  const [view, setView] = useState<View>({
    from: null,
    to: index,
    fromKey: 0,
    toKey: 0,
    dir: 1,
    effect: "fade",
  });
  if (view.to !== index) {
    // Estado derivado: se ajusta durante el render (patrón permitido por React) para no mostrar un fotograma intermedio.
    const key = view.toKey + 1;
    const forward = (index - view.to + n) % n <= n / 2;
    const chosen = effect === "random" ? (EFFECTS[key % EFFECTS.length] ?? "fade") : effect;
    const dir = forward ? 1 : -1;
    const used = reduce ? "fade" : chosen;
    setView({
      from: view.to,
      fromKey: view.toKey,
      fromStrips: view.toStrips, // la capa saliente conserva la estructura con la que entró
      to: index,
      toKey: key,
      toStrips: getEffect(used, dir).strips,
      dir,
      effect: used,
    });
  }

  const goTo = useCallback(
    (i: number) => {
      const next = ((i % n) + n) % n;
      setInnerIndex(next);
      onIndexChange?.(next);
    },
    [n, onIndexChange],
  );

  // Precarga: evita ver el hueco de una imagen aún sin descargar.
  useEffect(() => {
    for (const img of images) new Image().src = img.src;
  }, [images]);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const playing = interval > 0 && n > 1 && !userPaused && !hovering && visible && !reduce;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => goTo(index + 1), interval);
    return () => clearTimeout(t);
  }, [playing, index, interval, goTo]);

  const finish = (key: number) =>
    setView((v) => (v.toKey === key && v.from !== null ? { ...v, from: null } : v));

  const spec = getEffect(view.effect, view.dir);
  const dur = reduce ? 0.25 : duration;
  const kbSeconds = interval > 0 ? interval / 1000 + duration : 12;
  const layers =
    view.from === null
      ? [{ i: view.to, key: view.toKey, role: "idle" as const, strips: view.toStrips }]
      : [
          { i: view.from, key: view.fromKey, role: "bottom" as const, strips: view.fromStrips },
          { i: view.to, key: view.toKey, role: "top" as const, strips: view.toStrips },
        ];
  const current = images[view.to];

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Galería de imágenes"
      className={`group relative overflow-hidden bg-zinc-900 ${className}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      }}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: patrón de carrusel de WAI-ARIA (group con roledescription slide); fieldset agrupa controles de formulario. */}
      <div
        role="group"
        aria-roledescription="diapositiva"
        aria-label={`${view.to + 1} de ${n}: ${current?.alt ?? ""}`}
        className="absolute inset-0"
      >
        {layers.map(({ i, key, role, strips }) => {
          const img = images[i];
          return img ? (
            <Layer
              key={key}
              src={img.src}
              role={role}
              spec={spec}
              strips={strips}
              duration={dur}
              kenBurns={kenBurns && !reduce}
              kbSeconds={kbSeconds}
              dir={view.dir}
              onDone={() => finish(view.toKey)}
            />
          ) : null;
        })}
      </div>

      {controls && n > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() => goTo(index - 1)}
            className={`${arrow} left-3`}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={() => goTo(index + 1)}
            className={`${arrow} right-3`}
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
            {interval > 0 && (
              <button
                type="button"
                aria-label={userPaused ? "Reanudar reproducción" : "Pausar reproducción"}
                onClick={() => setUserPaused((p) => !p)}
                className="grid size-7 place-items-center rounded-full bg-black/40 text-xs text-white backdrop-blur hover:bg-black/60"
              >
                {userPaused ? "▶" : "❚❚"}
              </button>
            )}
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  aria-label={`Ir a la imagen ${i + 1}`}
                  aria-current={i === view.to}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${i === view.to ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

const arrow =
  "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-2xl text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/55 focus-visible:opacity-100 group-hover:opacity-100";

interface LayerProps {
  src: string;
  role: "idle" | "top" | "bottom";
  spec: EffectSpec;
  strips?: number;
  duration: number;
  kenBurns: boolean;
  kbSeconds: number;
  dir: 1 | -1;
  onDone: () => void;
}

const NONE: TargetAndTransition = {};

/**
 * Una capa = una imagen. La raíz es siempre el mismo elemento y lleva el zoom lento (Ken Burns),
 * así el zoom no se reinicia cuando la capa pasa de entrar (`top`) a quedar debajo (`bottom`).
 */
function Layer({
  src,
  role,
  spec,
  strips,
  duration,
  kenBurns,
  kbSeconds,
  dir,
  onDone,
}: LayerProps) {
  const t = { duration, ease: EASE };
  const picture = <img src={src} alt="" draggable={false} className="size-full object-cover" />;
  const entering = role === "top";

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1 }}
      animate={{ scale: kenBurns ? 1.09 : 1 }}
      transition={{ duration: kbSeconds, ease: "linear" }}
    >
      {strips ? (
        Array.from({ length: strips }, (_, i) => (
          <motion.div
            // biome-ignore lint/suspicious/noArrayIndexKey: franjas fijas de una misma imagen.
            key={i}
            className="absolute inset-0"
            initial={entering ? { clipPath: stripClip(i, strips, true) } : false}
            animate={{ clipPath: stripClip(i, strips, false) }}
            transition={{
              duration: duration * 0.6,
              ease: EASE,
              delay: (dir === 1 ? i : strips - 1 - i) * ((duration * 0.4) / strips),
            }}
            onAnimationComplete={
              entering && i === (dir === 1 ? strips - 1 : 0) ? onDone : undefined
            }
          >
            {picture}
          </motion.div>
        ))
      ) : (
        <motion.div
          className="absolute inset-0"
          initial={entering ? spec.top.initial : false}
          animate={entering ? spec.top.animate : role === "bottom" ? (spec.bottom ?? NONE) : NONE}
          transition={t}
          onAnimationComplete={entering ? onDone : undefined}
        >
          <motion.div
            className="absolute inset-0"
            initial={entering ? spec.inner?.initial : false}
            animate={entering ? (spec.inner?.animate ?? NONE) : NONE}
            transition={t}
          >
            {picture}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
