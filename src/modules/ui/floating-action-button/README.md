# Floating Action Button

Botón flotante con contador (badge) y panel de acciones opcional.

## Cuándo usarlo

Acceso rápido a una acción o a una cola de pendientes que debe estar visible en toda la app (nueva solicitud, asistente, alertas).

## Instalación

Copia la carpeta y ejecuta `pnpm add motion`. Requiere Tailwind.

## Uso

```tsx
<FloatingActionButton
  label="Acciones rápidas"
  icon={<PlusIcon />}
  badge={pendientes}
  tone="danger"
  actions={[{ id: "new", label: "Nueva solicitud", onSelect: crear }]}
/>
```

Sin `actions`, el botón ejecuta `onClick` directamente.

## API

La tabla de props se genera automáticamente desde los tipos (`pnpm api`) y aparece al final de esta página. Sin `actions`, el botón ejecuta `onClick` directamente.

## Decisiones de diseño

Frente a `PideTuSimFlotante` de Hydra, que mezclaba UI, permisos, navegación y polling en un solo archivo:

- **El componente solo hace UI.** Los datos (conteo, permisos, polling) los aporta quien lo usa mediante props, así que es reutilizable.
- **Resultado:** el cálculo de pendientes y el horario de consulta, que eran lógica de negocio, no forman parte del módulo.
- Cierre con `Escape` y clic fuera, `aria-expanded`/`aria-controls`, y `prefers-reduced-motion` respetado.
- Animación con resortes de Motion para el panel y el badge, en lugar de transiciones CSS manuales.

## Accesibilidad

Botones nativos, etiqueta obligatoria, estado expandido anunciado y foco visible.

## Notas

Usa `z-50`. Si tu app tiene modales por encima, ajusta la capa.
