# Toast

Avisos breves en una esquina: «Guardado», «Campo id cliente es requerido».

## Cuándo usarlo

Confirmaciones y errores que no bloquean el flujo. Si la persona **debe** decidir algo, usa un diálogo (ver `Drawer`). Errores de un campo concreto van junto al campo (`hint` de `NumericInput`), no en un toast.

## Instalación

Copia la carpeta; requiere React y `motion`. Envuelve la app una vez:

```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

## Uso

```tsx
const { toast } = useToast();

toast({ title: "Cliente guardado", kind: "success" });
toast({ title: "Campo id cliente es requerido", kind: "error" }); // queda fijo hasta cerrarlo
toast({ title: "Sincronizando…", duration: 8000 });

const close = toast({ title: "Subiendo archivo", duration: 0 });
// … al terminar:
close();
```

## API

`<ToastProvider max?>` y `useToast()` → `{ toast(options) => cerrar }`. Opciones en la tabla generada (`pnpm api`).

## Decisiones de diseño

Reemplaza a SweetAlert2 (~65 kB) para este caso, con el mismo comportamiento que el snippet original (pausa al pasar el cursor, barra de progreso) y mejor accesibilidad:

- **La barra de progreso es el temporizador.** SweetAlert2 pausa un `setTimeout` y dibuja la barra aparte; aquí una sola animación de Motion hace ambas cosas, así que no se desincronizan.
- **Pausa también con el teclado:** al enfocar el aviso (o su botón de cerrar) el tiempo se detiene.
- **Los errores no se cierran solos** (`duration: 0` por defecto): leer un error no puede depender de la velocidad de lectura.
- **Con `max`** se descartan los más antiguos para no tapar la pantalla.
- **Hook, no estado global manual:** `toast()` se puede llamar desde cualquier manejador dentro del proveedor, y lanza un error claro si falta.

## Accesibilidad

Cada aviso es `role="status"` (educado: espera a que el lector termine) o `role="alert"` (errores: interrumpe). Botón de cerrar con nombre accesible, pausa por foco y no solo por ratón, y la barra es decorativa (`aria-hidden`). Con `prefers-reduced-motion`, Motion reduce el movimiento de entrada automáticamente según la configuración del sistema. Pendiente: tecla `Esc` para cerrar el más reciente.

## Pruebas

`toast.test.tsx`: roles según el tipo, cierre manual, cierre automático, errores fijos, límite `max`, cierre programático y error sin proveedor.
