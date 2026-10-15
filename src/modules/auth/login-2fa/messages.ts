export type Messages = Record<string, string>;

export const defaultMessages: Messages = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  invalid_code: "Código incorrecto. Revisa tu app e inténtalo de nuevo.",
  invalid_challenge: "La verificación expiró. Inicia sesión de nuevo.",
  locked: "Demasiados intentos. Cuenta bloqueada temporalmente.",
  rate_limited: "Demasiadas peticiones. Espera un momento.",
  network_error: "No se pudo conectar con el servidor.",
  already_enabled: "La verificación en dos pasos ya está activa.",
  unknown_error: "Algo salió mal. Inténtalo de nuevo.",
};

export function messageFor(
  code: string,
  retryAfter: number | undefined,
  custom?: Messages,
): string {
  const base =
    { ...defaultMessages, ...custom }[code] ??
    ((custom?.unknown_error ?? defaultMessages.unknown_error) as string);
  return retryAfter ? `${base} Reintenta en ${Math.ceil(retryAfter / 60)} min.` : base;
}
