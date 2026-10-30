# Telegram con IA

## Qué es

Telegram sirve a la IA de dos maneras distintas; conviene no mezclarlas:

| Dirección | Qué es | Dónde está |
| --- | --- | --- |
| **Persona ⇄ agente** | Escribes al bot desde el móvil y tu sesión de Claude Code (en tu equipo, con tus archivos) responde por el mismo chat. Se llama **channel**. | Esta guía |
| **Aplicación → persona** | Tu sistema avisa a una persona («alerta urgente») por Telegram. No hay IA en medio. | Módulo `notify/telegram-alerts` (front) y `notify/telegram` (back) |

Un *channel* es un servidor [MCP](/ia/mcp) que **empuja** eventos a una sesión ya abierta y puede responder por la misma vía. Telegram, Discord e iMessage vienen como plugins oficiales. Los eventos solo llegan mientras la sesión está abierta, así que para uso continuo hay que dejar Claude corriendo en segundo plano o en una terminal persistente.

> **Estado:** los channels son una *vista previa de investigación*. La sintaxis de `--channels` y el protocolo pueden cambiar, y la bandera no aparece en `claude --help`. Requieren autenticación con claude.ai o una clave de la Consola (no están disponibles en Bedrock, Vertex ni Foundry); en planes Team y Enterprise un propietario debe habilitarlos.

## Cuándo usarla

- Quieres lanzar o consultar trabajo en tu máquina **desde el móvil**, con acceso a tus archivos reales.
- Quieres que un aviso externo (CI, monitoreo) llegue a la sesión donde Claude ya tiene el contexto (los channels también sirven como receptor de *webhooks*).

## Cuándo no usarla

- **Como canal de alertas de tu producto** hacia usuarios o equipos: usa `notify/telegram-alerts`; es determinista y no depende de una sesión abierta.
- Si necesitas disponibilidad 24/7 sin dejar un equipo encendido: la sesión debe estar viva.
- Sin lista de remitentes permitidos: cualquiera que pueda escribirle al bot podría dar órdenes y aprobar herramientas. Mantén siempre la política `allowlist`.
- Con información sensible por un chat de terceros: los mensajes pasan por Telegram.

## Ejemplo

Requiere [Bun](https://bun.sh) (los plugins son scripts de Bun).

```text
# 1. En Telegram, abre @BotFather, envía /newbot y copia el token.

# 2. Dentro de Claude Code, instala el plugin (elige alcance "user"):
/plugin install telegram@claude-plugins-official

# 3. Guarda el token (queda en ~/.claude/channels/telegram/.env;
#    también vale la variable TELEGRAM_BOT_TOKEN):
/telegram:configure <token>
```

```bash
# 4. Reinicia Claude Code con el channel activado
claude --channels plugin:telegram@claude-plugins-official
```

```text
# 5. Escribe cualquier mensaje a tu bot: responde con un código de emparejamiento.
#    En Claude Code, apruébalo y deja solo tu cuenta:
/telegram:access pair <código>
/telegram:access policy allowlist
```

Cuando Claude responde por el channel, en la terminal ves el mensaje entrante y la llamada a la herramienta (por ejemplo «sent»), pero no el texto: la respuesta aparece en Telegram. Si Claude necesita un permiso mientras estás lejos, la sesión se pausa hasta que lo apruebes.

Para probar el flujo sin una plataforma real existe el plugin de demostración `fakechat` (interfaz de chat en `localhost:8787`).

## Alternativas

- **Discord o iMessage:** mismos channels con otro plugin (iMessage solo en macOS y sin token).
- **Remote Control:** manejas tu sesión local desde claude.ai o la app móvil, sin bot propio.
- **Tareas programadas:** si lo que quieres es consultar algo cada cierto tiempo, es más simple que esperar eventos.
- **Tu propio channel:** si el sistema no tiene plugin, se construye un servidor MCP que declare la capacidad de channel (ver la referencia de channels).
- **Alertas desde tu aplicación:** módulos `notify/telegram-alerts` y `notify/telegram` de este proyecto.

## Referencias

- Claude Code: [Push events into a running session with channels](https://code.claude.com/docs/en/channels)
- Código del plugin: [external_plugins/telegram](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/telegram)
- API de bots: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)
