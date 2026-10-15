import { useCallback, useEffect, useRef, useState } from "react";
import { classifyError, classifyReport, type Outcome } from "./result";
import type { TelegramAlertsClient } from "./types";

export type LinkState =
  | { phase: "loading" }
  /** El servidor no tiene el bot configurado. */
  | { phase: "disabled" }
  | { phase: "idle" }
  | { phase: "creating" }
  | { phase: "waiting"; url: string; expiresAt: number }
  | { phase: "expired" }
  | { phase: "linked"; username: string | null }
  | { phase: "error"; outcome: Outcome };

export type TestState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "result"; outcome: Outcome };

export interface UseLinkFlowOptions {
  /** Cada cuánto se verifica si la persona ya pulsó «Iniciar» en Telegram. @default 2500 */
  pollMs?: number;
  /** Fallos de red seguidos tolerados mientras se espera, antes de rendirse. @default 4 */
  maxPollFailures?: number;
}

/**
 * Lógica del asistente de vinculación: consulta el estado, genera el enlace, VERIFICA periódicamente si la
 * persona lo completó (con cuenta atrás) y permite probar el canal.
 */
export function useLinkFlow(
  client: TelegramAlertsClient,
  { pollMs = 2500, maxPollFailures = 4 }: UseLinkFlowOptions = {},
) {
  const [state, setState] = useState<LinkState>({ phase: "loading" });
  const [test, setTest] = useState<TestState>({ kind: "idle" });
  const [now, setNow] = useState(() => Date.now());
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const s = await client.status();
      if (!alive.current) return;
      if (!s.enabled) setState({ phase: "disabled" });
      else setState(s.linked ? { phase: "linked", username: s.username } : { phase: "idle" });
    } catch (e) {
      if (alive.current) setState({ phase: "error", outcome: classifyError(e) });
    }
  }, [client]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const begin = useCallback(async () => {
    setState({ phase: "creating" });
    setTest({ kind: "idle" });
    try {
      const link = await client.createLink();
      if (alive.current)
        setState({ phase: "waiting", url: link.url, expiresAt: Date.parse(link.expiresAt) });
    } catch (e) {
      if (alive.current) setState({ phase: "error", outcome: classifyError(e) });
    }
  }, [client]);

  const waiting = state.phase === "waiting" ? state : null;

  // Cuenta atrás: caduca aunque el servidor no responda.
  useEffect(() => {
    if (!waiting) return;
    setNow(Date.now());
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= waiting.expiresAt) setState({ phase: "expired" });
    }, 1000);
    return () => clearInterval(id);
  }, [waiting]);

  // Verificación: pregunta al servidor sin solaparse; los fallos puntuales de red no cortan la espera.
  useEffect(() => {
    if (!waiting) return;
    let busy = false;
    let failures = 0;
    const id = setInterval(async () => {
      if (busy) return;
      busy = true;
      try {
        const s = await client.status();
        failures = 0;
        if (alive.current && s.linked) setState({ phase: "linked", username: s.username });
      } catch (e) {
        if (++failures >= maxPollFailures && alive.current)
          setState({ phase: "error", outcome: classifyError(e) });
      } finally {
        busy = false;
      }
    }, pollMs);
    return () => clearInterval(id);
  }, [waiting, client, pollMs, maxPollFailures]);

  const unlink = useCallback(async () => {
    try {
      await client.unlink();
      if (alive.current) {
        setTest({ kind: "idle" });
        setState({ phase: "idle" });
      }
    } catch (e) {
      if (alive.current) setState({ phase: "error", outcome: classifyError(e) });
    }
  }, [client]);

  const runTest = useCallback(async () => {
    setTest({ kind: "sending" });
    try {
      const r = await client.sendTest();
      // Misma verificación que la alerta real: «enviado» solo si Telegram entregó algo.
      const outcome =
        r.delivered > 0
          ? {
              kind: "success" as const,
              title: "Prueba entregada",
              message: "Revisa Telegram: debe haber llegado un mensaje de prueba.",
            }
          : r.notLinked > 0
            ? {
                kind: "nobody" as const,
                title: "Sin Telegram vinculado",
                message: "Esta cuenta ya no tiene Telegram vinculado. Vuelve a vincularlo.",
              }
            : { ...classifyReport(r), title: "La prueba no se entregó" };
      if (alive.current) setTest({ kind: "result", outcome });
    } catch (e) {
      if (alive.current) setTest({ kind: "result", outcome: classifyError(e) });
    }
  }, [client]);

  const secondsLeft = waiting ? Math.max(0, Math.ceil((waiting.expiresAt - now) / 1000)) : 0;

  return { state, test, secondsLeft, begin, unlink, runTest, refresh };
}
