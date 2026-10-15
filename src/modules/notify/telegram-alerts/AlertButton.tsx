import { type ReactNode, useEffect, useId, useReducer, useRef, useState } from "react";
import { alertReducer } from "./alert-flow";
import { classifyError, classifyReport } from "./result";
import type { TelegramAlertsClient } from "./types";

export interface AlertButtonProps {
  client: TelegramAlertsClient;
  /** Contenido del botón (ícono o texto). Por defecto «Alerta». */
  children?: ReactNode;
  /** Permite escribir una nota opcional (hasta 200 caracteres) que viaja en la alerta. @default true */
  allowNote?: boolean;
  /** Se llama con el tipo de resultado verificado cuando termina el envío (para registrar métricas, etc.). */
  onFinished?: (kind: "success" | "partial" | "failed" | "nobody" | "error") => void;
  className?: string;
}

const NOTE_MAX = 200;
const STEPS = [
  "Confirmas que es una emergencia real.",
  "Se avisa de inmediato por Telegram a las personas responsables.",
  "Verificamos que el aviso llegó y te decimos el resultado real.",
];

/**
 * Botón de alerta urgente con flujo paso a paso: confirmación → envío → verificación → resultado.
 * Nunca muestra «enviada» sin comprobar el resultado real (ver `classifyReport`).
 */
export function AlertButton({
  client,
  children = "Alerta",
  allowNote = true,
  onFinished,
  className,
}: AlertButtonProps) {
  const [state, dispatch] = useReducer(alertReducer, { phase: "idle" });
  const [note, setNote] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const noteId = useId();
  const open = state.phase !== "idle";

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Guarda síncrona: dos clics antes de que React repinte no deben mandar dos alertas.
  const inFlight = useRef(false);

  async function send() {
    if (inFlight.current) return;
    inFlight.current = true;
    dispatch({ type: "send" });
    let outcome: ReturnType<typeof classifyError>;
    try {
      outcome = classifyReport(await client.sendAlert(note.trim() || undefined));
    } catch (e) {
      outcome = classifyError(e);
    }
    inFlight.current = false;
    dispatch({ type: "finished", outcome });
    onFinished?.(outcome.kind);
  }

  const done = state.phase === "done" ? state.outcome : null;
  const ok = done?.kind === "success";
  const btn = "rounded-lg px-4 py-2 text-sm font-medium";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setNote("");
          dispatch({ type: "open" });
        }}
        className={
          className ??
          "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        }
      >
        {children}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        // Mientras se envía no se puede cerrar con Escape: la persona debe ver el resultado.
        onCancel={(e) => state.phase === "sending" && e.preventDefault()}
        onClose={() => state.phase === "confirming" && dispatch({ type: "cancel" })}
        onMouseDown={(e) =>
          e.target === e.currentTarget &&
          state.phase === "confirming" &&
          dispatch({ type: "cancel" })
        }
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {state.phase === "confirming" && (
          <div className="space-y-4">
            <h2 id={titleId} className="text-lg font-semibold">
              ¿Enviar una alerta urgente?
            </h2>
            <p className="text-sm">
              Úsala <strong>solo si presentas o evidencias una emergencia</strong>.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
              {STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {allowNote && (
              <div className="space-y-1">
                <label htmlFor={noteId} className="text-sm font-medium">
                  Nota para quien la reciba{" "}
                  <span className="font-normal text-zinc-500">(opcional)</span>
                </label>
                <textarea
                  id={noteId}
                  value={note}
                  maxLength={NOTE_MAX}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
                <p className="text-right text-xs text-zinc-500">
                  {note.length}/{NOTE_MAX}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "cancel" })}
                className={`${btn} border border-zinc-300 dark:border-zinc-700`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={send}
                className={`${btn} bg-red-600 text-white hover:bg-red-700`}
              >
                Sí, enviar
              </button>
            </div>
          </div>
        )}

        {state.phase === "sending" && (
          <div role="status" aria-busy="true" className="space-y-2 py-4 text-center">
            <h2 id={titleId} className="text-lg font-semibold">
              Enviando…
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Avisando por Telegram y verificando la entrega. No cierres esta ventana.
            </p>
          </div>
        )}

        {done && (
          <div className="space-y-4">
            <h2 id={titleId} className="text-lg font-semibold">
              <span aria-hidden="true">{ok ? "✓ " : "⚠ "}</span>
              {done.title}
            </h2>
            {/* Los resultados malos interrumpen al lector de pantalla (alert); el bueno no (status). */}
            <p role={ok ? "status" : "alert"} className="text-sm">
              {done.message}
            </p>
            <div className="flex justify-end gap-2">
              {!ok && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "open" })}
                  className={`${btn} border border-zinc-300 dark:border-zinc-700`}
                >
                  Reintentar
                </button>
              )}
              <button
                type="button"
                // biome-ignore lint/a11y/noAutofocus: al terminar el foco debe quedar en la acción de cerrar, dentro del diálogo
                autoFocus
                onClick={() => dispatch({ type: "close" })}
                className={`${btn} bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900`}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
