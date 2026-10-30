# Pendientes e ideas — CodeVaultFront

Cada entrada se **elimina** al completarse (el historial de lo hecho vive en `DECISIONES.md`). Lo que afecta a los dos repositorios está aquí; en `CodeVaultBack/docs/PENDIENTES.md` solo se repite lo propio del back.

Estado: 🔴 bloquea la publicación · 🟡 mejora importante · 🟢 deseable. Esfuerzo: S (horas) · M (un día) · L (varios días).

## Pendientes (trabajo ya decidido)

### Verificación de lo escrito pero no ejecutado
- 🔴 **Subir los repositorios y ver el CI en verde** (ambos). Los workflows están escritos y el YAML es válido, pero nunca se han ejecutado; las versiones de las acciones están fijadas de memoria y pueden necesitar actualización. En el back, el trabajo con PostgreSQL real nunca se ha podido correr (sin Docker local). *S*
- 🔴 **Activar GitHub Pages** (Settings → Pages → Source: GitHub Actions) y comprobar que la URL del registro (`inneryho.github.io/<repo>/r`) coincide con la de la CLI. *S*
- 🟡 **Prueba de extremo a extremo front ↔ back.** El contrato de login con 2FA solo se ha verificado leyendo ambos lados. Se resuelve con la demo conectada (ver Ideas, nº 1). *M*
- 🟡 **Probar el back contra un PostgreSQL de servidor** (no solo PGlite). *S*

### De la lista original sin hacer
- 🟡 **Playground interactivo de props** en la pestaña Demo: cambiar opciones de un módulo y ver el resultado y el código resultante. *L*
- 🟡 **Guías de conceptos:** introducción al proyecto, «cómo usar un módulo», y **RBAC explicado** (qué es y cuándo usarlo; pedido expreso: se explica, no se implementa). *M*
- 🟢 **Changelog y estado por módulo** (versión, fecha del último cambio). *M*
- 🟡 **Estados vacíos, de carga y de error** como patrón unificado (`DataTable` ya tiene el vacío). *M*

### Menores conocidos
- 🟢 Filtros visibles por categoría y estado en el sitio (hoy solo se escribe en la búsqueda). *S*
- 🟢 Animación de salida en diálogos (`Drawer`, `CommandPalette`) y de la capa saliente de `image-transition` si se navega a mitad de transición. *M*
- 🟢 Efecto de puntero en táctil (giroscopio) en `parallax`. *M*
- 🟢 `og:image` para la vista previa al compartir (necesita la URL pública). *S*
- 🟢 `Toast`: cerrar el más reciente con `Esc`. En el sitio de demo tapa el botón de búsqueda y el de tema (posición arriba a la derecha); valorar moverlo abajo. *S*
- 🟢 Revisar el contraste de color en un navegador real: axe lo omite en jsdom. *S*

## Ideas (sin decidir)

Criterio: en un portafolio pesa más una pieza que se pueda **probar en vivo** que muchos módulos pequeños. Orden sugerido: 1 → 8 → 5.

### Demos conectadas
1. **Demo conectada front + back.** Registro, login con 2FA, sesión por cookie y un panel protegido de punta a punta. Es el gancho principal y cierra la prueba e2e. *L* (Ya existe una primera pieza conectada: `ui/scrape-panel` ↔ `/scrape-demo` del back, sin autenticación.)
2. **Tiempo real con SSE/WebSocket.** `useEventSource` con reconexión (front) + endpoint (back); panel que se actualiza en vivo. *M*
3. **Subida de archivos con progreso.** Arrastrar y soltar, cola, cancelar y reintentar; validación de tipo y tamaño en el back. *L*

### Interfaz
4. **Formularios dinámicos desde un esquema Zod.** El mismo esquema valida en el back y genera el formulario en el front: una sola fuente de verdad. *L*
5. **Gráficas SVG sin librería** (líneas, barras, anillo) con tooltips accesibles y tabla alternativa. Muestra dominio de SVG y de accesibilidad. *L*
6. **Virtualización de listas** (100 000 filas fluidas) con medición de rendimiento en el README. *M*
7. **Tablero kanban con arrastrar y soltar accesible por teclado.** Difícil de hacer bien, por eso destaca. *L*
8. **Tamaño por módulo en el índice** («toast: 2 kB gzip») y presupuesto de peso comprobado en el CI. *M*
9. **Passkeys / WebAuthn** como segundo factor alternativo (candidato natural tras el TOTP). *L*

### Módulos pequeños que encajan
10. **Validadores** (correo, teléfono, «sin espacio inicial» de los apuntes de ShortCuts) con la guía «cuándo regex y cuándo Zod». *S*
11. **Guía de comandos de git** de ShortCuts (sin credenciales). *S*
12. **Lista de municipios de Colombia** como dato reutilizable (existe en ShortCuts, `DepartamentosMunicipiosCol.js`; revisar la fuente: DANE) con un `Combobox` dependiente. *M*

### Interfaz (ampliación)
15. **Documentación bilingüe:** `README.en.md` por módulo y que el sitio muestre el del idioma elegido (hoy solo se traduce la interfaz). Son ~40 documentos; podría empezar por las guías. *L*
16. **Más guías de IA** en `src/modules/ia/`: subagentes, *prompt injection* y permisos en profundidad. *M*

### Credibilidad del proyecto
13. **Pruebas visuales de regresión** (capturas de cada demo comparadas en el CI): en este proyecto fallos reales solo salieron en un navegador de verdad. *L*
14. **Sección «Cómo se hizo»** con las decisiones y los errores encontrados, tomada de `DECISIONES.md`. *S*
