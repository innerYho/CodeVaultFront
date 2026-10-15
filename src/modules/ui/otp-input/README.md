# OTP Input

Campo para introducir códigos numéricos de un solo uso (6 dígitos por defecto) en casillas separadas.

## Cuándo usarlo

Segundo factor (TOTP), verificación por SMS o correo, y cualquier código corto de verificación.

## Instalación

Copia la carpeta; solo requiere React y Tailwind.

## Uso

```tsx
const [code, setCode] = useState("");

<OtpInput value={code} onChange={setCode} onComplete={(c) => verify(c)} autoFocus />
```

## API

La tabla de props se genera automáticamente desde los tipos (`pnpm api`).

## Decisiones de diseño

- **Un valor, no seis estados:** el componente es controlado con un único `string`. Es más fácil de validar y de limpiar tras un error.
- **Sin huecos:** si el usuario hace clic en una casilla posterior, el foco vuelve a la primera vacía. El valor siempre es contiguo.
- **Pegado y autocompletado:** pegar un código lo reemplaza entero; el autocompletado de iOS/Android (`autocomplete="one-time-code"`) entrega todos los dígitos de golpe en la primera casilla y se reparten solos. `maxLength` permite esto.
- **`onComplete` una sola vez** al llegar a la longitud, para enviar sin pulsar un botón.
- **Teclado completo:** Backspace borra y retrocede, las flechas mueven el foco.
- **Teclado móvil numérico** con `inputMode="numeric"` (sin `type="number"`, que quita ceros iniciales y añade flechas).

## Accesibilidad

El grupo tiene `role="group"` y etiqueta; cada casilla anuncia su posición ("dígito 3 de 6"). `aria-invalid` cuando hay error y foco visible. Pensado para usarse junto a un mensaje con `role="alert"` (ver `auth/login-2fa`).

## Pruebas

`OtpInput.test.tsx`: escritura, letras ignoradas, pegado, autocompletado y Backspace.
