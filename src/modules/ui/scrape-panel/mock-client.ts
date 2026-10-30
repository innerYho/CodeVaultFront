import type { PageSummary, RunProgress, ScenarioInfo, ScrapeClient, ScrapeEvent } from "./types";

/** Datos de ejemplo del simulacro: una papelería ficticia, igual que la del back. */
const PRODUCTS = [
  ["Cuaderno cuadriculado", 12500],
  ["Lápiz HB (caja x12)", 8900],
  ["Resaltador amarillo", 3200],
  ["Regla 30 cm", 2500],
  ["Carpeta argollada", 18750],
  ["Marcador permanente", 4100],
  ["Tijeras escolares", 6800],
  ["Pegante en barra", 2900],
  ["Block de notas adhesivas", 5400],
  ["Borrador de nata", 1500],
] as const;

const SCENARIOS: ScenarioInfo[] = [
  {
    id: "catalogo",
    title: "Catálogo paginado",
    description: "Sigue el enlace «siguiente» por todo el listado, extrae y valida cada producto.",
    needsBrowser: false,
    available: true,
  },
  {
    id: "detalles",
    title: "Lista de URLs con fallos",
    description:
      "Tres fichas correctas, una página inestable que se recupera tras reintentos, una prohibida por robots.txt y una que no existe.",
    needsBrowser: false,
    available: true,
  },
  {
    id: "dinamico",
    title: "Página con JavaScript (navegador)",
    description:
      "La descarga simple no ve nada; un Chrome real espera a que la lista aparezca y la lee.",
    needsBrowser: true,
    available: false,
  },
];

export interface MockScrapeClientOptions {
  /** Pausa entre eventos, en ms. Con `0` los eventos salen de seguido (pruebas).
   * @default 450 */
  delayMs?: number;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0 || signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });

const BASE = "http://ejemplo.local";
const ok = (path: string, items: PageSummary["items"] = []): PageSummary => ({
  url: BASE + path,
  ok: true,
  items,
  issues: [],
});
const bad = (path: string, reason: string, description: string): PageSummary => ({
  url: BASE + path,
  ok: false,
  items: [],
  issues: [],
  reason,
  description,
});

/**
 * Cliente simulado: reproduce los mismos eventos que el back, sin red, para demos y pruebas.
 * Los datos son ficticios.
 */
export function createMockScrapeClient({
  delayMs = 450,
}: MockScrapeClientOptions = {}): ScrapeClient {
  return {
    async scenarios() {
      return SCENARIOS;
    },

    async run(id, onEvent, signal) {
      const emit = async (event: ScrapeEvent) => {
        if (signal?.aborted) return;
        onEvent(event);
        await sleep(delayMs, signal);
      };
      const progress = (
        p: Partial<RunProgress> & Pick<RunProgress, "done" | "failed" | "items">,
      ): RunProgress => ({
        state: "running",
        total: null,
        current: null,
        ...p,
      });

      if (id === "catalogo") {
        await emit({ type: "start", scenario: id, title: SCENARIOS[0]?.title ?? id });
        let items = 0;
        for (let n = 1; n <= 3; n++) {
          const slice = PRODUCTS.slice((n - 1) * 4, n * 4).map(([nombre, precio], i) => ({
            nombre,
            precio,
            disponible: ((n - 1) * 4 + i + 1) % 4 !== 0,
          }));
          items += slice.length;
          await emit({ type: "page", page: ok(`/catalogo?pagina=${n}`, slice) });
          await emit({ type: "progress", progress: progress({ done: n, failed: 0, items }) });
        }
        if (!signal?.aborted)
          onEvent({
            type: "done",
            progress: { ...progress({ done: 3, failed: 0, items }), state: "done" },
          });
        return;
      }

      if (id === "detalles") {
        await emit({ type: "start", scenario: id, title: SCENARIOS[1]?.title ?? id });
        const total = 6;
        const steps: { page: PageSummary; log?: string[] }[] = [
          { page: ok("/producto/1", [{ nombre: "Cuaderno cuadriculado" }]) },
          {
            page: ok("/inestable", [{ nombre: "Respondió al tercer intento" }]),
            log: [
              "Reintento 1 de /inestable en 312 ms (503)",
              "Reintento 2 de /inestable en 705 ms (503)",
            ],
          },
          { page: ok("/producto/2", [{ nombre: "Lápiz HB (caja x12)" }]) },
          { page: bad("/privado", "robots", "robots.txt no permite esta ruta") },
          { page: bad("/no-existe", "http", "HTTP 404") },
          { page: ok("/producto/3", [{ nombre: "Resaltador amarillo" }]) },
        ];
        let done = 0;
        let failed = 0;
        let items = 0;
        for (const step of steps) {
          for (const message of step.log ?? []) await emit({ type: "log", message });
          done++;
          if (!step.page.ok) failed++;
          items += step.page.items.length;
          await emit({ type: "page", page: step.page });
          await emit({ type: "progress", progress: progress({ total, done, failed, items }) });
        }
        if (!signal?.aborted)
          onEvent({
            type: "done",
            progress: { ...progress({ total, done, failed, items }), state: "done" },
          });
        return;
      }

      onEvent({ type: "error", message: "Este escenario necesita un servidor con Chrome." });
    },
  };
}
