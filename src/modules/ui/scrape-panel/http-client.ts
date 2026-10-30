import { SseParser } from "./sse";
import { type ScenarioInfo, ScrapeApiError, type ScrapeClient, type ScrapeEvent } from "./types";

export interface HttpScrapeClientOptions {
  /** Prefijo de las rutas de la demo en el back.
   * @default "/scrape-demo" */
  baseUrl?: string;
  /** Para pruebas o para usar otro `fetch`. */
  fetch?: typeof fetch;
}

/** Traduce un mensaje SSE del back a un evento tipado; ignora los que no conoce. */
export function toScrapeEvent(event: string, raw: string): ScrapeEvent | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  switch (event) {
    case "start":
      return { type: "start", scenario: String(data.scenario), title: String(data.title) };
    case "log":
      return { type: "log", message: String(data.message) };
    case "page":
      return { type: "page", page: data as never };
    case "progress":
      return { type: "progress", progress: data as never };
    case "done":
      return { type: "done", progress: data.progress as never };
    case "error":
      return { type: "error", message: String(data.message) };
    default:
      return null;
  }
}

/**
 * Cliente `fetch` para la demo del back. Lee el flujo SSE con `fetch` y no con `EventSource`:
 * `EventSource` se reconecta solo al terminar el flujo (y volvería a lanzar el trabajo) y no
 * permite cancelar con `AbortSignal`.
 */
export function createHttpScrapeClient({
  baseUrl = "/scrape-demo",
  fetch: doFetch = fetch,
}: HttpScrapeClientOptions = {}): ScrapeClient {
  async function open(path: string, signal?: AbortSignal, accept = "application/json") {
    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}`, { headers: { accept }, signal });
    } catch (e) {
      if (signal?.aborted) throw e;
      throw new ScrapeApiError("network_error");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ScrapeApiError(body?.error ?? "unknown_error", res.status);
    }
    return res;
  }

  return {
    async scenarios(signal) {
      return (await (await open("/scenarios", signal)).json()) as ScenarioInfo[];
    },

    async run(scenarioId, onEvent, signal) {
      const res = await open(`/run/${encodeURIComponent(scenarioId)}`, signal, "text/event-stream");
      if (!res.body) throw new ScrapeApiError("empty_stream");
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      const parser = new SseParser();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const m of parser.push(value)) {
            const event = toScrapeEvent(m.event, m.data);
            if (event) onEvent(event);
          }
        }
      } catch {
        if (signal?.aborted) return; // cancelar no es un error
        throw new ScrapeApiError("stream_error", undefined);
      }
    },
  };
}
