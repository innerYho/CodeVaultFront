export interface SanitizeOptions {
  /** Permite un separador decimal (`.` o `,`, se normaliza a `.`). */
  decimal?: boolean;
  /** Longitud máxima del resultado. */
  maxLength?: number;
}

/** Deja solo dígitos (y un decimal si se permite). Funciona con texto escrito o pegado. */
export function sanitizeNumeric(
  text: string,
  { decimal = false, maxLength }: SanitizeOptions = {},
) {
  let out = "";
  let seenSeparator = false;
  for (const ch of text.normalize("NFKC")) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (decimal && (ch === "." || ch === ",") && !seenSeparator) {
      seenSeparator = true;
      out += ".";
    }
  }
  return maxLength === undefined ? out : out.slice(0, maxLength);
}
