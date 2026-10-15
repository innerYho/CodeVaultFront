import {
  type LinkStatus,
  type NotifyReport,
  type TelegramAlertsClient,
  TelegramApiError,
} from "./types";

export type MockScenario = "success" | "partial" | "failed" | "nobody" | "rate-limited" | "offline";

const REPORTS: Record<"success" | "partial" | "failed" | "nobody", NotifyReport> = {
  success: { delivered: 3, failed: 0, notLinked: 0 },
  partial: { delivered: 2, failed: 1, notLinked: 0 },
  failed: { delivered: 0, failed: 2, notLinked: 0 },
  nobody: { delivered: 0, failed: 0, notLinked: 3 },
};

/**
 * Backend simulado para demos y pruebas, sin red. `simulateStart()` hace lo que hace la persona en Telegram al
 * abrir el enlace y pulsar «Iniciar»; `scenario` decide qué responde el envío de alertas.
 */
export function createMockTelegramClient({
  delayMs = 300,
  linkTtlMs = 15 * 60_000,
  enabled = true,
}: {
  delayMs?: number;
  linkTtlMs?: number;
  enabled?: boolean;
} = {}) {
  const wait = () => (delayMs > 0 ? new Promise((r) => setTimeout(r, delayMs)) : Promise.resolve());
  const state = { linked: false, pendingUntil: 0, scenario: "success" as MockScenario };
  const toStatus = (): LinkStatus => ({
    enabled,
    linked: state.linked,
    username: state.linked ? "ana_demo" : null,
    linkedAt: state.linked ? new Date().toISOString() : null,
  });
  const send = async (): Promise<NotifyReport> => {
    await wait();
    if (state.scenario === "offline") throw new TelegramApiError("network_error");
    if (state.scenario === "rate-limited") throw new TelegramApiError("rate_limited", 429, 42);
    return REPORTS[state.scenario];
  };

  const client: TelegramAlertsClient = {
    async status() {
      await wait();
      return toStatus();
    },
    async createLink() {
      await wait();
      if (!enabled) throw new TelegramApiError("disabled", 503);
      state.pendingUntil = Date.now() + linkTtlMs;
      return {
        url: `https://t.me/CodeVaultBot?start=demo${Math.random().toString(36).slice(2, 10)}`,
        expiresAt: new Date(state.pendingUntil).toISOString(),
      };
    },
    async unlink() {
      await wait();
      state.linked = false;
    },
    async sendTest() {
      const r = await send();
      return state.linked ? r : { delivered: 0, failed: 0, notLinked: 1 };
    },
    sendAlert: () => send(),
  };

  return {
    client,
    /** La persona abre el enlace en Telegram y pulsa «Iniciar» (si el enlace no ha caducado). */
    simulateStart() {
      if (Date.now() < state.pendingUntil) state.linked = true;
    },
    setScenario(s: MockScenario) {
      state.scenario = s;
    },
    get linked() {
      return state.linked;
    },
  };
}
