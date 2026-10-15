import { useMemo } from "react";
import { encode } from "uqr";

export interface QrCodeProps {
  /** Texto a codificar (p. ej. una URI `otpauth://`). */
  value: string;
  /** Descripción para lectores de pantalla. */
  label: string;
  /** Lado en píxeles.
   * @default 192 */
  size?: number;
}

/** QR como un único `<path>` SVG, generado en el navegador: el secreto nunca sale a un servicio externo. */
export function QrCode({ value, label, size = 192 }: QrCodeProps) {
  const { path, n } = useMemo(() => {
    const { data, size: n } = encode(value, { border: 2 });
    let path = "";
    for (const [y, row] of data.entries()) {
      for (const [x, on] of row.entries()) if (on) path += `M${x} ${y}h1v1h-1z`;
    }
    return { path, n };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering="crispEdges"
      className="rounded-lg bg-white"
    >
      <path d={path} fill="#000" />
    </svg>
  );
}
