const MS_PER_DAY = 86_400_000;
/** Días entre el 1970-01-01 (época Unix) y el 1899-12-30, el "día cero" efectivo de Excel (sistema 1900). */
const EXCEL_1900_EPOCH_OFFSET = 25_569;
/** Excel 1904 (Mac antiguo) arranca 1462 días después. */
const EXCEL_1904_DIFF = 1_462;

export interface ExcelDateOptions {
  /** Libro con el sistema de fechas 1904 (Excel para Mac antiguo). Por defecto `false`. */
  date1904?: boolean;
}

/**
 * Convierte un número de serie de Excel en una `Date` **en UTC**.
 * La parte entera son días y la fracción es la hora (0.5 = 12:00).
 * Excel cuenta por error el 29-feb-1900 (no existió): los seriales 1–59 se corrigen.
 */
export function excelSerialToDate(serial: number, options: ExcelDateOptions = {}): Date {
  if (!Number.isFinite(serial)) throw new RangeError(`Serial de Excel inválido: ${serial}`);
  const base = options.date1904
    ? EXCEL_1900_EPOCH_OFFSET - EXCEL_1904_DIFF
    : EXCEL_1900_EPOCH_OFFSET;
  // Antes del 1-mar-1900 Excel va un día desfasado respecto al calendario real.
  const leapFix = !options.date1904 && serial < 60 ? 1 : 0;
  return new Date(Math.round((serial - base + leapFix) * MS_PER_DAY));
}

/** Operación inversa: `Date` → número de serie (se interpreta en UTC). */
export function dateToExcelSerial(date: Date, options: ExcelDateOptions = {}): number {
  const base = options.date1904
    ? EXCEL_1900_EPOCH_OFFSET - EXCEL_1904_DIFF
    : EXCEL_1900_EPOCH_OFFSET;
  const serial = date.getTime() / MS_PER_DAY + base;
  // Con el desfase aplicado el 28-feb-1900 cae en 60 (el serial 60, 29-feb, no existe en el calendario real).
  return !options.date1904 && serial <= 60 ? serial - 1 : serial;
}

/** `yyyy-mm-dd` en UTC. Usar UTC evita que la zona horaria del navegador mueva la fecha un día. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
