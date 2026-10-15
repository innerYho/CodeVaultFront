export interface LinkStatus {
  /** `false` si el servidor no tiene token del bot: no se puede vincular ni avisar. */
  enabled: boolean;
  linked: boolean;
  username: string | null;
  linkedAt: string | null;
}

/** Resultado real de un envío. Es lo que se verifica antes de decirle a nadie «enviado». */
export interface NotifyReport {
  /** Mensajes entregados por Telegram. */
  delivered: number;
  /** Cuentas con Telegram vinculado a las que no se pudo entregar. */
  failed: number;
  /** Cuentas que no tienen Telegram vinculado. */
  notLinked: number;
}

export interface LinkInfo {
  /** Enlace `t.me/bot?start=código`, de un solo uso. */
  url: string;
  /** Instante ISO en que caduca. */
  expiresAt: string;
}

/**
 * Lo único que la interfaz necesita del backend. Impleméntalo con `fetch` (ver `createTelegramAlertsClient`),
 * con otro protocolo o con un simulacro (ver `createMockTelegramClient`).
 */
export interface TelegramAlertsClient {
  status(): Promise<LinkStatus>;
  createLink(): Promise<LinkInfo>;
  unlink(): Promise<void>;
  /** Mensaje de prueba a la propia cuenta. */
  sendTest(): Promise<NotifyReport>;
  /** Alerta a los destinatarios. `note` opcional, hasta 200 caracteres. */
  sendAlert(note?: string): Promise<NotifyReport>;
}

/** Error con el código que devuelve el backend (`unauthenticated`, `disabled`, `rate_limited`…). */
export class TelegramApiError extends Error {
  constructor(
    readonly code: string,
    readonly status = 0,
    readonly retryAfter?: number,
  ) {
    super(code);
    this.name = "TelegramApiError";
  }
}
