import { useState } from "react";
import { Parallax } from "./index";

export default function Demo() {
  const [distance, setDistance] = useState(80);
  const [smooth, setSmooth] = useState(false);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2">
          Intensidad: <span className="w-8 tabular-nums">{distance}</span>
          <input
            type="range"
            min={0}
            max={200}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} />
          Suavizado (muelle)
        </label>
      </div>
      <p className="text-zinc-500">
        Desplaza la página: cada capa se mueve a una velocidad distinta.
      </p>

      {/* Cada capa es un Parallax propio; el contenedor recorta lo que se sale. */}
      <div className="relative h-[28rem] overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-950 via-indigo-800 to-fuchsia-700">
        <Parallax
          distance={distance * 1.5}
          smooth={smooth}
          className="absolute inset-x-0 -top-24 h-[130%]"
        >
          <div className="size-full opacity-60 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:28px_28px]" />
        </Parallax>

        <Parallax distance={distance} smooth={smooth} className="absolute top-10 right-16">
          <div className="size-24 rounded-full bg-amber-100 shadow-[0_0_60px_10px_rgba(253,230,138,.6)]" />
        </Parallax>

        <div className="absolute inset-0 grid place-items-center">
          <h3 className="text-4xl font-bold text-white drop-shadow">Parallax</h3>
        </div>

        <Parallax
          distance={-distance * 0.6}
          smooth={smooth}
          className="absolute inset-x-0 bottom-0"
        >
          <svg
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            className="block h-32 w-full"
            aria-hidden="true"
          >
            <title>Colinas</title>
            <path d="M0 120V60Q60 20 130 55T260 45T400 70V120Z" fill="#1e1b4b" />
          </svg>
        </Parallax>
      </div>
      <div className="h-40" aria-hidden="true" />
    </div>
  );
}
