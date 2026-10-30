# SDD (desarrollo guiado por especificación)

## Qué es

*Spec-Driven Development*: antes de escribir código se escribe la **especificación** de lo que se quiere, y el código (y las pruebas) se derivan de ella. La spec es el documento que revisan las personas; el agente la usa como contrato. Con un agente de IA importa especialmente: si pides «hazme un kanban» sin más, el modelo rellena los huecos con suposiciones; una spec las convierte en decisiones tuyas.

El flujo habitual tiene tres documentos, cada uno responde una pregunta distinta:

| Documento | Responde | Contenido |
| --- | --- | --- |
| `spec.md` | **Qué** y para quién | problema, alcance y fuera de alcance, API propuesta, criterios de aceptación |
| `plan.md` | **Cómo** | decisiones y alternativas descartadas, dependencias, archivos a tocar |
| `tasks.md` | **En qué orden** | tareas pequeñas, cada una con su comprobación |

Y cuatro pasos con una revisión humana entre ellos:

1. **Especificar** → revisas la spec.
2. **Planificar** → revisas el plan.
3. **Dividir en tareas.**
4. **Implementar** tarea por tarea, verificando cada una.

La regla que lo sostiene: **si la implementación obliga a cambiar el diseño, se cambia la spec primero**, no se deja que el código y el documento se separen.

## Cuándo usarla

- Un módulo nuevo o un cambio que toca varias piezas o un contrato (por ejemplo, front y back).
- Trabajo que vas a delegar a un agente y no quieres revisar solo al final.
- Cuando hay decisiones que merece la pena dejar escritas (por qué esta librería y no otra).

## Cuándo no usarla

- Una corrección evidente, un ajuste de estilos o un cambio de texto: la spec costaría más que el cambio.
- Cuando todavía no sabes qué quieres: explora con un prototipo desechable y especifica después.
- Como burocracia: una spec que nadie revisa ni consulta es ruido. Si queda desactualizada, bórrala.

## Ejemplo

Una carpeta por cambio, con las tres plantillas:

```
specs/
  _plantilla/          spec.md · plan.md · tasks.md
  ui-kanban/           una carpeta por cambio
```

`spec.md`, con criterios de aceptación **comprobables**:

```markdown
# Spec: ui/kanban

## Problema
Tablero para mover tarjetas entre columnas, usable con teclado.

## Alcance
- Columnas y tarjetas por props; mover con arrastre y con teclado.

## Fuera de alcance
- Persistencia y colaboración en tiempo real.

## Criterios de aceptación
- [ ] Una tarjeta se puede mover a otra columna solo con teclado (prueba).
- [ ] El cambio se anuncia a lectores de pantalla (aria-live).
- [ ] Respeta `prefers-reduced-motion`.
- [ ] Sin datos reales en la demo.
```

`tasks.md`, cada tarea con cómo se comprueba:

```markdown
- [ ] 1. Copiar la plantilla de módulo y rellenar meta.json — `pnpm validate`
- [ ] 2. Implementar la API de la spec — `pnpm typecheck`
- [ ] 3. Pruebas desde los criterios de aceptación — `pnpm test`
- [ ] 4. Demo con datos ficticios — verla en `pnpm dev`
- [ ] 5. Pasar decisiones al README y borrar la carpeta de la spec
```

Los criterios de aceptación son la base de las pruebas: si un criterio no se puede comprobar, hay que reescribirlo. Al cerrar el cambio, las decisiones que importan pasan a la documentación permanente (aquí, `## Decisiones de diseño` y `docs/DECISIONES.md`) y la spec, que es efímera, se elimina.

Con Claude Code puedes empaquetar el primer paso como una skill (`/spec ui/kanban`) para que siempre empiece igual: ver [Harness](/ia/harness).

## Alternativas

- **TDD:** parte de pruebas en lugar de documentos; encaja bien dentro de SDD (los criterios de aceptación se convierten en pruebas).
- **Plan mode / planificar en conversación:** más ligero; sirve cuando no necesitas dejar el plan escrito ni revisarlo con otras personas.
- **Herramientas de SDD** (por ejemplo, kits que generan estas plantillas y los comandos para recorrerlas): ahorran preparación a cambio de adoptar su estructura.

## Referencias

- Es una práctica, no un estándar: las plantillas de arriba son las de este proyecto y puedes adaptarlas. Consulta la documentación de la herramienta que uses si adoptas un kit de SDD.
