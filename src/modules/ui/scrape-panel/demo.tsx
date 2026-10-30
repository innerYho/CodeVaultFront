import { useMemo, useState } from "react";
import { createHttpScrapeClient, createMockScrapeClient, ScrapePanel } from "./index";

type Mode = "mock" | "real";

export default function Demo() {
  const [mode, setMode] = useState<Mode>("mock");
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000/scrape-demo");
  const [draft, setDraft] = useState(baseUrl);
  const client = useMemo(
    () => (mode === "mock" ? createMockScrapeClient() : createHttpScrapeClient({ baseUrl })),
    [mode, baseUrl],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
        <fieldset className="flex flex-wrap items-center gap-4">
          <legend className="mb-1 font-medium">Origen de los datos</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="scrape-mode"
              checked={mode === "mock"}
              onChange={() => setMode("mock")}
            />
            Simulado (sin red)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="scrape-mode"
              checked={mode === "real"}
              onChange={() => setMode("real")}
            />
            Back real
          </label>
        </fieldset>
        {mode === "mock" ? (
          <p>Los eventos y los datos son ficticios; reproducen lo que enviaría el back.</p>
        ) : (
          <div className="space-y-1">
            <label className="block">
              URL de la demo del back
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => setBaseUrl(draft)}
                onKeyDown={(e) => e.key === "Enter" && setBaseUrl(draft)}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
              />
            </label>
            <p>
              Arranca el back en desarrollo (<code>pnpm dev</code>) y este sitio con{" "}
              <code>pnpm dev</code>: el back permite el origen <code>http://localhost:5173</code>.
              En producción la demo está apagada.
            </p>
          </div>
        )}
      </div>
      <ScrapePanel key={`${mode}-${baseUrl}`} client={client} />
    </div>
  );
}
