import {
  type LinkInfo,
  type LinkStatus,
  type NotifyReport,
  type TelegramAlertsClient,
  TelegramApiError,
} from "./types";

export interface TelegramClientOptions {
  /** Prefijo de las rutas. @default "/telegram" */
  baseUrl?: string;
  /** Para pruebas o para usar otro `fetch`. */
  fetch?: typeof fetch;
}

/** Cliente `fetch` para las rutas de `notify/telegram-alerts` del back. La sesión va en una cookie `httpOnly`. */
export function createTelegramAlertsClient({
  baseUrl = "/telegram",
  fetch: doFetch = fetch,
}: TelegramClientOptions = {}): TelegramAlertsClient {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}`, {
        method,
        credentials: "include",
        headers: body === undefined ? undefined : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new TelegramApiError("network_error");
    }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok)
      throw new TelegramApiError(data?.error ?? "unknown_error", res.status, data?.retryAfter);
    return data as T;
  }

  return {
    status: () => call<LinkStatus>("GET", "/status"),
    createLink: () => call<LinkInfo>("POST", "/link"),
    unlink: async () => {
      await call("DELETE", "/link");
    },
    sendTest: () => call<NotifyReport>("POST", "/test"),
    sendAlert: (note) => call<NotifyReport>("POST", "/alerts", note ? { note } : {}),
  };
}
