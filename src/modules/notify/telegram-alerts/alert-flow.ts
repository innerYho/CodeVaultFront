import type { Outcome } from "./result";

/** Fases del botón de alerta. Cada una corresponde a un paso que la persona ve. */
export type AlertPhase =
  | { phase: "idle" }
  | { phase: "confirming" }
  | { phase: "sending" }
  | { phase: "done"; outcome: Outcome };

export type AlertEvent =
  | { type: "open" }
  | { type: "cancel" }
  | { type: "send" }
  | { type: "finished"; outcome: Outcome }
  | { type: "close" };

/**
 * Máquina de estados pura del flujo: idle → confirming → sending → done.
 * Las transiciones inválidas se ignoran: no se puede enviar sin confirmar ni enviar dos veces
 * (un doble clic no debe mandar dos alertas), y no se puede cancelar mientras se envía.
 */
export function alertReducer(state: AlertPhase, event: AlertEvent): AlertPhase {
  switch (event.type) {
    case "open":
      return state.phase === "idle" || state.phase === "done" ? { phase: "confirming" } : state;
    case "cancel":
      return state.phase === "confirming" ? { phase: "idle" } : state;
    case "send":
      return state.phase === "confirming" ? { phase: "sending" } : state;
    case "finished":
      return state.phase === "sending" ? { phase: "done", outcome: event.outcome } : state;
    case "close":
      return state.phase === "done" ? { phase: "idle" } : state;
  }
}
