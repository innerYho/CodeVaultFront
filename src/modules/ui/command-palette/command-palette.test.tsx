import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type CommandItem, CommandPalette } from "./CommandPalette";
import { normalize, searchItems } from "./search";

const items: CommandItem[] = [
  {
    id: "1",
    title: "Theme Toggle",
    description: "Botón día/noche",
    keywords: ["dark", "modo oscuro"],
    group: "ui",
  },
  { id: "2", title: "Login con 2FA", description: "Autenticación en dos pasos", group: "auth" },
  { id: "3", title: "Hono", description: "Framework web", group: "guides" },
];

describe("searchItems", () => {
  it("ignora tildes y mayúsculas", () => {
    expect(normalize("Autenticación")).toBe("autenticacion");
    expect(searchItems(items, "AUTENTICACION").map((i) => i.id)).toEqual(["2"]);
  });
  it("busca en palabras clave y grupo", () => {
    expect(searchItems(items, "dark").map((i) => i.id)).toEqual(["1"]);
    expect(searchItems(items, "guides").map((i) => i.id)).toEqual(["3"]);
  });
  it("exige que coincidan todas las palabras", () => {
    expect(searchItems(items, "login oscuro")).toEqual([]);
    expect(searchItems(items, "theme dark").map((i) => i.id)).toEqual(["1"]);
  });
  it("ordena por relevancia: el título pesa más que la descripción", () => {
    const list = [
      { id: "a", title: "Otro", description: "usa hono aquí" },
      { id: "b", title: "Hono" },
    ];
    expect(searchItems(list, "hono").map((i) => i.id)).toEqual(["b", "a"]);
  });
  it("sin consulta devuelve todo en el orden original", () => {
    expect(searchItems(items, "  ")).toBe(items);
  });
});

describe("CommandPalette", () => {
  const openIt = () => fireEvent.keyDown(window, { key: "k", ctrlKey: true });

  it("se abre con el atajo, filtra y selecciona con Enter", () => {
    const onSelect = vi.fn();
    render(<CommandPalette items={items} onSelect={onSelect} />);
    openIt();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "hono" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(items[2]);
  });

  it("las flechas mueven la selección con vuelta circular", () => {
    render(<CommandPalette items={items} onSelect={() => {}} />);
    openIt();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getAllByRole("option")[2]?.getAttribute("aria-selected")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("option")[2]?.id);
  });

  it("muestra el texto vacío cuando nada coincide", () => {
    render(<CommandPalette items={items} onSelect={() => {}} emptyText="Nada por aquí" />);
    openIt();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzzz" } });
    expect(screen.getByText("Nada por aquí")).toBeTruthy();
  });

  it("al reabrir la búsqueda empieza limpia", () => {
    render(<CommandPalette items={items} onSelect={() => {}} />);
    openIt();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "hono" } });
    fireEvent.mouseDown(document.querySelector("dialog") as HTMLElement); // clic en el fondo cierra
    openIt();
    expect((screen.getByRole("combobox") as HTMLInputElement).value).toBe("");
  });
});
