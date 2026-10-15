import { useEffect, useRef } from "react";

export interface Hotkey {
  key: string;
  /** Cmd en macOS, Ctrl en el resto. */
  mod: boolean;
  shift: boolean;
  alt: boolean;
}

/** Convierte "mod+shift+k" en un objeto comparable. Lanza si el atajo no tiene tecla. */
export function parseHotkey(combo: string): Hotkey {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  const key = parts
    .filter((p) => !["mod", "ctrl", "cmd", "meta", "shift", "alt", "option"].includes(p))
    .at(-1);
  if (!key) throw new Error(`Atajo inválido: "${combo}"`);
  return {
    key,
    mod: parts.some((p) => ["mod", "ctrl", "cmd", "meta"].includes(p)),
    shift: parts.includes("shift"),
    alt: parts.includes("alt") || parts.includes("option"),
  };
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
}

export function matchesHotkey(e: KeyboardEvent, hk: Hotkey, mac = isMacPlatform()): boolean {
  const modPressed = mac ? e.metaKey : e.ctrlKey;
  const strayMod = mac ? e.ctrlKey : e.metaKey; // el modificador "del otro sistema" no debe estar pulsado
  return (
    e.key.toLowerCase() === hk.key &&
    modPressed === hk.mod &&
    !strayMod &&
    e.shiftKey === hk.shift &&
    e.altKey === hk.alt
  );
}

/** Texto para mostrar el atajo al usuario: "⌘K" o "Ctrl+K". */
export function formatHotkey(combo: string, mac = isMacPlatform()): string {
  const hk = parseHotkey(combo);
  const key = hk.key.length === 1 ? hk.key.toUpperCase() : hk.key;
  const mods = [
    hk.mod && (mac ? "⌘" : "Ctrl"),
    hk.alt && (mac ? "⌥" : "Alt"),
    hk.shift && (mac ? "⇧" : "Shift"),
  ].filter(Boolean);
  return mac ? mods.join("") + key : [...mods, key].join("+");
}

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

export interface UseHotkeyOptions {
  /** @default true */
  enabled?: boolean;
  /** Dispara también al escribir en un campo de texto. Los atajos con `mod` ya lo hacen; los de una sola tecla (p. ej. "/") no, salvo que lo actives.
   * @default false */
  allowInInputs?: boolean;
  /** @default true */
  preventDefault?: boolean;
}

/** Registra un atajo global mientras el componente está montado. */
export function useHotkey(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  { enabled = true, allowInInputs = false, preventDefault = true }: UseHotkeyOptions = {},
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler; // siempre el último, sin volver a suscribir en cada render

  useEffect(() => {
    if (!enabled) return;
    const hk = parseHotkey(combo);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || !matchesHotkey(e, hk)) return;
      if (!allowInInputs && !hk.mod && !hk.alt && isEditable(e.target)) return;
      if (preventDefault) e.preventDefault();
      handlerRef.current(e);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, enabled, allowInInputs, preventDefault]);
}
