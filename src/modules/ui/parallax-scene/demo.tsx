import { useMemo, useState } from "react";
import { mulberry32, ParallaxScene, Pines, Ridge, type SceneLayer } from "./index";

interface Palette {
  label: string;
  sky: string;
  ridges: [top: string, base: string][]; // de la más lejana a la más cercana
  pines: string;
  glow: string;
}

const PALETTES: Record<"dusk" | "night", Palette> = {
  dusk: {
    label: "Atardecer",
    sky: "linear-gradient(#2b1a6b 0%, #8a3a9b 42%, #ff7e5f 78%, #ffc68a 100%)",
    ridges: [
      ["#d58aa6", "#a45f8e"],
      ["#9c5a93", "#6d3d7c"],
      ["#5c3470", "#3a2253"],
      ["#2d1b45", "#1a1030"],
    ],
    pines: "#0d0720",
    glow: "#ffe2a6",
  },
  night: {
    label: "Noche",
    sky: "linear-gradient(#03040d 0%, #0d1736 55%, #213a73 100%)",
    ridges: [
      ["#33497e", "#22335f"],
      ["#243660", "#182649"],
      ["#172544", "#0f1a34"],
      ["#0c1530", "#070d20"],
    ],
    pines: "#03060f",
    glow: "#e8eeff",
  },
};

function Stars({ seed = 3, count = 90 }: { seed?: number; count?: number }) {
  const stars = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: r() * 100,
      y: r() * 70,
      s: 0.5 + r() * 1.5,
      o: 0.4 + r() * 0.6,
    }));
  }, [seed, count]);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full" aria-hidden="true">
      <title>Estrellas</title>
      {stars.map((s) => (
        <circle key={s.id} cx={s.x} cy={s.y} r={s.s * 0.12} fill="white" opacity={s.o} />
      ))}
    </svg>
  );
}

const Cloud = ({ className }: { className: string }) => (
  <div className={`absolute rounded-full bg-white/25 blur-2xl ${className}`} />
);

export default function Demo() {
  const [mode, setMode] = useState<"dusk" | "night">("dusk");
  const p = PALETTES[mode];

  const layers: SceneLayer[] = [
    ...(mode === "night" ? [{ id: "stars", depth: 0.05, children: <Stars /> }] : []),
    {
      id: "sun",
      depth: 0.12,
      children: (
        <div
          className="absolute top-[34%] left-[62%] size-28 rounded-full"
          style={{ background: p.glow, boxShadow: `0 0 90px 24px ${p.glow}88` }}
        />
      ),
    },
    {
      id: "clouds",
      depth: 0.22,
      children: (
        <>
          <Cloud className="top-[26%] left-[12%] h-12 w-72" />
          <Cloud className="top-[38%] left-[48%] h-10 w-80" />
          <Cloud className="top-[18%] left-[70%] h-9 w-60" />
        </>
      ),
    },
    {
      id: "ridge-1",
      depth: 0.3,
      top: "14%",
      children: (
        <Ridge
          seed={11}
          height={0.62}
          roughness={0.5}
          topColor={p.ridges[0]?.[0] ?? "#fff"}
          color={p.ridges[0]?.[1] ?? "#fff"}
        />
      ),
    },
    {
      id: "ridge-2",
      depth: 0.45,
      top: "27%",
      children: (
        <Ridge
          seed={42}
          height={0.6}
          roughness={0.55}
          topColor={p.ridges[1]?.[0] ?? "#fff"}
          color={p.ridges[1]?.[1] ?? "#fff"}
        />
      ),
    },
    {
      id: "ridge-3",
      depth: 0.62,
      top: "42%",
      children: (
        <Ridge
          seed={7}
          height={0.55}
          roughness={0.6}
          topColor={p.ridges[2]?.[0] ?? "#fff"}
          color={p.ridges[2]?.[1] ?? "#fff"}
        />
      ),
    },
    {
      id: "ridge-4",
      depth: 0.8,
      top: "57%",
      children: (
        <Ridge
          seed={99}
          height={0.5}
          roughness={0.5}
          topColor={p.ridges[3]?.[0] ?? "#fff"}
          color={p.ridges[3]?.[1] ?? "#fff"}
        />
      ),
    },
    {
      id: "pines",
      depth: 0.95,
      top: "72%",
      children: <Pines color={p.pines} count={34} />,
    },
  ];

  return (
    <div className="space-y-4 text-sm">
      <div className="flex gap-2">
        {(Object.keys(PALETTES) as (keyof typeof PALETTES)[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`rounded-md border px-3 py-1 ${mode === m ? "border-indigo-500 bg-indigo-500 text-white" : "border-zinc-300 dark:border-zinc-700"}`}
          >
            {PALETTES[m].label}
          </button>
        ))}
      </div>
      <p className="text-zinc-500">
        Mueve el ratón sobre la escena y desplaza la página: las capas cercanas se mueven más que
        las lejanas.
      </p>

      <div
        style={{ background: p.sky }}
        className="rounded-2xl transition-[background] duration-700"
      >
        <ParallaxScene
          layers={layers}
          label={`Paisaje de montañas al ${p.label.toLowerCase()}`}
          className="h-[30rem] rounded-2xl"
        >
          <div className="grid size-full place-items-center">
            <h3 className="text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.45)]">
              Profundidad
            </h3>
          </div>
        </ParallaxScene>
      </div>
      <div className="h-40" aria-hidden="true" />
    </div>
  );
}
