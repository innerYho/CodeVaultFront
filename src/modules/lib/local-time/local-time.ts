export interface LocalTimeOptions {
  /** Idioma de formato. Por defecto el del navegador. */
  locale?: string;
  /** Zona IANA (`America/Bogota`). Por defecto la del dispositivo. */
  timeZone?: string;
  /** Añade la fecha antes de la hora. */
  withDate?: boolean;
  /** Muestra la zona (`GMT-5`). Por defecto `true`. */
  withZone?: boolean;
}

/** Zona horaria IANA del dispositivo (p. ej. `America/Bogota`). */
export function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Formatea un instante (ms desde 1970, `Date` o texto ISO) en la zona de quien lo ve. */
export function formatLocalTime(
  instant: number | string | Date,
  { locale, timeZone, withDate = false, withZone = true }: LocalTimeOptions = {},
): string {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Fecha inválida: ${String(instant)}`);
  return new Intl.DateTimeFormat(locale, {
    ...(withDate && { year: "numeric", month: "short", day: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
    ...(withZone && { timeZoneName: "short" }),
    timeZone,
  } as Intl.DateTimeFormatOptions).format(date);
}
