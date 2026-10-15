import { type NotifyReport, TelegramApiError } from "./types";

export type OutcomeKind = "success" | "partial" | "failed" | "nobody" | "error";

export interface Outcome {
  kind: OutcomeKind;
  title: string;
  message: string;
}

/**
 * Convierte el resultado REAL del envío en lo que se le dice a la persona.
 *
 * Es el corazón de la verificación: un servidor puede responder 200 aunque no se haya avisado a nadie (pasó en
 * producción en Hydra: se mostró «enviada» sin que llegara a ninguna persona). Nunca se muestra éxito sin
 * `delivered > 0`, y cada combinación tiene su propio mensaje.
 */
export function classifyReport(r: NotifyReport): Outcome {
  if (r.delivered > 0 && r.failed === 0) {
    return {
      kind: "success",
      title: "Alerta enviada",
      message:
        r.delivered === 1
          ? "Se avisó a 1 persona por Telegram."
          : `Se avisó a ${r.delivered} personas por Telegram.`,
    };
  }
  if (r.delivered > 0) {
    return {
      kind: "partial",
      title: "Alerta enviada solo a una parte",
      message: `Se avisó a ${r.delivered} persona(s), pero no se pudo entregar a ${r.failed}. Si es urgente, avisa también por otro medio.`,
    };
  }
  if (r.failed > 0) {
    return {
      kind: "failed",
      title: "No se pudo entregar la alerta",
      message: `Telegram no entregó el aviso a ninguna de las ${r.failed} persona(s) que lo tienen vinculado. Avisa por otro medio y repórtalo a Sistemas.`,
    };
  }
  return {
    kind: "nobody",
    title: "Nadie fue notificado",
    message:
      "No hay ninguna persona con Telegram vinculado a quien avisar. La alerta NO llegó a nadie: avisa por otro medio y repórtalo a Sistemas.",
  };
}

/** Mensaje para errores de la petición (red, sesión, límite, configuración). */
export function classifyError(error: unknown): Outcome {
  const e = error instanceof TelegramApiError ? error : new TelegramApiError("unknown_error");
  const messages: Record<string, string> = {
    network_error: "No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
    unauthenticated: "Tu sesión caducó. Vuelve a iniciar sesión.",
    disabled: "Telegram no está configurado en el servidor. Avisa a Sistemas.",
    bot_unavailable:
      "No se pudo contactar con Telegram en este momento. Inténtalo de nuevo en un minuto.",
    bad_request: "El mensaje no es válido (máximo 200 caracteres).",
    rate_limited: e.retryAfter
      ? `Ya enviaste una alerta hace poco. Podrás enviar otra en ${e.retryAfter} segundos.`
      : "Ya enviaste una alerta hace poco. Espera un momento antes de enviar otra.",
  };
  return {
    kind: "error",
    title: "No se pudo enviar la alerta",
    message: messages[e.code] ?? "Ocurrió un error inesperado. Inténtalo de nuevo.",
  };
}
