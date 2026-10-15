import { describe, expect, it } from "vitest";
import { formatLocalTime, getTimeZone } from "./local-time";

// 2024-03-04T18:00:00Z
const T = 1709575200000;

describe("formatLocalTime", () => {
  it("muestra la misma hora en la zona de cada persona", () => {
    expect(formatLocalTime(T, { locale: "en-US", timeZone: "America/Bogota" })).toMatch(
      /1:00\s?PM GMT-5/,
    );
    expect(formatLocalTime(T, { locale: "en-US", timeZone: "Europe/Madrid" })).toMatch(
      /7:00\s?PM GMT\+1/,
    );
  });
  it("acepta Date y texto ISO", () => {
    const a = formatLocalTime(new Date(T), { locale: "en-US", timeZone: "UTC" });
    const b = formatLocalTime("2024-03-04T18:00:00Z", { locale: "en-US", timeZone: "UTC" });
    expect(a).toBe(b);
  });
  it("puede omitir la zona y añadir la fecha", () => {
    const s = formatLocalTime(T, {
      locale: "en-US",
      timeZone: "UTC",
      withZone: false,
      withDate: true,
    });
    expect(s).toContain("Mar 4, 2024");
    expect(s).not.toContain("UTC");
  });
  it("rechaza fechas inválidas", () => {
    expect(() => formatLocalTime("no es fecha")).toThrow(RangeError);
  });
  it("getTimeZone devuelve una zona IANA", () => {
    expect(getTimeZone()).toMatch(/^[A-Za-z_]+(\/[A-Za-z_]+)*$/);
  });
});
