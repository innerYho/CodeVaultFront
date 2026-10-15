import { beforeEach, describe, expect, it } from "vitest";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

describe("theme-store", () => {
  it("setMode('dark') añade la clase dark y persiste", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    });
    const { themeStore, STORAGE_KEY } = await import("./theme-store");
    themeStore.setMode("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    themeStore.setMode("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
