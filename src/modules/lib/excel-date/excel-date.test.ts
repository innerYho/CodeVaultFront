import { describe, expect, it } from "vitest";
import { dateToExcelSerial, excelSerialToDate, toIsoDate } from "./excel-date";

const iso = (n: number, o?: { date1904?: boolean }) => toIsoDate(excelSerialToDate(n, o));

describe("excelSerialToDate", () => {
  it("convierte fechas conocidas", () => {
    expect(iso(61)).toBe("1900-03-01");
    expect(iso(25569)).toBe("1970-01-01");
    expect(iso(42510)).toBe("2016-05-20");
    expect(iso(45292)).toBe("2024-01-01");
    expect(iso(45716)).toBe("2025-02-28");
  });
  it("corrige el desfase de enero y febrero de 1900", () => {
    expect(iso(1)).toBe("1900-01-01");
    expect(iso(59)).toBe("1900-02-28");
  });
  it("interpreta la fracción como hora", () => {
    const d = excelSerialToDate(45292.5);
    expect(d.toISOString()).toBe("2024-01-01T12:00:00.000Z");
    expect(excelSerialToDate(45292.75).toISOString()).toBe("2024-01-01T18:00:00.000Z");
  });
  it("redondea al milisegundo sin errores de coma flotante", () => {
    expect(excelSerialToDate(45292 + 1 / 86400).toISOString()).toBe("2024-01-01T00:00:01.000Z");
  });
  it("soporta el sistema 1904", () => {
    expect(iso(0, { date1904: true })).toBe("1904-01-01");
    expect(iso(43830, { date1904: true })).toBe("2024-01-01");
  });
  it("rechaza valores que no son números", () => {
    expect(() => excelSerialToDate(Number.NaN)).toThrow(RangeError);
    expect(() => excelSerialToDate(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
  it("no depende de la zona horaria del proceso", () => {
    const original = process.env.TZ;
    process.env.TZ = "America/Bogota";
    expect(iso(45292)).toBe("2024-01-01");
    process.env.TZ = original;
  });
});

describe("dateToExcelSerial", () => {
  it("es la inversa de excelSerialToDate", () => {
    for (const n of [1, 59, 61, 25569, 42510.25, 45292, 45716.5]) {
      expect(dateToExcelSerial(excelSerialToDate(n))).toBeCloseTo(n, 6);
    }
    expect(
      dateToExcelSerial(excelSerialToDate(43830, { date1904: true }), { date1904: true }),
    ).toBe(43830);
  });
});
