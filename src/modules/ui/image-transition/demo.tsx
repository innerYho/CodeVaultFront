import { useState } from "react";
import { EFFECT_LABELS, EFFECTS, ImageTransition, type TransitionEffect } from "./index";
import { landscapes } from "./landscapes";

export default function Demo() {
  const [effect, setEffect] = useState<TransitionEffect | "random">("circle");
  const [duration, setDuration] = useState(1.2);
  const [autoplay, setAutoplay] = useState(false);
  const [kenBurns, setKenBurns] = useState(true);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2">
          Efecto
          <select
            value={effect}
            onChange={(e) => setEffect(e.target.value as TransitionEffect | "random")}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {EFFECTS.map((e) => (
              <option key={e} value={e}>
                {EFFECT_LABELS[e]}
              </option>
            ))}
            <option value="random">Aleatorio (recorre todos)</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Duración <span className="w-10 tabular-nums">{duration.toFixed(1)} s</span>
          <input
            type="range"
            min={0.4}
            max={2.5}
            step={0.1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
          />
          Reproducción automática
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kenBurns}
            onChange={(e) => setKenBurns(e.target.checked)}
          />
          Zoom lento
        </label>
      </div>

      <ImageTransition
        images={landscapes}
        effect={effect}
        duration={duration}
        interval={autoplay ? 4500 : 0}
        kenBurns={kenBurns}
      />

      <p className="text-xs text-zinc-500">
        Usa las flechas, los puntos o las teclas ← →. Fotos de Unsplash (licencia gratuita); autores
        en <code>public/demo/CREDITS.md</code>.
      </p>
    </div>
  );
}
