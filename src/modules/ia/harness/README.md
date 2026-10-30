# Harness de un agente

## Qué es

El **harness** es todo lo que rodea al modelo para convertirlo en un agente útil: el modelo solo predice texto; el harness es el programa que lo llama en bucle, le ofrece herramientas, decide qué entra en su contexto y qué acciones se permiten. Claude Code es un harness: tú no hablas con el modelo «a pelo», hablas con él a través de ese programa.

| Pieza | Qué hace | Dónde se configura en Claude Code |
| --- | --- | --- |
| **Bucle** | Pide al modelo, ejecuta las herramientas que solicita y le devuelve el resultado, hasta terminar | No se configura; es el núcleo |
| **Herramientas** | Leer/editar archivos, ejecutar comandos, buscar; ampliables con [MCP](/ia/mcp) | `claude mcp add`, `.mcp.json` |
| **Contexto** | Instrucciones fijas que se cargan al empezar cada sesión | `CLAUDE.md` |
| **Permisos** | Qué acciones se hacen sin preguntar, cuáles se preguntan y cuáles se prohíben | `settings.json` → `permissions` |
| **Hooks** | Comandos que el harness (no el modelo) ejecuta en momentos fijos | `settings.json` → `hooks` |
| **Skills** | Procedimientos que el agente carga solo cuando el tema los necesita | `.claude/skills/<nombre>/SKILL.md` |

La idea que ordena todo: **lo que debe cumplirse siempre va al harness, no al prompt.** Una instrucción en `CLAUDE.md` es una petición que el modelo suele seguir; un permiso `deny` o un hook se cumple siempre, porque lo ejecuta el programa.

## Cuándo usarla

- El agente repite los mismos errores de convenciones: ponlas en `CLAUDE.md`.
- Hay comandos que siempre deben pasar sin preguntar (`lint`, `test`) o archivos que nunca deben tocarse (generados, `.env`): permisos.
- Algo debe ocurrir **después de cada edición** (formatear, validar) sin depender de que el modelo se acuerde: hook.
- Un procedimiento largo solo se necesita a veces (crear un módulo nuevo, preparar un despliegue): skill, para no gastar contexto en cada sesión.

## Cuándo no usarla

- No metas en `CLAUDE.md` lo que ya está en el código o en `docs/`: enlázalo. Un archivo largo consume contexto en cada sesión y el modelo lo sigue peor.
- No uses un hook para lógica de negocio ni para tareas lentas: se ejecutan en cada evento y bloquean el flujo.
- No guardes secretos en ninguno de estos archivos; los de proyecto se versionan.
- No des permisos amplios por comodidad (`Bash(*)`): anula la protección frente a *prompt injection* (texto malicioso que el agente lea y obedezca).

## Ejemplo

Estructura mínima de un proyecto:

```
CLAUDE.md                          reglas y comandos del proyecto
.claude/
  settings.json                    permisos y hooks (se versiona)
  format-on-edit.mjs               script que usa el hook
  skills/nuevo-modulo/SKILL.md     procedimiento bajo demanda
```

`CLAUDE.md`: corto, con comandos y reglas que no se negocian, y enlaces al resto.

```markdown
# Mi proyecto

Stack: React 19, TypeScript, Vite, pnpm.

## Comandos
- `pnpm lint && pnpm typecheck && pnpm test` antes de dar algo por terminado.

## Reglas
1. Sin datos reales ni secretos en ejemplos.
2. `INDEX.md` es generado (`pnpm index`): no se edita a mano.

Más detalle en `docs/POLITICAS.md` y `docs/CONVENCIONES.md`.
```

`.claude/settings.json`: permisos y un hook que formatea tras cada edición.

```json
{
  "permissions": {
    "allow": ["Bash(pnpm lint)", "Bash(pnpm typecheck)", "Bash(pnpm test:*)"],
    "deny": ["Edit(INDEX.md)", "Read(.env*)"]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/format-on-edit.mjs\"" }
        ]
      }
    ]
  }
}
```

El hook recibe por la entrada estándar un JSON con la herramienta usada; este script formatea el archivo editado:

```js
// .claude/format-on-edit.mjs
import { execFileSync } from "node:child_process";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const file = JSON.parse(raw || "{}").tool_input?.file_path ?? "";

if (/\.(tsx?|json|css)$/.test(file)) {
  try {
    execFileSync("pnpm", ["exec", "biome", "check", "--write", file], { stdio: "ignore" });
  } catch {
    // un error de lint no debe bloquear la edición
  }
}
```

Una skill es una carpeta con un `SKILL.md`: la cabecera dice **cuándo** cargarla y el cuerpo, **qué hacer**.

```markdown
---
name: nuevo-modulo
description: Crea un módulo nuevo siguiendo la plantilla del proyecto. Úsalo al añadir un módulo.
---

1. Copia `docs/PLANTILLA_MODULO/` a `src/modules/<categoria>/<nombre>/`.
2. Rellena `meta.json` y el README.
3. Ejecuta `pnpm validate && pnpm lint && pnpm test`.
```

Un buen punto de partida para empezar a especificar lo que el agente construirá es [SDD](/ia/sdd).

## Alternativas

- **Prompt en cada sesión:** funciona para algo puntual, pero no persiste ni se comparte con el equipo.
- **Git hooks / CI:** validan el resultado final, sea de una persona o de un agente; complementan al harness, no lo sustituyen (el CI avisa tarde, el hook de edición avisa al momento).
- **Otros harness** (Cursor, Copilot, el SDK de agentes) tienen conceptos equivalentes con otros nombres y archivos.

## Referencias

- Claude Code: [Memory (CLAUDE.md)](https://code.claude.com/docs/en/memory), [Settings](https://code.claude.com/docs/en/settings), [Hooks](https://code.claude.com/docs/en/hooks), [Skills](https://code.claude.com/docs/en/skills)
