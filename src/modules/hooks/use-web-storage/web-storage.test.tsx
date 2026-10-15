import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readRaw, useLocalStorage, useSessionStorage } from "./web-storage";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("useLocalStorage", () => {
  it("devuelve el valor inicial y lo lee de localStorage si existe", () => {
    expect(renderHook(() => useLocalStorage("k1", 5)).result.current[0]).toBe(5);
    localStorage.setItem("k2", JSON.stringify({ a: 1 }));
    expect(renderHook(() => useLocalStorage("k2", { a: 0 })).result.current[0]).toEqual({ a: 1 });
  });

  it("persiste lo que se guarda", () => {
    const { result } = renderHook(() => useLocalStorage("k3", 0));
    act(() => result.current[1](7));
    expect(result.current[0]).toBe(7);
    expect(localStorage.getItem("k3")).toBe("7");
  });

  it("acepta una función y dos llamadas seguidas suman dos veces", () => {
    const { result } = renderHook(() => useLocalStorage("k4", 0));
    act(() => {
      result.current[1]((v) => v + 1);
      result.current[1]((v) => v + 1);
    });
    expect(result.current[0]).toBe(2);
  });

  it("sincroniza dos componentes con la misma clave", () => {
    const a = renderHook(() => useLocalStorage("k5", "x"));
    const b = renderHook(() => useLocalStorage("k5", "x"));
    act(() => a.result.current[1]("y"));
    expect(b.result.current[0]).toBe("y");
  });

  it("reacciona al evento storage de otra pestaña", () => {
    const { result } = renderHook(() => useLocalStorage("k6", "a"));
    act(() => {
      localStorage.setItem("k6", JSON.stringify("desde otra pestaña"));
      window.dispatchEvent(new StorageEvent("storage", { key: "k6" }));
    });
    expect(result.current[0]).toBe("desde otra pestaña");
  });

  it("usa el valor inicial si el JSON está corrupto", () => {
    localStorage.setItem("k7", "{no es json");
    expect(renderHook(() => useLocalStorage("k7", "ok")).result.current[0]).toBe("ok");
  });

  it("borra y vuelve al valor inicial", () => {
    localStorage.setItem("k8", "9");
    const { result } = renderHook(() => useLocalStorage("k8", 1));
    expect(result.current[0]).toBe(9);
    act(() => result.current[2]());
    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem("k8")).toBeNull();
  });

  it("sigue funcionando en memoria si localStorage lanza", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { result } = renderHook(() => useLocalStorage("k9", 0));
    act(() => result.current[1](3));
    expect(result.current[0]).toBe(3);
  });

  it("no re-renderiza cuando no cambia nada", () => {
    let renders = 0;
    function C() {
      renders++;
      useLocalStorage("k10", { a: 1 });
      return null;
    }
    render(<C />);
    const before = renders;
    fireEvent(window, new StorageEvent("storage", { key: "otra" }));
    expect(renders).toBe(before);
  });

  it("acepta serializadores propios", () => {
    const opts = {
      serialize: (d: Date) => d.toISOString(),
      deserialize: (s: string) => new Date(s),
    };
    const { result } = renderHook(() => useLocalStorage("k11", new Date(0), opts));
    act(() => result.current[1](new Date("2024-01-01T00:00:00Z")));
    expect(localStorage.getItem("k11")).toBe("2024-01-01T00:00:00.000Z");
    expect(result.current[0].getUTCFullYear()).toBe(2024);
  });
});

describe("useSessionStorage", () => {
  it("guarda en sessionStorage y no en localStorage", () => {
    const { result } = renderHook(() => useSessionStorage("s1", 0));
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(sessionStorage.getItem("s1")).toBe("5");
    expect(localStorage.getItem("s1")).toBeNull();
  });

  it("la misma clave en local y en session no se pisa", () => {
    const l = renderHook(() => useLocalStorage("dup", "local"));
    const s = renderHook(() => useSessionStorage("dup", "session"));
    act(() => l.result.current[1]("L"));
    expect(s.result.current[0]).toBe("session");
    act(() => s.result.current[1]("S"));
    expect(l.result.current[0]).toBe("L");
    expect(readRaw("dup", "local")).toBe('"L"');
    expect(readRaw("dup", "session")).toBe('"S"');
  });

  it("sincroniza componentes de la misma pestaña y borra", () => {
    const a = renderHook(() => useSessionStorage("s2", 1));
    const b = renderHook(() => useSessionStorage("s2", 1));
    act(() => a.result.current[1](9));
    expect(b.result.current[0]).toBe(9);
    act(() => b.result.current[2]());
    expect(a.result.current[0]).toBe(1);
    expect(sessionStorage.getItem("s2")).toBeNull();
  });

  it("lee lo que ya había (sobrevive a recargar) y tolera JSON corrupto", () => {
    sessionStorage.setItem("s3", JSON.stringify({ paso: 2 }));
    expect(renderHook(() => useSessionStorage("s3", { paso: 0 })).result.current[0]).toEqual({
      paso: 2,
    });
    sessionStorage.setItem("s4", "{roto");
    expect(renderHook(() => useSessionStorage("s4", "ok")).result.current[0]).toBe("ok");
  });

  it("sigue funcionando en memoria si sessionStorage lanza", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { result } = renderHook(() => useSessionStorage("s5", 0));
    act(() => result.current[1](4));
    expect(result.current[0]).toBe(4);
  });
});
