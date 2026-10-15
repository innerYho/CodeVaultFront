# Alertas por Telegram

Dos piezas de interfaz para el canal de Telegram, listas para conectar con el módulo `notify/telegram-alerts` del back:

- **`AlertButton`:** botón de alerta urgente con flujo paso a paso: confirmación → envío → **verificación** → resultado.
- **`LinkWizard`:** asistente guiado para que cada persona vincule su Telegram: generar enlace → abrirlo y pulsar «Iniciar» → verificación automática → mensaje de prueba.

Nace del botón *Alerta PRA* de Hydra (`AlertaPRA.jsx`), pero sin lógica de negocio: el módulo no sabe a quién se avisa; eso lo decide el back.

## Cuándo usarlo

Un aviso que debe llegar a una persona en segundos (emergencias, caídas, solicitudes urgentes) y donde **equivocarse al decir «enviado» es peor que no tener botón**. No lo uses para avisos informativos: para eso, `Toast`.

## Instalación

Copia la carpeta (`pnpm codevault add notify/telegram-alerts`; trae también `ui/qr-code`). Requiere `react`. En el back, `notify/telegram-alerts` (que a su vez usa `notify/telegram`).

## Uso

```tsx
const client = createTelegramAlertsClient({ baseUrl: "/telegram" }); // rutas del back, sesión por cookie

<LinkWizard client={client} />                    // en el perfil de la persona
<AlertButton client={client}>Alerta urgente</AlertButton> // en la barra de navegación
```

`client` es una interfaz (`TelegramAlertsClient`): usa `createTelegramAlertsClient` (fetch), el simulacro `createMockTelegramClient` (demos y pruebas), o implementa la tuya.

## El paso a paso

**Alerta**
1. **Confirmas.** Un diálogo explica cuándo usarla, enumera qué pasará en tres pasos y permite una nota opcional (hasta 200 caracteres).
2. **Envío.** El botón de confirmar se bloquea; el diálogo no se puede cerrar mientras se envía.
3. **Verificación.** Se mira el resultado *real* del servidor, no solo que la petición haya ido bien (ver abajo).
4. **Resultado** con un mensaje distinto según el caso, y «Reintentar» si no fue un éxito.

**Vinculación**
1. **Generar enlace.** El servidor crea un código de un solo uso (caduca a los 15 minutos).
2. **Abrir en Telegram.** Enlace y QR. La persona pulsa «Iniciar» (*Start*) en el bot.
3. **Verificación.** Mientras espera, la interfaz pregunta al servidor cada pocos segundos si ya se vinculó, con cuenta atrás. Si caduca, ofrece generar otro; si la red falla varias veces seguidas, avisa en lugar de esperar para siempre.
4. **Prueba.** Envía un mensaje de prueba y comprueba que se entregó.

## La verificación: `classifyReport`

El servidor responde con un informe `{ delivered, failed, notLinked }`. La interfaz **nunca** muestra «enviada» sin `delivered > 0`:

| Informe | Resultado | Lo que ve la persona |
| --- | --- | --- |
| `delivered > 0`, `failed = 0` | éxito | «Se avisó a N persona(s)» |
| `delivered > 0`, `failed > 0` | parcial | «…pero no se pudo entregar a K. Avisa también por otro medio» |
| `delivered = 0`, `failed > 0` | fallo | «Telegram no entregó a ninguna…» |
| `delivered = 0`, `failed = 0` | **nadie** | «La alerta NO llegó a nadie» |

Además `classifyError` traduce los errores de la petición: sin conexión, sesión caducada, límite de envíos (con los segundos restantes), servidor sin bot configurado.

## API

Las propiedades de `AlertButton` y `LinkWizard` se generan desde los tipos (`pnpm api`). También se exportan `alertReducer` (la máquina de estados), `useLinkFlow` (la lógica del asistente, por si quieres otra interfaz), `classifyReport` y `classifyError`.

## Decisiones de diseño

Frente a `AlertaPRA.jsx`:

- **La verificación es explícita y está probada.** El original tuvo un fallo en producción (2026-09-14): el servidor respondió 200 sin haber avisado a nadie y la persona vio el mensaje de éxito. Hydra lo arregló con dos `if` sueltos dentro del manejador; aquí es una función pura (`classifyReport`) con una prueba que recorre las combinaciones y exige que `delivered = 0` nunca sea éxito (comprobado: la prueba falla si se invierte).
- **Máquina de estados pura** (`alertReducer`) en lugar de un `useState` booleano: las transiciones inválidas (enviar sin confirmar, cancelar enviando) no existen, y el doble clic envía una sola alerta (con guarda síncrona, también probada).
- **Diálogo propio sobre `<dialog>`** en vez de SweetAlert2 y de imágenes con el texto dibujado (`PRA1.png`/`PRA2.png`): las imágenes no las lee un lector de pantalla, no se traducen ni se adaptan al modo oscuro.
- **Resultado accesible:** los malos con `role="alert"` (interrumpen), el bueno con `role="status"`; «Reintentar» solo cuando no hubo éxito.
- **El texto de la alerta lo arma el servidor.** El cliente solo manda una nota de hasta 200 caracteres: nadie puede usar el botón para enviar mensajes arbitrarios.
- **La vinculación se verifica contra el servidor, no se supone.** En Hydra se elegía el chat a mano de una lista de pendientes, y un `chat_id` terminó en la persona equivocada.
- **Sin mensajes mentirosos tras caducar:** la cuenta atrás es local; no depende de que el servidor responda.
- **QR generado en el navegador** (`ui/qr-code`): el enlace de vinculación no sale a ningún servicio externo.
- **Cliente como interfaz:** el mismo código sirve con el back real o con el simulacro de la demo.

## Accesibilidad

Diálogo modal con foco atrapado, título enlazado, `Escape` para cancelar (bloqueado mientras envía para no perder el resultado) y foco en «Cerrar» al terminar. Los pasos del asistente son una lista ordenada con `aria-current="step"` y «(completado)» para lectores de pantalla; el estado de espera es `role="status"`; la cuenta atrás es un `role="timer"` que no interrumpe. El QR tiene su equivalente en texto: el enlace «Abrir Telegram». Los estados no dependen solo del color: llevan texto e iconos con `aria-hidden`.

## Pruebas

`telegram-alerts.test.tsx` (25 pruebas): `classifyReport` en todas las combinaciones, `classifyError`, la máquina de estados, el botón (confirmación, éxito, «nadie», error de red, doble clic, nota), el asistente completo con reloj simulado (enlace → verificación → vinculado → prueba; caducidad; desvincular; servidor sin bot; fallos de red) y el cliente `fetch`. Se comprobó que fallan si se quita la guarda de doble envío o si «nadie» se trata como éxito.
