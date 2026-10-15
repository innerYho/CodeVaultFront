import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formatHotkey, matchesHotkey, parseHotkey, useHotkey } from "./use-hotkey";

const key = (init: KeyboardEventInit & { key: string }) => new KeyboardEvent("keydown", init);

describe("parseHotkey / matchesHotkey", () => {
  it("mod es Cmd en macOS y Ctrl en el resto", () => {
    const hk = parseHotkey("mod+k");
    expect(matchesHotkey(key({ key: "k", metaKey: true }), hk, true)).toBe(true);
    expect(matchesHotkey(key({ key: "k", ctrlKey: true }), hk, true)).toBe(false);
    expect(matchesHotkey(key({ key: "k", ctrlKey: true }), hk, false)).toBe(true);
  });
  it("exige que los modificadores coincidan exactamente", () => {
    expect(
      matchesHotkey(key({ key: "k", ctrlKey: true, shiftKey: true }), parseHotkey("mod+k"), false),
    ).toBe(false);
    expect(
      matchesHotkey(
        key({ key: "K", ctrlKey: true, shiftKey: true }),
        parseHotkey("mod+shift+k"),
        false,
      ),
    ).toBe(true);
    expect(matchesHotkey(key({ key: "/" }), parseHotkey("/"), false)).toBe(true);
  });
  it("rechaza un atajo sin tecla", () => {
    expect(() => parseHotkey("mod+")).toThrow();
  });
});

describe("formatHotkey", () => {
  it("usa símbolos en macOS y texto en el resto", () => {
    expect(formatHotkey("mod+k", true)).toBe("⌘K");
    expect(formatHotkey("mod+shift+k", false)).toBe("Ctrl+Shift+K");
  });
});

function Harness({
  combo,
  onHit,
  ...opts
}: {
  combo: string;
  onHit: () => void;
  allowInInputs?: boolean;
  enabled?: boolean;
}) {
  useHotkey(combo, onHit, opts);
  return <input aria-label="campo" />;
}

describe("useHotkey", () => {
  it("dispara el atajo y cancela el comportamiento por defecto", () => {
    const onHit = vi.fn();
    render(<Harness combo="ctrl+k" onHit={onHit} />);
    const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, cancelable: true });
    window.dispatchEvent(ev);
    expect(onHit).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(true);
  });
  it("una sola tecla no se activa al escribir en un campo, salvo allowInInputs", () => {
    const onHit = vi.fn();
    const { getByLabelText, rerender } = render(<Harness combo="/" onHit={onHit} />);
    fireEvent.keyDown(getByLabelText("campo"), { key: "/" });
    expect(onHit).not.toHaveBeenCalled();
    rerender(<Harness combo="/" onHit={onHit} allowInInputs />);
    fireEvent.keyDown(getByLabelText("campo"), { key: "/" });
    expect(onHit).toHaveBeenCalledTimes(1);
  });
  it("no se activa si está deshabilitado y se limpia al desmontar", () => {
    const onHit = vi.fn();
    const { unmount, rerender } = render(<Harness combo="ctrl+k" onHit={onHit} enabled={false} />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(onHit).not.toHaveBeenCalled();
    rerender(<Harness combo="ctrl+k" onHit={onHit} />);
    unmount();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(onHit).not.toHaveBeenCalled();
  });
});
