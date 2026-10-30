# Panel de scraping

Panel para **ver un scraping funcionando**: eliges un escenario, lo ejecutas y la interfaz muestra el avance en vivo, cada página leída (con el motivo si falló), los reintentos y los datos extraídos. Es la parte de interfaz de la demo conectada de `scrape/http-scraper` y `scrape/browser-scraper` del back.

## Cuándo usarlo

- Para **enseñar o depurar** un proceso largo que avisa de su avance por un flujo (*Server-Sent Events*): scraping, importaciones, procesos por lotes.
- Como plantilla de un panel de «trabajo en curso» accesible: barra de progreso, estado anunciado a lectores de pantalla, lista de resultados y cancelación.
- No es un lanzador de scraping para usuarios finales: el back de la demo **solo ejecuta escenarios fijos** sobre un sitio de ejemplo, a propósito (ver «Decisiones de diseño»).

## Instalación

Copia la carpeta (`pnpm codevault add ui/scrape-panel`). Requiere `react`. Con `--demo` trae `mock-client.ts`, el simulacro que usa la demo del sitio.

## Uso

```tsx
import { createHttpScrapeClient, createMockScrapeClient, ScrapePanel } from "./scrape-panel";

// Contra el back (rutas de src/app/scrape-demo.ts)
const client = createHttpScrapeClient({ baseUrl: "http://localhost:3000/scrape-demo" });
// o sin red, con datos ficticios:
const mock = createMockScrapeClient();

<ScrapePanel client={client} />
```

Para ver el scraping real de punta a punta, en local:

1. En `CodeVaultBack`: `pnpm dev` (la demo se monta en `/scrape-demo` solo fuera de producción; levanta una papelería ficticia en un puerto local y, para el escenario de la página con JavaScript, necesita Chrome o Chromium).
2. En `CodeVaultFront`: `pnpm dev`, abre este módulo, pestaña **Demo**, elige **Back real** y pulsa **Ejecutar**.

### El contrato (SSE)

`client` es una interfaz (`ScrapeClient`): `scenarios()` y `run(id, onEvent, signal)`. El cliente HTTP lee `GET {baseUrl}/run/:escenario` y traduce los eventos del back:

| Evento SSE | Datos | Para qué |
| --- | --- | --- |
| `start` | `{ scenario, title }` | Empieza la ejecución |
| `progress` | `{ state, total \| null, done, failed, items, current }` | Barra y resumen |
| `page` | `{ url, ok, items, issues, reason?, description? }` | Una fila en «Páginas» y datos para la tabla |
| `log` | `{ message }` | Reintentos y otros avisos |
| `done` | `{ progress }` | Fin (`state`: `done` o `cancelled`) |
| `error` | `{ message }` | Fallo de la ejecución |

## API

La tabla de props se genera automáticamente (`pnpm api`). Exports principales:

- `ScrapePanel`: el panel (`client`, `maxRows`, `className`).
- `useScrapeRun(client)`: la lógica sin interfaz (`scenarios`, `state`, `start`, `cancel`), por si quieres otro diseño.
- `createHttpScrapeClient`, `createMockScrapeClient`: clientes.
- `SseParser`: lector incremental de SSE, reutilizable para cualquier flujo.
- `runReducer`, `summarize`, `toScrapeEvent`: piezas puras y probadas.

## Decisiones de diseño

- **`fetch` con un lector propio en vez de `EventSource`.** `EventSource` se reconecta solo cuando el servidor cierra el flujo, y un trabajo finito volvería a lanzarse; además no se puede cancelar con `AbortSignal`. `SseParser` es una clase pequeña que acepta trozos de cualquier tamaño (se prueba carácter a carácter) y cumple el formato (comentarios, `\r\n`, varias líneas `data`).
- **Cancelar cierra la conexión y el back lo detecta** (`stream.onAbort` → `AbortSignal` → el recorrido deja de pedir páginas). Cancelar no es un error: la petición abortada resuelve en silencio.
- **El estado vive en un reductor puro.** `runReducer` es una función de (estado, acción) → estado, probada sin React: acumula páginas, limita el registro a 50 líneas y distingue «terminado» de «cancelado».
- **No se afirma más de lo que se sabe.** La barra es determinada solo si el servidor conoce el total; en listados paginados (`total: null`) es indeterminada y no inventa un porcentaje.
- **Sin SSRF por diseño.** El back de la demo no recibe URLs: solo ejecuta escenarios con nombre sobre un sitio de ejemplo. Un panel donde el usuario escribe la URL a descargar exigiría autenticación, límites y comprobación de la IP resuelta (ver los límites del módulo del back).
- **Simulacro con los mismos eventos.** `createMockScrapeClient` reproduce el contrato, así la demo del sitio estático (GitHub Pages) funciona sin servidor y las pruebas son deterministas (`delayMs: 0`).
- **CORS acotado en el back:** la demo solo responde al origen de desarrollo (`http://localhost:5173`); no usa `*`.

## Accesibilidad

- Escenarios como grupo de radios con `fieldset`/`legend`; el que el servidor no puede ejecutar queda deshabilitado y explica por qué.
- Barra con `role="progressbar"`, `aria-valuenow` solo cuando hay total y `aria-valuetext` con el resumen.
- Resumen en una región `role="status"` (`aria-live="polite"`) que anuncia el avance y el resultado final; errores de carga con `role="alert"`.
- El estado de cada página no depende del color: lleva ✓/✗ y un texto oculto («Leída:» / «Falló:») para lectores de pantalla.
- Tabla con `caption` y `th scope="col"`; sin animaciones si el usuario pide movimiento reducido.

## Pruebas

`scrape-panel.test.tsx`: lector SSE (trozos de un carácter, `\r\n`, comentarios), traducción de eventos, reductor (cancelación, límite del registro), cliente HTTP (flujo partido, 429/404/red, cancelación, codificación de la URL) y el panel completo con el simulacro (escenarios, catálogo con tabla, fallos y reintentos, cancelar sin que sigan llegando eventos, errores de conexión y de arranque). El sitio además pasa la auditoría de axe-core.
