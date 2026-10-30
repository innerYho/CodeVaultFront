/** Escenario que ofrece el servidor (ver `src/app/scrape-demo.ts` del back). */
export interface ScenarioInfo {
  id: string;
  title: string;
  description: string;
  /** Necesita Chrome/Chromium en el servidor. */
  needsBrowser: boolean;
  /** `false` si el servidor no puede ejecutarlo (p. ej. no tiene Chrome). */
  available: boolean;
}

export interface RunProgress {
  state: "running" | "done" | "cancelled";
  /** `null` si no se conoce de antemano (listados paginados). */
  total: number | null;
  done: number;
  failed: number;
  items: number;
  current: string | null;
}

export interface PageIssue {
  index: number;
  field: string;
  message: string;
}

export interface PageSummary {
  url: string;
  ok: boolean;
  items: Record<string, unknown>[];
  issues: PageIssue[];
  /** Solo si `ok` es `false`. */
  reason?: string;
  description?: string;
}

/** Eventos de una ejecución, ya normalizados (el cliente HTTP los traduce desde SSE). */
export type ScrapeEvent =
  | { type: "start"; scenario: string; title: string }
  | { type: "log"; message: string }
  | { type: "page"; page: PageSummary }
  | { type: "progress"; progress: RunProgress }
  | { type: "done"; progress: RunProgress }
  | { type: "error"; message: string };

export interface ScrapeClient {
  scenarios(signal?: AbortSignal): Promise<ScenarioInfo[]>;
  /**
   * Ejecuta un escenario y entrega cada evento según llega. Resuelve cuando el flujo termina
   * (o se aborta con `signal`) y rechaza con `ScrapeApiError` si no pudo empezar.
   */
  run(
    scenarioId: string,
    onEvent: (event: ScrapeEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>;
}

export class ScrapeApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(code);
    this.name = "ScrapeApiError";
  }
}
