# Almacenamiento web

## Qué es

Los navegadores ofrecen varios sitios donde guardar datos del lado del cliente. Cada uno tiene un alcance, un tamaño y un perfil de riesgo distintos.

| | Cookie | `localStorage` | `sessionStorage` | IndexedDB |
| --- | --- | --- | --- | --- |
| Tamaño aproximado | ~4 KB por cookie | ~5 MB por origen (varía) | ~5 MB | cientos de MB |
| Caduca | Sí (`Expires`/`Max-Age`) | Nunca | Al cerrar la pestaña | Nunca |
| Se envía al servidor | **Sí, en cada petición** | No | No | No |
| Legible desde JavaScript | No si es `httpOnly` | Siempre | Siempre | Siempre |
| API | Texto (`document.cookie` o cabeceras) | Síncrona, solo texto | Síncrona, solo texto | Asíncrona, objetos |

Las notas originales hablaban de «10 MB» para `localStorage`: el límite real depende del navegador (normalmente unos 5 MB) y puede ser menor. No cuentes con él.

## Cuándo usarla

- **Cookie `httpOnly; Secure; SameSite=Strict`:** sesión y tokens de autenticación. JavaScript no puede leerla, así que un fallo XSS no roba la sesión. Es lo que hace el módulo `auth/mfa-login` del back.
- **`localStorage`:** preferencias que no importan si alguien las lee: tema, ciudad elegida, filtros. Módulo: `useLocalStorage` (ver `hooks/use-web-storage`).
- **`sessionStorage`:** estado que solo debe vivir en esa pestaña (un asistente de varios pasos, un borrador). Módulo: `useSessionStorage`, en el mismo `hooks/use-web-storage`.
- **IndexedDB:** datos grandes o estructurados, uso sin conexión, archivos.

## Cuándo no usarla

- **Nunca guardes tokens, contraseñas ni datos personales en `localStorage`:** cualquier script de la página (una dependencia comprometida, un XSS) puede leerlos y enviarlos fuera.
- No lo uses como base de datos ni como fuente de verdad: el usuario puede editarlo, borrarlo o perderlo (modo privado, limpieza del navegador). Valida lo que leas, porque puede estar corrupto o manipulado.
- No esperes sincronización entre dispositivos: es local a ese navegador.
- Las cookies viajan en cada petición: no guardes en ellas datos grandes.

## Ejemplo

```tsx
// Preferencia de interfaz: localStorage
const [city, setCity] = useLocalStorage("city", 1);

// Estado de esta pestaña: sessionStorage
const [step, setStep] = useSessionStorage("wizard:step", 1);

// Sesión: la gestiona el servidor con una cookie httpOnly (el front no la toca)
await fetch("/auth/login", { method: "POST", credentials: "include", body });
```

El código del que parte este módulo mezclaba `getItem` con `setItem` en una expresión (`setItem` devuelve `undefined`) y manipulaba el DOM a mano; los hooks de `hooks/use-web-storage` resuelven eso.

## Alternativas

- **Estado en la URL** (`?ciudad=2`): compartible y reproducible; mejor que `localStorage` para filtros que alguien querría enlazar.
- **Estado del servidor** (preferencias en la base de datos): sigue a la persona entre dispositivos.
- **Cache API / Service Workers:** recursos y respuestas para trabajar sin conexión.

## Referencias

- MDN: [Web Storage API](https://developer.mozilla.org/docs/Web/API/Web_Storage_API), [Using HTTP cookies](https://developer.mozilla.org/docs/Web/HTTP/Cookies)
- OWASP: [HTML5 Security Cheat Sheet — Local Storage](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)
