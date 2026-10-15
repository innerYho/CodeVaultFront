import { type ComponentPropsWithoutRef, useId } from "react";
import { type SanitizeOptions, sanitizeNumeric } from "./sanitize";

export interface NumericInputProps
  extends SanitizeOptions,
    Omit<
      ComponentPropsWithoutRef<"input">,
      "value" | "onChange" | "type" | "inputMode" | "maxLength"
    > {
  /** Etiqueta visible, asociada al campo. */
  label: string;
  /** Valor actual como texto (se conservan ceros a la izquierda: documentos, teléfonos). */
  value: string;
  /** Se llama con el texto ya limpio. */
  onValueChange: (value: string) => void;
  /** Texto de ayuda o de error, enlazado con `aria-describedby`. */
  hint?: string;
  /** Marca el campo como inválido. */
  invalid?: boolean;
}

export function NumericInput({
  label,
  value,
  onValueChange,
  hint,
  invalid,
  decimal,
  maxLength,
  id,
  className,
  ...rest
}: NumericInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete={rest.autoComplete ?? "off"}
        value={value}
        maxLength={undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={hint ? hintId : undefined}
        onChange={(e) => onValueChange(sanitizeNumeric(e.target.value, { decimal, maxLength }))}
        className={
          className ??
          "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 aria-[invalid=true]:border-red-500 dark:border-zinc-700 dark:bg-zinc-900"
        }
      />
      {hint && (
        <p id={hintId} className="text-xs text-zinc-500">
          {hint}
        </p>
      )}
    </div>
  );
}
