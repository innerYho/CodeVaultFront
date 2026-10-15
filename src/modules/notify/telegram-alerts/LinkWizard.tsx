import { QrCode } from "../../ui/qr-code";
import type { TelegramAlertsClient } from "./types";
import { type UseLinkFlowOptions, useLinkFlow } from "./useLinkFlow";

export interface LinkWizardProps extends UseLinkFlowOptions {
  client: TelegramAlertsClient;
}

const STEPS = ["Generar enlace", "Abrir en Telegram", "Verificación", "Prueba"];
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const btn = "rounded-lg px-4 py-2 text-sm font-medium";
const primary = `${btn} bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50`;
const secondary = `${btn} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`;

/** Índice (0-3) del paso actual del asistente, para el indicador de progreso. */
function stepIndex(phase: string, tested: boolean): number {
  if (phase === "creating" || phase === "idle" || phase === "expired" || phase === "error")
    return 0;
  if (phase === "waiting") return 1; // paso 2 en curso; la verificación (paso 3) corre en paralelo y se anuncia en el texto
  if (phase === "linked") return tested ? 4 : 3;
  return 0;
}

/**
 * Asistente guiado para vincular Telegram: 1) generar enlace, 2) abrirlo y pulsar «Iniciar», 3) verificación
 * automática con cuenta atrás, 4) mensaje de prueba. Ningún paso se da por bueno sin comprobarlo con el servidor.
 */
export function LinkWizard({ client, ...options }: LinkWizardProps) {
  const { state, test, secondsLeft, begin, unlink, runTest } = useLinkFlow(client, options);
  const current = stepIndex(state.phase, test.kind === "result" && test.outcome.kind === "success");

  return (
    <section aria-labelledby="tg-title" className="space-y-4 text-sm">
      <h3 id="tg-title" className="text-base font-semibold">
        Vincular Telegram
      </h3>

      <ol className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Pasos">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === Math.min(current, 3) && current < 4 ? "step" : undefined}
            className={
              i < current
                ? "text-emerald-700 dark:text-emerald-400"
                : i === current
                  ? "font-semibold"
                  : "text-zinc-500"
            }
          >
            <span aria-hidden="true">{i < current ? "✓" : i + 1}. </span>
            {label}
            {i < current && <span className="sr-only"> (completado)</span>}
          </li>
        ))}
      </ol>

      {state.phase === "loading" && <p role="status">Comprobando el estado…</p>}

      {state.phase === "disabled" && (
        <p role="alert" className="rounded-lg border border-amber-500 p-3">
          Telegram no está configurado en el servidor (falta el token del bot). Avisa a Sistemas.
        </p>
      )}

      {(state.phase === "idle" || state.phase === "expired" || state.phase === "creating") && (
        <div className="space-y-3">
          {state.phase === "expired" && (
            <p role="alert" className="rounded-lg border border-amber-500 p-3">
              El enlace caducó. Genera uno nuevo.
            </p>
          )}
          <p>
            Recibirás las alertas en tu Telegram. Es un proceso de 4 pasos y tarda menos de un
            minuto.
          </p>
          <button
            type="button"
            onClick={begin}
            disabled={state.phase === "creating"}
            className={primary}
          >
            {state.phase === "creating"
              ? "Generando…"
              : state.phase === "expired"
                ? "Generar nuevo enlace"
                : "Empezar"}
          </button>
        </div>
      )}

      {state.phase === "waiting" && (
        <div className="space-y-3">
          <p>
            <strong>Paso 2.</strong> Abre este enlace en Telegram y pulsa <strong>«Iniciar»</strong>{" "}
            (o <em>Start</em>). En el móvil, escanea el código.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <QrCode value={state.url} label="Código QR para abrir el bot de Telegram" size={160} />
            <div className="space-y-2">
              <a
                href={state.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-indigo-600 underline dark:text-indigo-400"
              >
                Abrir Telegram<span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
              <p role="timer" aria-live="off" className="text-zinc-600 dark:text-zinc-400">
                El enlace caduca en <strong>{clock(secondsLeft)}</strong>
              </p>
            </div>
          </div>
          <p role="status" className="text-zinc-600 dark:text-zinc-400">
            <strong>Paso 3.</strong> Esperando a que pulses «Iniciar»… (se verifica solo, no
            recargues)
          </p>
        </div>
      )}

      {state.phase === "linked" && (
        <div className="space-y-3">
          <p role="status" className="rounded-lg border border-emerald-600 p-3">
            ✓ Telegram vinculado
            {state.username ? (
              <>
                {" "}
                como <strong>@{state.username}</strong>
              </>
            ) : null}
            .
          </p>
          <p>
            <strong>Paso 4.</strong> Comprueba que funciona: te enviaremos un mensaje de prueba.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runTest}
              disabled={test.kind === "sending"}
              className={primary}
            >
              {test.kind === "sending" ? "Enviando…" : "Enviar mensaje de prueba"}
            </button>
            <button type="button" onClick={unlink} className={secondary}>
              Desvincular
            </button>
          </div>
          {test.kind === "result" && (
            <p
              role={test.outcome.kind === "success" ? "status" : "alert"}
              className={`rounded-lg border p-3 ${test.outcome.kind === "success" ? "border-emerald-600" : "border-amber-500"}`}
            >
              <strong>{test.outcome.title}.</strong> {test.outcome.message}
            </p>
          )}
        </div>
      )}

      {state.phase === "error" && (
        <div className="space-y-3">
          <p role="alert" className="rounded-lg border border-red-500 p-3">
            <strong>{state.outcome.title}.</strong> {state.outcome.message}
          </p>
          <button type="button" onClick={begin} className={secondary}>
            Intentar de nuevo
          </button>
        </div>
      )}
    </section>
  );
}
