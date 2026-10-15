# Login con 2FA

Flujo de inicio de sesión en dos pasos y asistente para activar el segundo factor. Pensado para usarse con `auth/mfa-login` del back, pero acepta cualquier backend que implemente la interfaz `AuthClient`.

## Cuándo usarlo

Apps que ya tienen (o van a tener) cuentas con contraseña y quieren pedir un código de una app autenticadora (TOTP) además de la contraseña.

## Instalación

1. Copia esta carpeta y `ui/otp-input`.
2. `pnpm add motion uqr`.
3. Sirve el front y el back bajo el mismo sitio (o configura CORS con credenciales): la sesión viaja en una cookie `httpOnly`.

## Uso

```tsx
import { Login2FA, MfaSetup, createAuthClient } from "./login-2fa";

const client = createAuthClient({ baseUrl: "/auth" });

<Login2FA client={client} onAuthenticated={(user) => navigate("/")} />

// Con la sesión iniciada, en ajustes de seguridad:
<MfaSetup client={client} onDone={() => toast("2FA activado")} />
```

Para probar sin backend: `createMockAuthClient()` (ver `mock-client.ts` y la pestaña Demo).

## Flujo

```
credenciales ──► (sin 2FA) ───────────────► done
     │
     └──► (con 2FA) mfa ──► código / recuperación ──► done
                     └── desafío caducado ──► credenciales
```

El estado vive en una máquina explícita (`login-flow.ts`) y es independiente de React, por lo que se prueba sin renderizar.

## API

Las props de los componentes se generan automáticamente desde los tipos (`pnpm api`). Además:

- `AuthClient`: la interfaz que debes implementar (`login`, `verifyMfa`, `beginMfaSetup`, `enableMfa`).
- `createAuthClient({ baseUrl?, fetch? })`: implementación con `fetch` para `auth/mfa-login`.
- `useLoginFlow(client)`: el hook, si quieres tu propia interfaz.
- `AuthApiError`: error con `code`, `status` y `retryAfter`.

## Decisiones de diseño

Frente a `Login.jsx` + `Setup2FA.jsx` + `Validate2FA.jsx` de Hydra (~880 líneas con preguntas de seguridad):

- **Máquina de estados en lugar de varios `useState` booleanos**: no existen combinaciones imposibles (p. ej. "mostrar 2FA" y "cargando credenciales" a la vez).
- **El front no conoce la red:** depende de la interfaz `AuthClient`. Se sustituye por un simulacro en demos y pruebas, y por `fetch` en producción.
- **Sin token en el cliente:** no se guarda nada en `localStorage`; la sesión es una cookie `httpOnly` que JavaScript no puede leer.
- **El QR se genera en el navegador** (`uqr`, ~2 KB como un `<path>` SVG), así el secreto no se envía a servicios externos de QR, algo habitual y peligroso.
- **Códigos de recuperación como paso obligatorio** del enrolamiento: no se puede terminar sin marcar que se guardaron; se pueden copiar o descargar.
- **Envío automático al completar** los 6 dígitos (`OtpInput.onComplete`), con alternativa de código de recuperación.
- **Mensajes por código de error**, sobrescribibles con `messages` (i18n o textos de marca). Nunca se muestra el texto crudo del servidor.
- **Mensajes genéricos:** "correo o contraseña incorrectos", sin revelar cuál falló.

## Accesibilidad

Etiquetas asociadas a cada campo, `autocomplete="username"`/`current-password`/`one-time-code` (gestores de contraseñas y autocompletado del SO funcionan), errores en `role="alert"` anunciados al aparecer, foco automático en el primer campo de cada paso, `prefers-reduced-motion` respetado y todo operable con teclado.

## Pruebas

`login-2fa.test.tsx`: transiciones del reductor, flujo completo con y sin 2FA, errores visibles y el cliente `fetch` (cookie incluida y traducción de errores).
