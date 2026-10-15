# Fechas de Excel

Al leer un `.xlsx` o `.csv` exportado, las fechas llegan como números (`45292`) en vez de texto. Este módulo los convierte a `Date` y de vuelta.

## Cuándo usarlo

Importación masiva desde Excel (cargas de ventas, listados de clientes). Si el archivo ya trae fechas en texto ISO, no lo necesitas.

## Instalación

Copia la carpeta; no tiene dependencias.

## Uso

```ts
excelSerialToDate(45292);                    // 2024-01-01T00:00:00.000Z
toIsoDate(excelSerialToDate(45292.5));       // "2024-01-01"
excelSerialToDate(45292.5).toISOString();    // "2024-01-01T12:00:00.000Z"  (0.5 = mediodía)
excelSerialToDate(0, { date1904: true });    // libros de Excel para Mac antiguo
dateToExcelSerial(new Date("2024-01-01"));   // 45292
```

## API

| Función | Qué hace |
| --- | --- |
| `excelSerialToDate(serial, options?)` | Número de serie → `Date` (UTC). Lanza `RangeError` si no es finito. |
| `dateToExcelSerial(date, options?)` | `Date` → número de serie. |
| `toIsoDate(date)` | `yyyy-mm-dd` en UTC. |

`options.date1904` activa el sistema de fechas 1904.

## Decisiones de diseño

La versión original devolvía `dd/m/yyyy` con tres problemas, todos corregidos:

- **Meses desfasados:** usaba `getMonth()`, que cuenta desde 0, así que enero salía como mes 0.
- **Parche de zona horaria:** sumaba `+1` al día "porque en Colombia sale un día antes". El problema real era mezclar un instante UTC con métodos locales (`getDate()`). Aquí todo es UTC y el resultado no depende de dónde se ejecute (hay una prueba con `TZ=America/Bogota`). El `+1` además se rompía a fin de mes (`32/…`).
- **Hora ignorada:** la fracción del día se descartaba. Ahora se conserva, redondeada al milisegundo para evitar `00:00:00.999`.
- **Año bisiesto fantasma:** Excel cree que 1900 fue bisiesto (herencia de Lotus 1-2-3). Los seriales 1–59 se corrigen para que coincidan con el calendario real.
- **Devuelve `Date`, no un texto:** formatear es otra responsabilidad (`toIsoDate`, `Intl.DateTimeFormat`, o el módulo *Hora local*).

Mismo principio de la política de zonas horarias del proyecto: nunca construyas la fecha "de ahora" con `toISOString()` si la vas a guardar en una columna `DATE` local.

## Accesibilidad

No aplica (utilidad sin interfaz). Al mostrar fechas, usa formatos legibles por personas y por lectores de pantalla, no el serial.

## Pruebas

`excel-date.test.ts`: fechas conocidas, febrero de 1900, fracciones, redondeo, sistema 1904, valores inválidos, inversa e independencia de la zona horaria.
