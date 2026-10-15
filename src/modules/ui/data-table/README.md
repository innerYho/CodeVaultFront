# Data Table

Tabla con ordenación por columna, paginación y estado vacío. Las piezas se pueden usar por separado.

## Cuándo usarlo

Listados de hasta unos miles de filas **ya cargadas en memoria**. Para decenas de miles o datos remotos, pagina y ordena en el servidor y usa solo `Pagination`.

## Instalación

Copia la carpeta; solo requiere React.

## Uso

```tsx
const columns: Column<Cliente>[] = [
  { key: "id", header: "Id", sortValue: (c) => c.id },
  { key: "name", header: "Nombre", sortValue: (c) => c.name },
  { key: "date", header: "Fecha", sortValue: (c) => c.date, render: (c) => fmt.format(c.date) },
];

<DataTable columns={columns} rows={clientes} getRowId={(c) => c.id} caption="Clientes" pageSize={24} />
```

Por separado, con paginación en el servidor:

```tsx
const [page, setPage] = useState(1);
<Pagination page={page} pageCount={data.pageCount} onPageChange={setPage} />
```

## API

`DataTable`, `Column`, `Pagination`, `usePagination(data, pageSize)` y `getPageRange(actual, total, vecinos)` (la lógica de «1 … 4 5 6 … 10», que es una función pura). Props en la tabla generada (`pnpm api`).

## Decisiones de diseño

El original usaba `react-paginate` con ~15 clases por componente, `moment` solo para formatear una fecha y `key={index}`. Aquí:

- **Sin dependencias:** `moment` está en mantenimiento y `Intl.DateTimeFormat` cubre el formato. La paginación son ~60 líneas que se pueden leer y adaptar.
- **Páginas desde 1 y ajuste automático:** si un filtro reduce los datos, la página actual se corrige en vez de quedar vacía.
- **Rango con puntos suspensivos como función pura**, probada en los bordes (no deja un «…» que ocultaría una sola página).
- **`getRowId` obligatorio:** usar el índice como `key` rompe el estado de las filas al ordenar.
- **Columnas como datos** (`Column<T>`) y celdas con `render`: la tabla no sabe nada del negocio.
- **Ordenación tri-estado** (ascendente → descendente → sin orden), comparación numérica «natural» (`a2 < a10`) y de fechas por valor, no por texto.
- **Estado vacío:** un mensaje en lugar de una tabla sin filas (el original devolvía `false` y no renderizaba nada).

## Accesibilidad

`<caption>` (oculto) con `aria-label`, `scope="col"`, `aria-sort` en la columna ordenada, botones reales para ordenar, `<nav aria-label>` en la paginación con `aria-current="page"` en la actual, etiquetas «Página 3» y contador «Mostrando 1–10 de 57» en una región `aria-live`. La región con scroll horizontal se alcanza con el teclado.

## Pruebas

`data-table.test.tsx`: rangos de página en los bordes, ajuste al encoger los datos, ordenación (números, fechas, texto natural, tres estados), paginación, estado vacío y atributos ARIA.
