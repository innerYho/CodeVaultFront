import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef } from "react";

export interface OtpInputProps {
  /** Valor actual: solo dígitos, longitud ≤ `length`. */
  value: string;
  onChange: (value: string) => void;
  /** Se llama una vez cuando el usuario completa todos los dígitos. */
  onComplete?: (value: string) => void;
  /** Cantidad de casillas.
   * @default 6 */
  length?: number;
  disabled?: boolean;
  /** Marca el campo como erróneo (borde rojo y `aria-invalid`). */
  invalid?: boolean;
  autoFocus?: boolean;
  /** Etiqueta accesible del grupo.
   * @default "Código de verificación" */
  label?: string;
}

const digitsOf = (s: string) => s.replace(/\D/g, "");

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  autoFocus,
  label = "Código de verificación",
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const filled = useRef(value.length);
  filled.current = value.length;

  // Enfoca al montar y al volver a habilitarse (un campo `disabled` pierde el foco al enviar).
  useEffect(() => {
    if (autoFocus && !disabled) refs.current[Math.min(filled.current, length - 1)]?.focus();
  }, [autoFocus, disabled, length]);

  const focusBox = (i: number) => refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  const commit = (next: string) => {
    const v = next.slice(0, length);
    onChange(v);
    focusBox(v.length);
    if (v.length === length && v !== value) onComplete?.(v);
  };

  const onType = (i: number, raw: string) => {
    const d = digitsOf(raw);
    if (!d) return;
    // Un solo dígito sobrescribe la casilla; varios (autocompletado del SO) rellenan desde ahí.
    const at = Math.min(i, value.length);
    commit(
      d.length === 1
        ? value.slice(0, at) + d + value.slice(at + (i < value.length ? 1 : 0))
        : value.slice(0, at) + d,
    );
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const at = i < value.length ? i : value.length - 1;
      if (at < 0) return;
      onChange(value.slice(0, at) + value.slice(at + 1));
      focusBox(at);
    } else if (e.key === "ArrowLeft") focusBox(i - 1);
    else if (e.key === "ArrowRight") focusBox(i + 1);
  };

  const onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const d = digitsOf(e.clipboardData.getData("text"));
    if (d) commit(d); // un código pegado reemplaza todo el valor
  };

  return (
    <fieldset className="m-0 flex min-w-0 gap-2 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      {Array.from({ length }, (_, i) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: las casillas son posiciones fijas, no una lista reordenable.
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length} // permite que el autocompletado entregue el código entero
          autoComplete={i === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          aria-label={`${label}, dígito ${i + 1} de ${length}`}
          aria-invalid={invalid || undefined}
          value={value[i] ?? ""}
          onChange={(e) => onType(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => {
            if (i > value.length)
              focusBox(value.length); // no se puede dejar huecos
            else e.target.select();
          }}
          className={`size-12 rounded-lg border bg-white text-center text-xl font-semibold tabular-nums text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-100 ${invalid ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"}`}
        />
      ))}
    </fieldset>
  );
}
