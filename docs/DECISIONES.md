# Registro de decisiones

Formato: fecha · decisión · motivo · alternativas descartadas.

## 2026-10-14 · Vite + Biome + pnpm
- **Motivo:** Vite tiene el ecosistema más amplio para sitios de documentación; Biome unifica lint y formato en una sola herramienta.
- **Descartado:** Bun como bundler (menos madurez en HMR/plugins), esbuild directo (habría que construir dev server y HMR), SWC solo (es transpilador, no orquestador).

## 2026-10-14 · TypeScript + Motion
- **Motivo:** tipos como parte de la documentación de la API; `motion` es el paquete actual de Framer Motion (`motion/react`).

## 2026-10-14 · Copy-paste estilo shadcn
- **Motivo:** cada módulo es autocontenido y se copia al proyecto; sin publicar en npm ni versionar paquetes.

## 2026-10-14 · Tema con store externo, no Context
- **Motivo:** sin Provider, aplicación síncrona al DOM (necesaria para View Transitions) y sin destello al cargar. Detalle en `src/modules/ui/theme-toggle/README.md`.

## 2026-10-14 · Código con Shiki; API generada con TypeScript 5.9 como herramienta
- **Motivo (Shiki):** resaltado con doble tema por variables CSS, import de grano fino y motor JS sin WASM.
- **Motivo (api.json):** la tabla de props se extrae de los tipos y no se escribe a mano, así no se desincroniza.
- **Nota:** TypeScript 7 (nativo) no expone `createProgram`; se instala `typescript-api` (alias de `typescript@5.9`) solo para `scripts/build-api.ts`. El typecheck sigue con TS 7. Revisar cuando TS 7 publique su API de compilador.

## 2026-10-14 · Login con 2FA: cliente como interfaz y QR en el navegador
- **Motivo:** el front depende de la interfaz `AuthClient`, no de `fetch`; así la demo y las pruebas usan un simulacro y producción usa `createAuthClient`. Sesión en cookie `httpOnly` (sin `localStorage`).
- **QR con `uqr`** generado en el cliente: el secreto TOTP no se envía a servicios externos.
- **Cambio frente a Hydra:** 2FA por TOTP con códigos de recuperación en lugar de preguntas de seguridad (ver `CodeVaultBack/docs/DECISIONES.md`).
- **Prueba de contrato:** el cliente y el back comparten rutas y forma de error (`{ error, retryAfter }`); verificado leyendo ambos lados, no con un test conjunto. Pendiente: prueba end-to-end con el servidor real.

## 2026-10-14 · Búsqueda ⌘K y menú móvil como módulos reutilizables
- **Motivo:** el sitio de documentación es el primer consumidor de `hooks/use-hotkey`, `ui/command-palette` y `ui/drawer`; así lo que se muestra en la demo es el mismo código que se copia.
- **`<dialog>` nativo** en paleta y drawer: foco atrapado, Escape y fondo inerte sin código propio.
- **Cierre por el fondo con `mousedown`, no `click`:** arrastrar para seleccionar texto y soltar fuera ya no cierra el diálogo.
- **Búsqueda propia (~40 líneas)** sin tildes ni mayúsculas, con pesos por campo. Sustituir por `fuse.js`/`minisearch` si el catálogo crece a miles de elementos.
- **Hallazgo de las pruebas de integración:** `theme-store` fallaba al importarse sin `matchMedia`; ahora se degrada a "claro".
- **Pendiente:** filtros por categoría/estado como controles visibles (hoy se logra escribiendo la categoría), y animación de salida de los diálogos.

## 2026-10-14 · Parallax con `useScroll` de Motion
- **Motivo:** `useScroll` + `useTransform` actualizan el transform sin re-renders de React y aprovechan las líneas de tiempo de scroll nativas cuando existen. Solo se anima `transform`.
- **Convención de signo:** `distance` positivo = capa lejana (más lenta), negativo = cercana (más rápida).
- **Descartado:** `animation-timeline: scroll()` en CSS puro (soporte aún no universal; documentado como alternativa) y un listener `scroll` manual (re-renders y jank).
- **Nota de pruebas:** `useReducedMotion` de Motion lee `matchMedia` una sola vez por módulo, por eso la prueba de movimiento reducido vive en su propio archivo (`parallax.reduced.test.tsx`).

## 2026-10-14 · Transición de imágenes por capas y escena de profundidad
- **Imágenes de demostración:** 5 fotos de Unsplash (licencia gratuita) vía Lorem Picsum, reducidas a WebP (1,1 MB). Autores y enlaces en `public/demo/CREDITS.md`. Los módulos no dependen de ellas.
- **Transición:** la imagen entrante se revela encima de la saliente (`clip-path`, `opacity`, `transform`, `filter`; nunca tamaño/posición). La raíz de cada capa es estable para que el zoom lento no se reinicie.
- **Escena:** un único `depth` por capa gobierna scroll y puntero. Siluetas generadas por código (desplazamiento del punto medio con semilla): sin imágenes, sin licencias.
- **Hallazgos al verificar en un Chrome real** (los tests de jsdom no los habían visto): (1) las capas de la escena ignoraban `top-*` porque el margen extra en línea lo pisaba → ahora hay una prop `top`; (2) `blinds` no creaba las franjas y la capa saliente nunca se retiraba, por un parche que no se aplicó. Ambos tienen ahora prueba de regresión, comprobada reinyectando el fallo.
- **Pendiente:** animación de salida de la capa saliente si se navega a mitad de transición (hoy desaparece de golpe), y el efecto de puntero en táctil (giroscopio).

## 2026-10-14 · Instalador por CLI, CI, despliegue y accesibilidad automática
- **Instalador estilo shadcn:** `pnpm registry` genera un JSON por módulo (archivos dentro) y un índice, que se publican con el sitio en `/r/`. La CLI (`cli/codevault.ts`, sin dependencias) copia el módulo **con sus módulos internos**, conserva la estructura de carpetas (los imports entre módulos son relativos) y dice qué paquetes instalar; no ejecuta nada ni sobrescribe sin `--force`. Excluye pruebas; la demo solo con `--demo` (`demoFiles` en `meta.json` para sus archivos de apoyo).
- **El registro no es de confianza:** `safeJoin` rechaza rutas absolutas o con `..`, y se valida todo el plan antes de escribir el primer archivo.
- **Prueba de autosuficiencia:** cada import relativo de un módulo debe apuntar a un archivo distribuido y cada paquete importado debe estar en `dependencies`. Comprobado también instalando los 10 módulos en un proyecto vacío con solo `motion react uqr` y compilando con TypeScript estricto.
- **axe-core en las 10 demos y el sitio**, con una prueba de control que demuestra que el auditor detecta fallos. `color-contrast` se omite porque jsdom no calcula estilos: se revisa en navegador.
- **Despliegue en GitHub Pages bajo subruta:** `BASE_PATH` en el build, `basename` del router, rutas de imágenes con `BASE_URL` (eran absolutas y se habrían roto) y `404.html` como respaldo de la SPA. Verificado sirviendo `dist/` bajo `/CodeVaultFront/` en Chrome: enlace directo, fotos, navegación y registro por HTTP.
- **No verificado:** que los workflows de GitHub Actions se ejecuten (solo se comprobó que el YAML es válido) ni la URL pública real, porque aún no se ha subido nada.

## 2026-10-14 · Módulos tomados de ShortCuts (repositorio de apuntes)
ShortCuts es una colección de apuntes y snippets sin pruebas; se tomaron solo las ideas que se podían convertir en módulo reutilizable y se reescribieron. Se descartó el resto (listados de municipios, scripts PHP de negocio, apuntes de red, Go) por no ser reutilizables o no pertenecer al front.
- **`hooks/use-web-storage`** (de `LocalStorage.js`; antes `use-local-storage`, ampliado con `useSessionStorage` el 2026-10-15 en un núcleo compartido `createStore`, con oyentes y respaldo propios por almacén, para no duplicar código; la misma clave en `local` y `session` no se pisa): `useSyncExternalStore`, sincronización entre pestañas, tolerancia a `localStorage` bloqueado o lleno. Bug hallado por las pruebas: con la cuota llena `setItem` falla pero `getItem` no, así que el respaldo en memoria se ignoraba al leer. Las opciones se guardan en una referencia para que `set` conserve su identidad sin desactivar el lint.
- **`ui/toast`** (de `Swal2.txt`): sustituye a SweetAlert2 para este caso. La barra de progreso *es* el temporizador (una animación de Motion), así que pausar por cursor o foco detiene ambos a la vez. Los errores no se cierran solos. Verificado en Chrome: la pausa con el cursor aguanta 5,5 s, la barra baja linealmente y el error persiste.
- **`ui/data-table`** (de `pagination.jsx`): sin `react-paginate` ni `moment`; la lógica de páginas es una función pura probada en los bordes.
- **`ui/numeric-input`** (de `inputNumberConText.jsx`): el truco `pattern` + `validity` rechazaba el texto pegado entero; ahora se limpia.
- **`lib/excel-date`** (de `parseExcelDate.js`): el original tenía el mes desfasado, un `+1` día «por la zona horaria» y descartaba la hora. Todo en UTC, con el error del 29-feb-1900 de Excel corregido.
- **`lib/local-time`** (de `timezone.js`): `Intl.DateTimeFormat` en lugar de un diccionario de zonas (que además asignaba «GMT-5» a «UTC»).
- **Guía `web-storage`** (notas de cookies vs. localStorage): corrige el límite de «10 MB» (depende del navegador, normalmente ~5 MB) y advierte de no guardar tokens en localStorage.
- **Nueva categoría `lib`** para utilidades sin interfaz.
- **Seguridad en el origen:** el archivo de apuntes de git del repositorio de origen contiene un token personal de GitHub en texto plano. No se copió; se avisó al usuario para que lo revoque.
