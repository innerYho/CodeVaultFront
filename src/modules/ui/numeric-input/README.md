# Numeric Input

Campo de texto que solo acepta números: teléfonos, documentos, valores.

## Cuándo usarlo

Cualquier dato que sea «solo dígitos» pero **no** una cantidad con la que se opera (teléfono, cédula, código postal). Para cantidades con flechas y pasos usa `<input type="number">`.

## Instalación

Copia la carpeta; solo requiere React.

## Uso

```tsx
const [phone, setPhone] = useState("");

<NumericInput label="Teléfono" value={phone} onValueChange={setPhone} maxLength={10} />
<NumericInput label="Valor" value={price} onValueChange={setPrice} decimal />
```

`sanitizeNumeric(texto, opciones)` está exportada por si necesitas la limpieza fuera de un campo (por ejemplo, al importar datos).

## API

Las propiedades se generan desde los tipos (`pnpm api`). Además admite las de un `<input>` (`name`, `required`, `disabled`…).

## Decisiones de diseño

El original usaba `pattern="[0-9]*"` y `setValue(e.target.validity.valid ? nuevo : anterior)`. Funciona al teclear, pero:

- **Rechaza el pegado entero:** pegar `300 123 4567` o `(300)…` se descarta completo porque no cumple el patrón. Aquí se **limpia** y queda `3001234567`.
- **`pattern` no limita nada por sí solo:** solo se evalúa al enviar el formulario; el truco de `validity` dependía de que el navegador lo calculara antes de `onChange`. La limpieza explícita es predecible.
- **`type="text"` + `inputMode="numeric"`:** mantiene los ceros a la izquierda (`type="number"` los pierde y admite `e`, `+`, `-`) y muestra el teclado numérico en móviles.
- **`maxLength` se aplica *después* de limpiar:** con el atributo nativo, pegar `(300) 123-4567` se cortaba en mitad del formato y se perdían dígitos.
- **Decimal con coma o punto**, normalizado a punto, un solo separador.
- **Valor siempre texto:** convertir a número es decisión de quien lo use.

Esto es comodidad, no seguridad: **valida siempre en el servidor** (el back usa Zod).

## Accesibilidad

Etiqueta visible asociada (`label`/`htmlFor`), ayuda enlazada con `aria-describedby`, `aria-invalid` cuando hay error y `autocomplete="off"` por defecto (cámbialo a `tel` o `cc-number` cuando corresponda). El color rojo del borde no es el único indicador: acompáñalo de texto en `hint`.

## Pruebas

`NumericInput.test.tsx`: limpieza de texto pegado, ceros a la izquierda, decimales, orden de `maxLength`, dígitos de ancho completo, etiqueta y ayuda.
