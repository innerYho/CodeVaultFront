# Context7

## Qué es

Un servidor [MCP](/ia/mcp) que, cuando le pides ayuda con una librería, busca su documentación **vigente** (y de la versión que mencionas) y la inyecta en el contexto del modelo. Resuelve un problema concreto: los modelos se entrenan con una foto del pasado y pueden sugerir APIs que cambiaron, que ya no existen o que nunca existieron. Con Context7 el modelo escribe el código mirando la documentación actual en lugar de recordarla.

Expone dos herramientas:

| Herramienta | Parámetros | Qué hace |
| --- | --- | --- |
| `resolve-library-id` | `query` y `libraryName` (obligatorios) | Convierte un nombre («react», «hono») en un identificador de librería de Context7 |
| `query-docs` | `libraryId` y `query` (obligatorios); `language` (opcional) | Devuelve fragmentos de documentación y ejemplos de esa librería; `language` ordena primero los ejemplos en ese lenguaje |

## Cuándo usarla

- Trabajas con librerías que cambian rápido o con versiones recientes (en este proyecto: React 19, Tailwind 4, Vite 8, Hono, Drizzle) y quieres menos código desactualizado.
- Vas a generar configuración o código de una librería que el modelo conoce poco.
- Quieres que el asistente cite la documentación real antes de proponer un cambio.

## Cuándo no usarla

- La respuesta no depende de documentación externa (lógica de tu propio código, refactors, depuración): no aporta y gasta contexto.
- Librerías internas o privadas: Context7 indexa documentación pública. Para lo tuyo, usa tu `README` o `CLAUDE.md`.
- Entornos sin salida a internet o con restricciones de privacidad: las consultas viajan a un servicio externo.
- No sustituye leer la documentación cuando hay una decisión importante: es una ayuda para el asistente, no una garantía.

## Ejemplo

Instalación guiada (necesita Node.js 22.13 o superior; autentica por OAuth, genera una clave de API e instala una *skill*):

```bash
npx ctx7 setup --claude
# Para deshacerlo: npx ctx7 remove
```

O manualmente, como servidor MCP remoto (clave gratuita en `context7.com/dashboard`):

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp \
  --header "Authorization: Bearer $CONTEXT7_API_KEY"
```

Cómo pedirlo en un prompt:

```text
Configura un middleware de rate limit en Hono. use context7

Usa Tailwind 4 para el tema oscuro. use library /tailwindlabs/tailwindcss
```

- **`use context7`** al final del prompt: el asistente resuelve la librería y consulta la documentación.
- **`use library /org/proyecto`**: salta la búsqueda y va directo a ese identificador.
- Para fijar una versión, menciónala en el prompt («Next.js 16»).
- Para que se use sin pedirlo, añade una regla a `CLAUDE.md` indicando que consulte Context7 ante preguntas de librerías, generación de código y configuración.

## Alternativas

- **Pegar la documentación en el prompt** o dejarla en el repositorio (`docs/`): sin dependencias externas, pero la mantienes tú.
- **Búsqueda web del asistente:** más general y menos precisa; mezcla fuentes de calidad desigual.
- **Otros servidores MCP de documentación**, o un servidor propio que sirva tu documentación interna (ver [MCP](/ia/mcp)).

## Referencias

- Repositorio: [github.com/upstash/context7](https://github.com/upstash/context7)
- Guía de MCP de este proyecto: [MCP](/ia/mcp)
