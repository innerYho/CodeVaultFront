# Drawer

Panel lateral modal; el patrón típico del menú de navegación en móvil.

## Cuándo usarlo

Menús de navegación en pantallas pequeñas, filtros y paneles de detalle que no deben ocupar espacio fijo.

## Instalación

Copia la carpeta y ejecuta `pnpm add motion`.

## Uso

```tsx
const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)} aria-label="Abrir menú">☰</button>
<Drawer open={open} onClose={() => setOpen(false)} label="Menú de navegación">
  <Nav />
</Drawer>
```

## API

La tabla de props se genera automáticamente desde los tipos (`pnpm api`).

## Decisiones de diseño

- **`<dialog>` nativo:** foco atrapado, `Escape`, fondo inerte y capa superior sin reimplementarlos. Los menús laterales de Hydra y Heimdall eran un `div` con `z-index` y ningún comportamiento de teclado.
- **El contenido se monta solo abierto**, así se reinicia el estado interno al cerrar y no se pagan renders ocultos.
- **Muelle con Motion** para la entrada; con `prefers-reduced-motion` solo hay fundido.
- **Controlado (`open`/`onClose`)**: quien lo usa decide cuándo cerrar, por ejemplo al cambiar de ruta.
- **Sin animación de salida**, por la misma razón que en `command-palette`.

## Accesibilidad

Rol de diálogo modal con nombre accesible (`label`). El foco entra al abrir y vuelve al elemento que lo abrió al cerrar (comportamiento nativo). Se cierra con `Escape` o pulsando el fondo; ofrece además un botón de cierre dentro del contenido si el panel es largo.

## Pruebas

`drawer.test.tsx`: montaje condicional y cierre por el fondo sin cerrar al pulsar el contenido.
