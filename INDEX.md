# Índice de módulos

> Generado por `pnpm index`. No editar a mano.

## auth

| Módulo | Descripción | Estado | Dependencias |
|---|---|---|---|
| [Login con 2FA](src/modules/auth/login-2fa/README.md) | Flujo de login en dos pasos (contraseña + código TOTP o de recuperación) y asistente de activación con QR. | beta | react, motion, ui/qr-code, ui/otp-input |

## guides

| Módulo | Descripción | Estado | Dependencias |
|---|---|---|---|
| [Motion (Framer Motion)](src/modules/guides/motion/README.md) | Librería de animación para React: gestos, layout, salidas y resortes con una API declarativa. | stable | motion |
| [Tailwind CSS 4](src/modules/guides/tailwind/README.md) | CSS utilitario con configuración en CSS, variantes y modo oscuro por clase. | stable | tailwindcss, @tailwindcss/vite |
| [Vite, Biome y oxc](src/modules/guides/vite-biome-oxc/README.md) | Qué hace cada herramienta del stack (bundler, lint/formato, transpilador) y por qué no compiten entre sí. | stable | vite, @biomejs/biome |
| [Almacenamiento web](src/modules/guides/web-storage/README.md) | Cookies, localStorage, sessionStorage e IndexedDB: qué guardar en cada uno, límites y riesgos de seguridad. | stable |  |

## hooks

| Módulo | Descripción | Estado | Dependencias |
|---|---|---|---|
| [useHotkey](src/modules/hooks/use-hotkey/README.md) | Atajos de teclado globales con soporte Cmd/Ctrl, protección en campos de texto y formateo para mostrarlos. | stable | react |
| [useLocalStorage y useSessionStorage](src/modules/hooks/use-web-storage/README.md) | Estado persistido en localStorage (entre sesiones) o sessionStorage (por pestaña), sincronizado entre componentes, tolerante a fallos y compatible con SSR. | stable | react |

## ia

| Módulo | Descripción | Estado | Dependencias |
|---|---|---|---|
| [Agregar un modelo a tu proyecto](src/modules/ia/agregar-modelo/README.md) | Cómo conectar un modelo de lenguaje (local con Ollama o alojado) a una aplicación: elegir, aislarlo detrás de una interfaz, configurarlo por entorno, validar su salida y probarlo. | beta |  |
| [Context7](src/modules/ia/context7/README.md) | Servidor MCP que entrega a la IA documentación actualizada y por versión de librerías, para evitar APIs inventadas u obsoletas. | stable |  |
| [Harness de un agente](src/modules/ia/harness/README.md) | Qué es el harness que rodea a un modelo de lenguaje (bucle, herramientas, contexto, permisos, hooks) y cómo configurarlo en Claude Code con CLAUDE.md, settings.json, hooks y skills. | beta |  |
| [MCP (Model Context Protocol)](src/modules/ia/mcp/README.md) | Protocolo abierto para conectar asistentes de IA con herramientas y datos externos: qué expone un servidor, cómo se añade a Claude Code y qué riesgos tiene. | stable |  |
| [Ollama](src/modules/ia/ollama/README.md) | Ejecutar modelos de lenguaje en tu propia máquina: instalación, comandos, API local y compatibilidad con el formato de OpenAI. | stable |  |
| [SDD (desarrollo guiado por especificación)](src/modules/ia/sdd/README.md) | Escribir primero la especificación (qué, plan, tareas) y derivar de ella el código y las pruebas; cuándo compensa al trabajar con un agente de IA y cuándo es exceso de proceso. | beta |  |
| [Telegram con IA](src/modules/ia/telegram/README.md) | Hablar con tu sesión de Claude Code desde el móvil mediante un bot de Telegram (channels), y cuándo usar en su lugar los módulos de alertas del proyecto. | beta |  |

## lib

| Módulo | Descripción | Estado | Dependencias |
|---|---|---|---|
| [Fechas de Excel](src/modules/lib/excel-date/README.md) | Convierte números de serie de Excel a fechas (y viceversa) sin desfases de zona horaria ni del año bisiesto fantasma de 1900. | stable |  |
| [Hora local](src/modules/lib/local-time/README.md) | Muestra un instante en la zona horaria de quien lo mira, con Intl, sin diccionarios de zonas ni cálculos de desfase a mano. | stable |  |

## notify

| Módulo | Descripción | Estado | Dependencias |
|---|---|---|---|
| [Alertas por Telegram](src/modules/notify/telegram-alerts/README.md) | Botón de alerta urgente con confirmación, envío y verificación del resultado real, y asistente paso a paso para vincular Telegram. | beta | react, ui/qr-code |

## ui

| Módulo | Descripción | Estado | Dependencias |
|---|---|---|---|
| [Command Palette](src/modules/ui/command-palette/README.md) | Paleta de comandos (⌘K) con búsqueda por relevancia sin tildes, navegación por teclado y ARIA combobox. | stable | react, motion, hooks/use-hotkey |
| [Data Table](src/modules/ui/data-table/README.md) | Tabla con ordenación y paginación accesibles, estado vacío y utilidades sueltas (usePagination, Pagination, getPageRange). | stable | react |
| [Drawer](src/modules/ui/drawer/README.md) | Panel lateral modal sobre dialog nativo: foco atrapado, Escape y cierre por fondo. | stable | react, motion |
| [Floating Action Button](src/modules/ui/floating-action-button/README.md) | Botón flotante con badge animado y panel de acciones opcional; cierra con Escape o clic fuera. | stable | react, motion |
| [Transición de imágenes](src/modules/ui/image-transition/README.md) | Galería con seis transiciones por capas (fundido, cortina, círculo, zoom, persianas, deslizar), zoom lento y reproducción automática accesible. | stable | react, motion |
| [Numeric Input](src/modules/ui/numeric-input/README.md) | Campo que solo admite dígitos (o un decimal): limpia el texto pegado, teclado numérico en móvil y etiqueta/ayuda accesibles. | stable | react |
| [OTP Input](src/modules/ui/otp-input/README.md) | Campo de código de un solo uso con casillas, pegado, autocompletado del SO y teclado completo. | stable | react |
| [Parallax con scroll](src/modules/ui/parallax/README.md) | Efecto parallax ligado al scroll: capas que se mueven a distinta velocidad, con muelle opcional y movimiento reducido. | stable | react, motion |
| [Escena de capas](src/modules/ui/parallax-scene/README.md) | Escena con profundidad: capas que reaccionan al scroll y al ratón según su distancia, más siluetas de montañas y pinos generadas por código. | stable | react, motion, ui/parallax |
| [QR Code](src/modules/ui/qr-code/README.md) | Código QR como un único SVG, generado en el navegador (el contenido nunca sale a un servicio externo). | stable | react, uqr |
| [Panel de scraping](src/modules/ui/scrape-panel/README.md) | Panel para ejecutar y observar un scraping en vivo: escenarios, barra de avance, páginas leídas con su motivo de fallo, reintentos y tabla de datos, sobre un flujo SSE. | beta | react |
| [Theme Toggle](src/modules/ui/theme-toggle/README.md) | Botón día/noche con modo sistema, persistencia, sin destello inicial y transición circular. | stable | react, motion |
| [Toast](src/modules/ui/toast/README.md) | Avisos efímeros que se pausan al pasar el cursor o enfocar, con barra de progreso, anuncio a lectores de pantalla y API por hook. | stable | react, motion |
