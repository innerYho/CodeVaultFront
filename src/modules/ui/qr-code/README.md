# QR Code

Dibuja un código QR como un solo `<path>` SVG.

## Cuándo usarlo

Pasar un enlace o un secreto del ordenador al móvil: la URI `otpauth://` del segundo factor, el enlace de vinculación de Telegram, un enlace de invitación.

## Instalación

Copia la carpeta; requiere `react` y `uqr`.

## Uso

```tsx
<QrCode value="https://t.me/MiBot?start=abc123" label="Código QR para abrir el bot de Telegram" />
<QrCode value={otpauthUri} label="Código QR para tu aplicación autenticadora" size={224} />
```

## API

Las propiedades se generan desde los tipos (`pnpm api`): `value`, `label` y `size`.

## Decisiones de diseño

- **Se genera en el navegador** con `uqr` (sin dependencias propias). Los servicios de QR por URL (`api.qrserver.com`…) reciben el contenido: inaceptable para un secreto de 2FA o un enlace de un solo uso.
- **Un único `<path>`** con `shape-rendering: crispEdges`: pocos nodos aunque el QR sea grande, y nítido a cualquier tamaño.
- **Fondo blanco fijo:** los lectores de QR necesitan contraste oscuro sobre claro; en modo oscuro no se invierte.
- **Se extrajo de `auth/login-2fa`** porque lo usa también `notify/telegram-alerts`. Así ninguno depende del otro entero.

## Accesibilidad

`role="img"` con `aria-label` obligatorio. Un QR no es accesible por sí solo: ofrece siempre el **mismo contenido como texto o enlace** al lado (`MfaSetup` muestra el secreto y la vinculación de Telegram, el enlace).

## Pruebas

`qr-code.test.tsx`: etiqueta accesible, tamaño, contenido distinto → dibujo distinto y que el SVG no cambie sin que cambie el valor.
