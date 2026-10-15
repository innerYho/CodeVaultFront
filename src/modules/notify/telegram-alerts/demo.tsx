import { useMemo, useState } from "react";
import { AlertButton } from "./AlertButton";
import { LinkWizard } from "./LinkWizard";
import { createMockTelegramClient, type MockScenario } from "./mock-client";

const scenarios: { value: MockScenario; label: string }[] = [
  { value: "success", label: "Llega a todos" },
  { value: "partial", label: "Llega solo a una parte" },
  { value: "failed", label: "Telegram falla para todos" },
  { value: "nobody", label: "Nadie tiene Telegram vinculado" },
  { value: "rate-limited", label: "Límite: ya enviaste una alerta" },
  { value: "offline", label: "Sin conexión" },
];

export default function Demo() {
  const mock = useMemo(() => createMockTelegramClient({ linkTtlMs: 90_000 }), []);
  const [scenario, setScenario] = useState<MockScenario>("success");
  const [log, setLog] = useState<string[]>([]);
  const secondary =
    "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

  return (
    <div className="space-y-8 text-sm">
      <p className="rounded-lg border border-dashed border-zinc-400 p-3 text-zinc-600 dark:text-zinc-400">
        Demo con un backend simulado (sin Telegram real). Haz lo que haría una persona: genera el
        enlace y usa el botón «Simular: pulsar Iniciar» en lugar de abrir Telegram.
      </p>

      <div className="space-y-3">
        <LinkWizard client={mock.client} pollMs={1000} />
        <button type="button" onClick={() => mock.simulateStart()} className={secondary}>
          Simular: pulsar «Iniciar» en Telegram
        </button>
      </div>

      <section aria-labelledby="alert-demo" className="space-y-3">
        <h3 id="alert-demo" className="text-base font-semibold">
          Botón de alerta
        </h3>
        <label className="flex flex-wrap items-center gap-2">
          <span>Qué responde el servidor:</span>
          <select
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value as MockScenario);
              mock.setScenario(e.target.value as MockScenario);
            }}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {scenarios.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <AlertButton
          client={mock.client}
          onFinished={(kind) => setLog((l) => [kind, ...l].slice(0, 4))}
        >
          Alerta urgente
        </AlertButton>
        <p className="font-mono text-xs text-zinc-500">
          Resultados verificados: {log.length ? log.join(" ← ") : "(ninguno todavía)"}
        </p>
      </section>
    </div>
  );
}
