import { useLocalStorage, useSessionStorage } from "./index";

const cities = ["Bogotá", "Barranquilla", "Medellín"];

function Picker({ label }: { label: string }) {
  const [city, setCity] = useLocalStorage("codevault:demo:city", 0);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {cities.map((c, i) => (
          <button
            key={c}
            type="button"
            aria-pressed={city === i}
            onClick={() => setCity(i)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm aria-pressed:border-indigo-500 aria-pressed:bg-indigo-500 aria-pressed:text-white dark:border-zinc-700"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function Counter() {
  const [n, setN, reset] = useSessionStorage("codevault:demo:visits", 0);
  const btn =
    "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} onClick={() => setN((v) => v + 1)}>
        Sumar
      </button>
      <output aria-label="Contador de esta pestaña" className="min-w-8 text-center font-mono">
        {n}
      </output>
      <button type="button" className={btn} onClick={reset}>
        Reiniciar
      </button>
    </div>
  );
}

export default function Demo() {
  const [, , resetCity] = useLocalStorage("codevault:demo:city", 0);
  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-3" aria-labelledby="demo-local">
        <h3 id="demo-local" className="font-semibold">
          useLocalStorage
        </h3>
        <p>
          Elige una ciudad y recarga, o abre esta página en otra pestaña: se mantiene y se
          sincroniza.
        </p>
        <Picker label="Selector A" />
        <Picker label="Selector B (mismo valor, se actualiza a la vez)" />
        <button
          type="button"
          onClick={resetCity}
          className="text-indigo-600 underline dark:text-indigo-400"
        >
          Restablecer
        </button>
      </section>
      <section className="space-y-3" aria-labelledby="demo-session">
        <h3 id="demo-session" className="font-semibold">
          useSessionStorage
        </h3>
        <p>
          Suma y recarga: se conserva. Abre otra pestaña: ahí empieza en 0, porque cada pestaña
          tiene el suyo.
        </p>
        <Counter />
      </section>
    </div>
  );
}
