export interface SseMessage {
  /** Nombre del evento (`event:`); `message` si no lo trae. */
  event: string;
  data: string;
}

/**
 * Lector incremental de *Server-Sent Events*. Se alimenta con trozos de texto de cualquier
 * tamaño (un mensaje puede llegar partido por la mitad) y devuelve los mensajes completos.
 * Sigue el formato del estándar: líneas `campo: valor`, comentarios con `:`, líneas `data`
 * múltiples unidas con `\n`, mensajes separados por una línea en blanco.
 */
export class SseParser {
  private buffer = "";
  private event = "";
  private data: string[] = [];

  push(chunk: string): SseMessage[] {
    this.buffer += chunk;
    const out: SseMessage[] = [];
    // Un `\r` final puede ser la mitad de un `\r\n`: se espera al siguiente trozo.
    const parts = this.buffer.split(/\r\n|\n|\r(?!$)/);
    this.buffer = parts.pop() ?? "";

    for (const line of parts) {
      if (line === "") {
        if (this.data.length > 0)
          out.push({ event: this.event || "message", data: this.data.join("\n") });
        this.event = "";
        this.data = [];
        continue;
      }
      if (line.startsWith(":")) continue; // comentario (latidos)
      const colon = line.indexOf(":");
      const field = colon === -1 ? line : line.slice(0, colon);
      let value = colon === -1 ? "" : line.slice(colon + 1);
      if (value.startsWith(" ")) value = value.slice(1);
      if (field === "event") this.event = value;
      else if (field === "data") this.data.push(value);
    }
    return out;
  }
}
