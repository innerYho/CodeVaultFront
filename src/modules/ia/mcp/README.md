# MCP (Model Context Protocol)

## Qué es

Un protocolo abierto para que un asistente de IA (el **cliente**, p. ej. Claude Code) hable con herramientas y fuentes de datos (los **servidores**) de forma estándar. Sin MCP, cada integración (GitHub, una base de datos, un buscador de documentación) se programa a medida para cada asistente; con MCP, un servidor escrito una vez sirve a cualquier cliente compatible.

Un servidor puede ofrecer tres cosas: **herramientas** (acciones que el modelo puede invocar), **recursos** (datos que se pueden leer) y **prompts** (plantillas reutilizables). Se comunica por uno de estos transportes:

| Transporte | Dónde corre el servidor | Cuándo |
| --- | --- | --- |
| `http` | En remoto (una URL) | Servicios alojados; es el recomendado para servidores remotos |
| `stdio` | Como proceso local de tu máquina | Herramientas que necesitan tus archivos o credenciales locales |
| `sse` | En remoto | Obsoleto: usa `http` si el servidor lo admite |

En Claude Code cada servidor se registra en uno de tres **alcances**:

| Alcance | Flag | Dónde se guarda | ¿Se comparte? |
| --- | --- | --- | --- |
| `local` (por defecto) | `--scope local` | `~/.claude.json`, bajo la ruta del proyecto | No |
| `project` | `--scope project` | `.mcp.json` en la raíz del proyecto | Sí, por git |
| `user` | `--scope user` | `~/.claude.json` | No, pero vale para todos tus proyectos |

Si un nombre se repite, gana `local`, luego `project` y luego `user`.

## Cuándo usarla

- Quieres que el asistente **consulte o actúe** sobre un sistema externo bajo demanda: documentación de librerías ([Context7](/ia/context7)), issues, bases de datos, navegador, diseño.
- Varias personas del equipo necesitan la misma integración: se declara en `.mcp.json` (alcance `project`) y se versiona.
- Ya existe un servidor mantenido por el proveedor del servicio: es más barato que escribir un script propio.

## Cuándo no usarla

- Para una acción puntual y local basta con que el asistente ejecute un comando o un script; un servidor MCP es sobreingeniería.
- Si necesitas **empujar** eventos hacia una sesión abierta (un aviso de CI, un mensaje de chat), un servidor MCP normal no lo hace: el asistente solo lo consulta. Para eso existen los *channels* (ver [Telegram](/ia/telegram)).
- **No instales servidores de terceros sin revisarlos.** Un servidor `stdio` ejecuta código en tu máquina, y el texto que devuelve cualquier servidor entra al contexto del modelo: puede contener instrucciones maliciosas (*prompt injection*). Claude Code pide aprobación para los servidores de `.mcp.json` en sesiones interactivas.
- No pongas secretos en `.mcp.json`: usa variables de entorno (`${VAR}`).

## Ejemplo

```bash
# Servidor remoto por HTTP
claude mcp add --transport http mi-api https://api.ejemplo.com/mcp \
  --header "Authorization: Bearer $MI_TOKEN"

# Servidor local por stdio (el "--" separa las opciones de Claude del comando)
claude mcp add --env AIRTABLE_API_KEY=TU_CLAVE --transport stdio airtable \
  -- npx -y airtable-mcp-server

# Compartido con el equipo (queda en .mcp.json)
claude mcp add --transport http compartido --scope project https://ejemplo.com/mcp

claude mcp list            # servidores y estado de salud
claude mcp get mi-api      # detalle de uno
claude mcp remove mi-api   # quitarlo
```

El equivalente en `.mcp.json`, con los secretos como variables de entorno:

```json
{
  "mcpServers": {
    "mi-api": {
      "type": "http",
      "url": "https://api.ejemplo.com/mcp",
      "headers": { "Authorization": "Bearer ${MI_TOKEN}" }
    },
    "airtable": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "airtable-mcp-server"],
      "env": { "AIRTABLE_API_KEY": "${AIRTABLE_API_KEY}" }
    }
  }
}
```

Dentro de una sesión, `/mcp` muestra el estado de cada servidor y gestiona la autenticación.

## Alternativas

- **Skills o instrucciones en `CLAUDE.md`:** si lo que falta es *conocimiento* (convenciones del proyecto) y no *capacidad*, no hace falta un servidor.
- **Comandos de shell / CLI propias:** el asistente ya sabe usar `gh`, `psql` o `curl`; a veces es suficiente y más transparente.
- **API directa con *tool use*:** si construyes tu propia aplicación con la API de Claude, defines las herramientas en tu código sin pasar por MCP.

## Referencias

- Claude Code: [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)
- Especificación y servidores de ejemplo: [modelcontextprotocol.io](https://modelcontextprotocol.io)
