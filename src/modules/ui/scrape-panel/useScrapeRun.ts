import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { initialRunState, runReducer } from "./reducer";
import { type ScenarioInfo, ScrapeApiError, type ScrapeClient } from "./types";

/** Mensaje legible para un error del cliente. */
export function describeError(e: unknown): string {
  if (e instanceof ScrapeApiError) {
    if (e.code === "network_error") return "No se pudo conectar con el servidor.";
    if (e.status === 429)
      return "El servidor está ocupado con otras ejecuciones. Prueba en unos segundos.";
    if (e.status === 404) return "El servidor no conoce ese escenario.";
    if (e.code === "stream_error") return "Se cortó la conexión con el servidor.";
    return `Error del servidor (${e.code}).`;
  }
  return "Error inesperado.";
}

/**
 * Estado de una ejecución de scraping: carga los escenarios, lanza uno, acumula los eventos y
 * permite cancelar (cierra la conexión; el servidor detecta el corte y deja de trabajar).
 */
export function useScrapeRun(client: ScrapeClient) {
  const [scenarios, setScenarios] = useState<ScenarioInfo[] | null>(null);
  const [scenariosError, setScenariosError] = useState<string | null>(null);
  const [state, dispatch] = useReducer(runReducer, initialRunState);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctl = new AbortController();
    setScenarios(null);
    setScenariosError(null);
    client
      .scenarios(ctl.signal)
      .then(setScenarios)
      .catch((e) => {
        if (!ctl.signal.aborted) setScenariosError(describeError(e));
      });
    return () => ctl.abort();
  }, [client]);

  // Al desmontar o cambiar de cliente se corta cualquier ejecución en curso.
  useEffect(() => () => controller.current?.abort(), []);

  const start = useCallback(
    async (scenarioId: string) => {
      controller.current?.abort();
      const ctl = new AbortController();
      controller.current = ctl;
      dispatch({ type: "begin", scenario: scenarioId });
      try {
        await client.run(
          scenarioId,
          (event) => !ctl.signal.aborted && dispatch({ type: "event", event }),
          ctl.signal,
        );
      } catch (e) {
        if (!ctl.signal.aborted) dispatch({ type: "failed", message: describeError(e) });
      }
    },
    [client],
  );

  const cancel = useCallback(() => {
    controller.current?.abort();
    dispatch({ type: "cancelled" });
  }, []);

  return { scenarios, scenariosError, state, start, cancel };
}
