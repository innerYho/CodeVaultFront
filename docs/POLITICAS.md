# Políticas del proyecto

## 1. Mejor implementación primero

Este proyecto es una biblioteca de referencia, no una copia de Hydra/Heimdall. **Si existe una forma mejor de implementar algo que en el origen, se implementa la mejor** y se deja constancia en dos sitios:

1. En la sección `## Decisiones de diseño` del README del módulo (qué cambia respecto al original y por qué).
2. En el registro de `docs/DECISIONES.md` si afecta a la arquitectura o a más de un módulo.

Un cambio de enfoque sin anotar se considera incompleto.

## 2. Un módulo, una carpeta

Todo vive junto: código, `README.md`, `meta.json`, `demo.tsx` y pruebas. Ver `docs/CONVENCIONES.md`.

## 3. Sin lógica de negocio

Los módulos no contienen nombres de campañas, roles, datos de empleados, URLs, credenciales ni reglas de un cliente. Lo que dependa del dominio entra por props o parámetros. Los datos de ejemplo son siempre ficticios.

## 4. Normalización obligatoria

`pnpm validate` debe pasar: valida archivos obligatorios, secciones del README y coherencia de `meta.json`. `INDEX.md` se genera con `pnpm index` y no se edita a mano.

## 5. Calidad mínima

- TypeScript estricto, sin `any` implícito.
- Accesibilidad: elementos nativos, etiquetas, foco visible, `prefers-reduced-motion`.
- Lint y formato con Biome (`pnpm lint`).
- Cada módulo con lógica no trivial lleva pruebas (Vitest).

## 6. Explicar antes que implementar

Conceptos grandes (p. ej. RBAC) se documentan como guías: qué es, cuándo usarlo, cuándo no. Solo se implementan si se pide expresamente.

## 7. Origen y confidencialidad

`meta.json#source` indica el origen de la idea, sin copiar código propietario ni datos. Antes de publicar un módulo, revisar que no filtre información interna.
