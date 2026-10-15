# Hora local

Un evento ocurre a las 18:00 UTC. Cada persona debería verlo en su hora: 1:00 p. m. en Bogotá, 7:00 p. m. en Madrid.

## Cuándo usarlo

Mostrar horarios de eventos, cierres de campaña o turnos a personas en distintas zonas.

## Instalación

Copia la carpeta; no tiene dependencias.

## Uso

```ts
formatLocalTime(1709575200000);                                   // "1:00 p. m. GMT-5" (según el dispositivo)
formatLocalTime("2024-03-04T18:00:00Z", { timeZone: "Europe/Madrid" });
formatLocalTime(date, { withDate: true, withZone: false });
getTimeZone();                                                    // "America/Bogota"
```

## API

`formatLocalTime(instante, options?)` acepta ms, texto ISO o `Date`. Opciones: `locale`, `timeZone`, `withDate`, `withZone`. `getTimeZone()` devuelve la zona IANA del dispositivo. Lanza `RangeError` si la fecha es inválida.

## Decisiones de diseño

La versión original calculaba `getTimezoneOffset() / 60`, armaba `GMT+n` a mano y lo traducía con un diccionario (`"GMT-5": "UTC"`, que además es incorrecto: GMT-5 no es UTC). Falla con zonas de media hora (India, `GMT+5:30`) y con el horario de verano. Aquí:

- **`Intl.DateTimeFormat` hace todo:** conoce las reglas de cada zona, el horario de verano y el idioma. No hay tablas que mantener.
- **Se guarda el instante, se formatea al mostrar:** guarda siempre UTC o milisegundos; convierte solo en la interfaz.
- **Zona explícita opcional:** para mostrar la hora *de la sede* y no la del dispositivo, pasa `timeZone`.
- **Sin manipular el DOM:** el original reemplazaba el `innerHTML` de su propio `<script>`.

## Accesibilidad

Incluye siempre la zona (`withZone`, activo por defecto) para evitar ambigüedad. Si usas `<time>`, pon el instante ISO en `dateTime`: `<time dateTime={iso}>{formatLocalTime(iso)}</time>`.

## Pruebas

`local-time.test.ts`: misma hora en distintas zonas, tipos de entrada, opciones y fechas inválidas.
