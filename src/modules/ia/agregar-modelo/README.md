# Agregar un modelo a tu proyecto

## Qué es

Conectar un modelo de lenguaje a tu aplicación para que haga una tarea concreta (clasificar un ticket, resumir, extraer campos, responder preguntas). El modelo es un **servicio externo no determinista**: puede tardar, fallar, cambiar de versión y responder distinto a la misma pregunta. Por eso se integra como cualquier dependencia incierta: detrás de una interfaz, configurado por entorno, con la salida validada y con un doble para las pruebas.

Los pasos, en orden:

1. **Define la tarea** con entradas y salida exactas («dado un texto, devuelve `{categoria, urgente}`»).
2. **Elige dónde corre el modelo:**

| | Local ([Ollama](/ia/ollama)) | API alojada |
| --- | --- | --- |
| Datos | No salen de tu red | Se envían al proveedor |
| Costo | Hardware propio, sin costo por token | Por uso |
| Calidad en tareas difíciles | Depende del tamaño que quepa en tu equipo | Normalmente mayor |
| Operación | La llevas tú | La lleva el proveedor |

3. **Aísla el modelo** detrás de una interfaz propia.
4. **Configúralo por entorno** (dirección, nombre del modelo, tiempo máximo).
5. **Valida la salida** antes de usarla.
6. **Pruébalo** con un doble y mide con ejemplos reales.

## Cuándo usarla

- La tarea es difusa para reglas fijas (lenguaje natural, formatos variables) y tolera un margen de error.
- Puedes comprobar el resultado (validación de esquema, revisión humana, una regla de respaldo).

## Cuándo no usarla

- Si una regla, una expresión regular o una consulta SQL lo resuelven, úsalas: son más rápidas, baratas y predecibles.
- Si un error del modelo tiene consecuencias graves (dinero, salud, permisos) y no hay verificación: pon una persona en el circuito.
- **Nunca ejecutes ni confíes ciegamente en lo que devuelve.** Si el texto del usuario o un documento entra al *prompt*, puede traer instrucciones que desvíen al modelo (*prompt injection*). Trata su salida como entrada no confiable.
- No mandes datos personales a un proveedor sin base legal ni acuerdo (en Colombia, Ley 1581 de 2012): para eso es útil el modelo local.

## Ejemplo

**1. Interfaz propia.** El resto del código no sabe qué modelo hay detrás.

```ts
export interface ChatModel {
  /** Devuelve el texto completo de la respuesta. */
  complete(prompt: string, opts?: { signal?: AbortSignal }): Promise<string>;
}
```

**2. Configuración por entorno** (con el módulo `config/env` del back o `zod` directo):

```ts
import { z } from "zod";

const env = z
  .object({
    LLM_BASE_URL: z.url().default("http://localhost:11434"),
    LLM_MODEL: z.string().default("llama3.2"),
    LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  })
  .parse(process.env);
```

**3. Implementación local con Ollama**, por la API nativa y sin librerías:

```ts
export function ollamaModel(): ChatModel {
  return {
    async complete(prompt, opts) {
      const res = await fetch(`${env.LLM_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: env.LLM_MODEL,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          format: "json", // pide salida JSON
        }),
        signal: AbortSignal.any([
          AbortSignal.timeout(env.LLM_TIMEOUT_MS),
          ...(opts?.signal ? [opts.signal] : []),
        ]),
      });
      if (!res.ok) throw new Error(`El modelo respondió ${res.status}`);
      const data = (await res.json()) as { message: { content: string } };
      return data.message.content;
    },
  };
}
```

Si más adelante cambias a otro proveedor, escribes otra función que devuelva `ChatModel`; nada más se toca. Como Ollama también habla el formato de OpenAI (`/v1/`), una sola implementación con ese formato puede servir a ambos y el cambio es solo de `LLM_BASE_URL`, la clave y `LLM_MODEL`.

**4. Valida lo que devuelve** antes de usarlo:

```ts
const Clasificacion = z.object({
  categoria: z.enum(["facturacion", "soporte", "otro"]),
  urgente: z.boolean(),
});

export async function clasificar(model: ChatModel, texto: string) {
  const crudo = await model.complete(
    `Clasifica el ticket. Responde solo JSON con "categoria" y "urgente".\nTicket: """${texto}"""`,
  );
  const resultado = Clasificacion.safeParse(JSON.parse(crudo));
  // Si no cumple el esquema: reintenta una vez o cae en una regla de respaldo.
  return resultado.success ? resultado.data : { categoria: "otro" as const, urgente: false };
}
```

(`JSON.parse` también puede lanzar: envuélvelo en `try/catch` en código real.)

**5. Pruébalo con un doble**, sin modelo ni red:

```ts
const falso: ChatModel = { complete: async () => '{"categoria":"soporte","urgente":true}' };
// expect(await clasificar(falso, "No puedo entrar")).toEqual({ categoria: "soporte", urgente: true });
```

**6. Descarga el modelo local una vez** y comprueba que responde:

```bash
ollama pull llama3.2
curl http://localhost:11434/api/chat -d '{"model":"llama3.2","messages":[{"role":"user","content":"hola"}],"stream":false}'
```

Buenas prácticas que evitan sorpresas:

- **Tiempo máximo y cancelación** en cada llamada (arriba: `AbortSignal`).
- **Fija el modelo y su versión** (`nombre:tag`); un cambio de versión puede cambiar los resultados.
- **Conjunto de ejemplos** con respuestas esperadas para comparar modelos o *prompts* antes de cambiar nada.
- **Registra** modelo, versión del *prompt*, duración y si la validación falló; no registres datos personales.
- **No pongas la clave del proveedor en el front:** las llamadas salen del back.

## Alternativas

- **SDK oficial del proveedor** (por ejemplo `ollama` para JavaScript o el SDK de OpenAI apuntando a Ollama): menos código, a cambio de acoplarte a su API.
- **Frameworks de orquestación:** útiles si encadenas varios pasos, herramientas y memoria; excesivos para una tarea única.
- **Salida estructurada nativa** del proveedor (esquema JSON en la petición) en lugar de pedir JSON en el texto; sigue necesitando validación.
- **Modelos para asistir a quien programa** (asistente en el editor, [MCP](/ia/mcp), [Context7](/ia/context7)): es otro caso, no integra un modelo en tu producto.

## Referencias

- [Ollama](/ia/ollama) en este proyecto
- API de chat de Ollama: [docs.ollama.com/api](https://docs.ollama.com/api)
- Zod: [zod.dev](https://zod.dev)
- OWASP: [Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
