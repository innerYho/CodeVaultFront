import { act, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type Column, DataTable, getPageRange, usePagination } from "./index";

describe("getPageRange", () => {
  it("muestra todas las páginas si caben", () => {
    expect(getPageRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageRange(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("pone puntos suspensivos en los extremos", () => {
    expect(getPageRange(1, 10)).toEqual([1, 2, null, 10]);
    expect(getPageRange(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(getPageRange(10, 10)).toEqual([1, null, 9, 10]);
  });
  it("no oculta una sola página detrás de «…»", () => {
    expect(getPageRange(4, 10)).toEqual([1, 2, 3, 4, 5, null, 10]);
    expect(getPageRange(7, 10)).toEqual([1, null, 6, 7, 8, 9, 10]);
  });
  it("sin páginas devuelve vacío", () => {
    expect(getPageRange(1, 0)).toEqual([]);
  });
});

describe("usePagination", () => {
  const data = Array.from({ length: 25 }, (_, i) => i + 1);
  it("calcula páginas y rango visible", () => {
    const { result } = renderHook(() => usePagination(data, 10));
    expect(result.current.pageCount).toBe(3);
    expect(result.current.items).toHaveLength(10);
    expect([result.current.from, result.current.to]).toEqual([1, 10]);
    act(() => result.current.setPage(3));
    expect(result.current.items).toEqual([21, 22, 23, 24, 25]);
    expect([result.current.from, result.current.to]).toEqual([21, 25]);
  });
  it("limita setPage al rango válido", () => {
    const { result } = renderHook(() => usePagination(data, 10));
    act(() => result.current.setPage(99));
    expect(result.current.page).toBe(3);
    act(() => result.current.setPage(-4));
    expect(result.current.page).toBe(1);
  });
  it("se corrige si los datos encogen", () => {
    const { result, rerender } = renderHook(({ d }) => usePagination(d, 10), {
      initialProps: { d: data },
    });
    act(() => result.current.setPage(3));
    rerender({ d: data.slice(0, 5) });
    expect(result.current.page).toBe(1);
    expect(result.current.items).toHaveLength(5);
  });
  it("sin datos: página 1 de 1 y rango 0", () => {
    const { result } = renderHook(() => usePagination([], 10));
    expect([
      result.current.page,
      result.current.pageCount,
      result.current.from,
      result.current.to,
    ]).toEqual([1, 1, 0, 0]);
  });
});

interface Row {
  id: number;
  name: string;
  date: Date;
}
const rows: Row[] = [
  { id: 10, name: "item10", date: new Date("2024-03-01") },
  { id: 2, name: "item2", date: new Date("2024-01-01") },
  { id: 33, name: "item1", date: new Date("2024-02-01") },
];
const columns: Column<Row>[] = [
  { key: "id", header: "Id", sortValue: (r) => r.id },
  { key: "name", header: "Nombre", sortValue: (r) => r.name },
  {
    key: "date",
    header: "Fecha",
    sortValue: (r) => r.date,
    render: (r) => r.date.toISOString().slice(0, 10),
  },
];
const names = () =>
  within(screen.getAllByRole("rowgroup")[1] as HTMLElement)
    .getAllByRole("row")
    .map((r) => r.children[1]?.textContent);

describe("<DataTable />", () => {
  it("renderiza filas y encabezados con scope", () => {
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Clientes" />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(names()).toEqual(["item10", "item2", "item1"]);
  });
  it("ordena numéricamente (2 < 10) y alterna asc → desc → original", () => {
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Clientes" />);
    const header = screen.getByRole("columnheader", { name: /Id/ });
    const sortBtn = within(header).getByRole("button");
    fireEvent.click(sortBtn);
    expect(names()).toEqual(["item2", "item10", "item1"]);
    expect(header.getAttribute("aria-sort")).toBe("ascending");
    fireEvent.click(sortBtn);
    expect(names()).toEqual(["item1", "item10", "item2"]);
    expect(header.getAttribute("aria-sort")).toBe("descending");
    fireEvent.click(sortBtn);
    expect(names()).toEqual(["item10", "item2", "item1"]);
    expect(header.getAttribute("aria-sort")).toBeNull();
  });
  it("ordena texto de forma natural y fechas por valor", () => {
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Clientes" />);
    fireEvent.click(
      within(screen.getByRole("columnheader", { name: /Nombre/ })).getByRole("button"),
    );
    expect(names()).toEqual(["item1", "item2", "item10"]);
    fireEvent.click(
      within(screen.getByRole("columnheader", { name: /Fecha/ })).getByRole("button"),
    );
    expect(names()).toEqual(["item2", "item1", "item10"]);
  });
  it("pagina y anuncia el rango", () => {
    const many = Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      name: `n${i + 1}`,
      date: new Date(0),
    }));
    render(
      <DataTable
        columns={columns}
        rows={many}
        getRowId={(r) => r.id}
        caption="Muchos"
        pageSize={10}
      />,
    );
    expect(screen.getByText("Mostrando 1–10 de 23")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
    expect(screen.getByText("Mostrando 21–23 de 23")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Página 3" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(
      (screen.getByRole("button", { name: "Página siguiente" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
  it("muestra un estado vacío en lugar de una tabla", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        caption="Vacía"
        empty="Sin clientes"
      />,
    );
    expect(screen.getByRole("status").textContent).toBe("Sin clientes");
    expect(screen.queryByRole("table")).toBeNull();
  });
  it("no pinta paginación si hay una sola página", () => {
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} caption="Pocos" />);
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
