# Parallax con scroll

Efecto de profundidad: las capas se mueven a velocidades distintas al hacer scroll.

## Cuándo usarlo

Cabeceras (*hero*), portadas y secciones narrativas, donde un efecto sutil refuerza la sensación de profundidad. Es decoración: nunca debe transportar información.

## Instalación

Copia la carpeta y ejecuta `pnpm add motion`.

## Uso

```tsx
<div className="relative h-96 overflow-hidden">
  <Parallax distance={120} className="absolute inset-0">   {/* fondo: lejano, más lento */}
    <Stars />
  </Parallax>
  <Parallax distance={-60} className="absolute bottom-0">  {/* primer plano: cercano, más rápido */}
    <Hills />
  </Parallax>
</div>
```

El contenedor debe tener `overflow-hidden` para recortar lo que se sale al moverse. Para usarlo con tu propio elemento: `const y = useParallax(ref, 80)` y pásalo a `style={{ y }}` de un `motion.div`.

## API

La tabla de props se genera automáticamente desde los tipos (`pnpm api`).

**Signo de `distance`:** positivo = capa lejana (se mueve **más lento** que el scroll); negativo = capa cercana (**más rápida**). Cuanto mayor el valor absoluto, más pronunciado.

## Decisiones de diseño

- **Ligado al scroll con `useScroll` + `useTransform`, no con un listener de `scroll`:** Motion actualiza el valor sin pasar por el estado de React (cero re-renders durante el scroll) y usa la API nativa de líneas de tiempo de scroll cuando el navegador la ofrece.
- **Solo se anima `transform`**, que se compone en la GPU sin recalcular el diseño. Nunca se animan `top`/`margin`.
- **Cada capa es independiente**: el efecto sale de combinar varias con distancias distintas, no de un componente "escena" rígido.
- **Rango relativo al elemento** (de que entra por abajo a que sale por arriba), por lo que funciona en cualquier punto de la página.
- **Suavizado opcional** con un muelle: da inercia, pero añade retardo; por defecto está desactivado.
- **Sin dependencia de imágenes ni de un tamaño fijo:** la capa es cualquier contenido.

### Alternativa sin JavaScript

Los navegadores modernos admiten animaciones ligadas al scroll en CSS (`animation-timeline: scroll()` / `view()`), que corren fuera del hilo principal. El soporte aún no es universal (consulta caniuse), por eso este módulo usa Motion, que ofrece el mismo resultado en todos los navegadores.

## Accesibilidad

Con `prefers-reduced-motion: reduce` el desplazamiento es 0 y el contenido queda estático. El parallax es puramente decorativo: no pongas en una capa en movimiento texto esencial que el usuario deba leer mientras se desplaza, y marca con `aria-hidden` las capas puramente visuales. Evita distancias grandes (más de ~150 px): el movimiento amplio puede causar mareo en algunas personas.

## Pruebas

`parallax.test.tsx`: renderizado con transformación y comportamiento con movimiento reducido. El efecto visual real depende del layout del navegador y se comprueba en la demo.
