# useLocalStorage y useSessionStorage

Como `useState`, pero el valor se conserva al recargar y se mantiene sincronizado entre componentes. Dos hooks con la misma API y distinta duración.

| | `useLocalStorage` | `useSessionStorage` |
| --- | --- | --- |
| Dura | Hasta que se borre (sobrevive a cerrar el navegador) | Mientras la pestaña esté abierta (sobrevive a recargarla) |
| Alcance | Todas las pestañas del mismo origen | Solo esa pestaña |
| Sincroniza entre pestañas | Sí (evento `storage`) | No: cada pestaña tiene el suyo |
| Ejemplos | Tema, ciudad elegida, filtros guardados | Paso de un asistente, borrador de un formulario, pestaña activa |

## Cuándo usarlo

Preferencias y estado de interfaz. **No** para tokens de sesión ni datos sensibles: usa una cookie `httpOnly` (ver la guía *Almacenamiento web*).

Regla práctica: si la persona espera encontrarlo al volver mañana, `local`; si debe empezar de cero en una pestaña nueva, `session`.

## Instalación

Copia la carpeta; solo requiere React.

## Uso

```tsx
const [city, setCity, resetCity] = useLocalStorage("city", 1);
const [step, setStep] = useSessionStorage("wizard:step", 1);

<button onClick={() => setCity(2)}>Barranquilla</button>
<button onClick={() => setStep((s) => s + 1)}>Siguiente</button>
<button onClick={resetCity}>Restablecer</button>
```

Valores no JSON (fechas, `Set`…): pasa `serialize` y `deserialize`. Fuera de React: `readRaw(clave, "local" | "session")`.

## API

`useLocalStorage<T>(key, initial, options?)` y `useSessionStorage<T>(key, initial, options?)` devuelven `[valor, setValor, borrar]`. `setValor` acepta un valor o una función `(actual) => nuevo`, como `useState`. Opciones en la tabla generada (`pnpm api`).

## Decisiones de diseño

El código original hacía `localStorage.getItem(...) ? ... : localStorage.setItem(...)` (que **devuelve `undefined`**), comparaba con `==` un texto contra un número y manipulaba el DOM a mano. Aquí:

- **Un solo núcleo, dos almacenes.** `local` y `session` comparten la lógica (`createStore`) pero cada uno tiene sus propios oyentes y su propio respaldo en memoria: la misma clave en ambos no se pisa (hay una prueba).
- **`useSyncExternalStore`:** la forma oficial de leer un almacén externo; evita parpadeos y desajustes. Todos los componentes con la misma clave se actualizan a la vez.
- **Pestañas:** en `local` escucha el evento `storage`, que solo llega a *otras* pestañas (en la misma se avisa internamente). `sessionStorage` es propio de cada pestaña, por diseño del navegador: no hay nada que sincronizar.
- **Snapshot primitivo:** el texto crudo es el snapshot, así no hay bucles de render por objetos nuevos.
- **Actualizaciones funcionales correctas:** `set(v => v + 1)` dos veces seguidas suma 2 porque lee del almacenamiento, no de un cierre viejo.
- **Tolera fallos:** acceder a `window.localStorage` puede lanzar (cookies bloqueadas), `setItem` falla con la cuota llena y el JSON guardado puede estar corrupto. En todos los casos no rompe: usa memoria o el valor inicial.
- **SSR:** en el servidor devuelve `initial`; el cliente se actualiza tras hidratar sin errores de desajuste.
- **Sin tipado falso:** `deserialize` no valida. Si el formato puede cambiar entre versiones, valida con Zod en `deserialize`.
- **Aviso sobre `sessionStorage`:** al duplicar una pestaña el navegador copia su contenido, pero después son independientes; y al abrir un enlace con `target="_blank"` la pestaña nueva parte con una copia. No lo uses como canal entre pestañas.

## Accesibilidad

No aplica directamente. Si persistes preferencias de accesibilidad (tamaño de letra, movimiento reducido), respétalas desde el primer render.

## Pruebas

`web-storage.test.tsx`: lectura, escritura, función actualizadora, sincronización entre componentes y por evento `storage`, JSON corrupto, almacenamiento que lanza, borrado, serializadores propios, y para `session`: aislamiento respecto a `local`, claves iguales sin pisarse y recarga.
