# Escena de capas

Composición de capas con profundidad real: cada una reacciona al scroll **y** al ratón según su distancia. Incluye siluetas de montañas y pinos generadas por código, sin imágenes ni licencias.

## Cuándo usarlo

Portadas y cabeceras ilustradas. Es un recurso decorativo para dar atmósfera; no la uses para presentar información importante.

## Instalación

Copia la carpeta y `ui/parallax`, y ejecuta `pnpm add motion`.

## Uso

```tsx
<ParallaxScene
  label="Paisaje de montañas al atardecer"
  layers={[
    { id: "sol", depth: 0.1, children: <Sun /> },
    { id: "lejos", depth: 0.3, top: "25%", children: <Ridge seed={11} color="#6d3d7c" topColor="#a45f8e" /> },
    { id: "cerca", depth: 0.8, top: "60%", children: <Ridge seed={99} color="#1a1030" /> },
    { id: "pinos", depth: 0.95, top: "78%", children: <Pines color="#0d0720" /> },
  ]}
>
  <h1>Título fijo</h1>
</ParallaxScene>
```

`depth` va de 0 (fondo) a 1 (primer plano). Para que una capa ocupe solo la parte inferior usa `top` (p. ej. `top: "40%"`); si no, ocupa toda la altura. Las capas pueden ser cualquier cosa: SVG, `<img>`, un `div` con degradado. Con imágenes PNG con transparencia por capas se logra el mismo efecto con fotografía.

## API

La tabla de props se genera automáticamente desde los tipos (`pnpm api`).

- **`Ridge`**: cordillera a todo el ancho. Misma `seed`, misma silueta. `roughness` controla lo escarpada que es.
- **`Pines`**: hilera de pinos.
- `ridgeHeights`, `mulberry32`: el generador, por si quieres dibujar tus propios perfiles.

## Decisiones de diseño

- **Profundidad como un solo número (`depth`)** que gobierna scroll y puntero a la vez, en lugar de configurar cada capa por separado: el efecto es coherente por construcción.
- **Sentidos opuestos por scroll:** las capas lejanas van más lentas que el scroll y las cercanas más rápidas, que es lo que el ojo interpreta como distancia. Reutiliza `ui/parallax` para no duplicar la lógica.
- **Con el ratón, lo cercano se mueve más y en sentido contrario**, como cuando asomas la cabeza para mirar. Se suaviza con un muelle para que no se vea nervioso.
- **Siluetas generadas con desplazamiento del punto medio** y un generador pseudoaleatorio con semilla: sin archivos, sin licencias, peso casi nulo y resultado reproducible.
- **Perspectiva atmosférica en la demo:** las montañas lejanas son más claras y de tono más cálido, y las cercanas más oscuras. Es la regla de pintura que más contribuye a la sensación de profundidad.
- **Margen extra (`bleed`)** alrededor de cada capa para que no asomen los bordes al moverse.
- **Orden de apilado por profundidad** (la cercana, encima), sin que importe el orden del arreglo.
- **Solo `transform`**: sin animar `top`/`left`; se compone en la GPU.
- **Límites:** `preserveAspectRatio="none"` estira las siluetas con el contenedor; en proporciones muy distintas a 16:9 las montañas se deforman. Con el puntero no hay equivalente táctil (podría añadirse con el giroscopio).

## Accesibilidad

Sin `label`, la escena es decorativa y se oculta a los lectores de pantalla. Con `label` se expone como una imagen descrita. Con `prefers-reduced-motion` desaparece el efecto del ratón y del scroll. Texto esencial: ponlo en `children` (no se mueve) y cuida el contraste contra el fondo.

## Pruebas

`parallax-scene.test.tsx`: determinismo del generador, forma del trazo, número de árboles, orden de apilado, límite de profundidad, accesibilidad y robustez del puntero. El movimiento real depende del layout del navegador y se comprueba en la demo.
