import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createHttpScrapeClient,
  createMockScrapeClient,
  initialRunState,
  runReducer,
  ScrapeApiError,
  type ScrapeClient,
  ScrapePanel,
  SseParser,
  summarize,
  toScrapeEvent,
} from "./index";

describe("SseParser", () => {
  it("separa mensajes y une las líneas `data`", () => {
    const p = new SseParser();
    expect(p.push('event: page\ndata: {"a":1}\n\nevent: log\ndata: uno\ndata: dos\n\n')).toEqual([
      { event: "page", data: '{"a":1}' },
      { event: "log", data: "uno\ndos" },
    ]);
  });

  it("tolera mensajes partidos en cualquier punto, \\r\\n y comentarios", () => {
    const p = new SseParser();
    const text = ': latido\r\nevent: progress\r\ndata: {"x":2}\r\n\r\n';
    const out = [];
    for (const ch of text) out.push(...p.push(ch)); // carácter a carácter
    expect(out).toEqual([{ event: "progress", data: '{"x":2}' }]);
  });

  it("sin `event:` el nombre es `message`; sin `data` no emite nada", () => {
    const p = new SseParser();
    expect(p.push("data: hola\n\n")).toEqual([{ event: "message", data: "hola" }]);
    expect(p.push("event: vacio\n\n")).toEqual([]);
  });
});

describe("toScrapeEvent", () => {
  it("traduce los eventos del back y descarta lo desconocido o roto", () => {
    expect(toScrapeEvent("start", '{"scenario":"catalogo","title":"T"}')).toEqual({
      type: "start",
      scenario: "catalogo",
      title: "T",
    });
    expect(toScrapeEvent("done", '{"progress":{"state":"done"}}')).toMatchObject({
      type: "done",
      progress: { state: "done" },
    });
    expect(toScrapeEvent("error", '{"message":"x"}')).toEqual({ type: "error", message: "x" });
    expect(toScrapeEvent("raro", "{}")).toBeNull();
    expect(toScrapeEvent("page", "no es json")).toBeNull();
  });
});

describe("runReducer", () => {
  it("acumula páginas, registros y avance, y termina con `done`", () => {
    let s = runReducer(initialRunState, { type: "begin", scenario: "x" });
    expect(s.status).toBe("running");
    s = runReducer(s, {
      type: "event",
      event: { type: "page", page: { url: "u", ok: true, items: [{ a: 1 }], issues: [] } },
    });
    s = runReducer(s, { type: "event", event: { type: "log", message: "reintento" } });
    s = runReducer(s, {
      type: "event",
      event: {
        type: "done",
        progress: { state: "done", total: 1, done: 1, failed: 0, items: 1, current: null },
      },
    });
    expect(s).toMatchObject({ status: "done", pages: [{ url: "u" }], logs: ["reintento"] });
  });

  it("`cancelled` solo afecta a una ejecución en curso; un `done` cancelado queda cancelado", () => {
    expect(runReducer(initialRunState, { type: "cancelled" }).status).toBe("idle");
    const running = runReducer(initialRunState, { type: "begin", scenario: "x" });
    expect(runReducer(running, { type: "cancelled" }).status).toBe("cancelled");
    const done = runReducer(running, {
      type: "event",
      event: {
        type: "done",
        progress: { state: "cancelled", total: null, done: 1, failed: 0, items: 0, current: null },
      },
    });
    expect(done.status).toBe("cancelled");
  });

  it("limita el registro a 50 líneas", () => {
    let s = runReducer(initialRunState, { type: "begin", scenario: "x" });
    for (let i = 0; i < 70; i++)
      s = runReducer(s, { type: "event", event: { type: "log", message: `l${i}` } });
    expect(s.logs).toHaveLength(50);
    expect(s.logs.at(-1)).toBe("l69");
  });
});

describe("createHttpScrapeClient", () => {
  const sse = (chunks: string[]) =>
    new Response(
      new ReadableStream({
        start(c) {
          for (const ch of chunks) c.enqueue(new TextEncoder().encode(ch));
          c.close();
        },
      }),
      { headers: { "content-type": "text/event-stream" } },
    );

  it("lee un flujo SSE partido en trozos y entrega los eventos en orden", async () => {
    const fetch = async () =>
      sse([
        'event: start\ndata: {"scenario":"c","ti',
        'tle":"T"}\n\nevent: page\ndata: {"url":"u","ok":true,"items":[],"issues":[]}\n\n',
        'event: done\ndata: {"progress":{"state":"done","total":null,"done":1,"failed":0,"items":0,"current":null}}\n\n',
      ]);
    const events: string[] = [];
    await createHttpScrapeClient({ baseUrl: "/x", fetch: fetch as never }).run("c", (e) =>
      events.push(e.type),
    );
    expect(events).toEqual(["start", "page", "done"]);
  });

  it("traduce 429/404 y los fallos de red a ScrapeApiError", async () => {
    const mk = (res: () => Promise<Response>) => createHttpScrapeClient({ fetch: res as never });
    await expect(
      mk(async () => new Response('{"error":"Demasiadas"}', { status: 429 })).run("c", () => {}),
    ).rejects.toMatchObject({ status: 429 });
    await expect(
      mk(async () => new Response("{}", { status: 404 })).scenarios(),
    ).rejects.toBeInstanceOf(ScrapeApiError);
    await expect(
      mk(async () => {
        throw new TypeError("fallo");
      }).scenarios(),
    ).rejects.toMatchObject({ code: "network_error" });
  });

  it("cancelar con la señal resuelve sin error", async () => {
    const ctl = new AbortController();
    const fetch = async () =>
      new Response(
        new ReadableStream({
          start(c) {
            ctl.signal.addEventListener("abort", () =>
              c.error(new DOMException("abort", "AbortError")),
            );
          },
        }),
      );
    const p = createHttpScrapeClient({ fetch: fetch as never }).run("c", () => {}, ctl.signal);
    ctl.abort();
    await expect(p).resolves.toBeUndefined();
  });

  it("codifica el id del escenario en la URL", async () => {
    let seen = "";
    const fetch = async (url: string) => {
      seen = url;
      return sse([]);
    };
    await createHttpScrapeClient({ baseUrl: "/b", fetch: fetch as never }).run("a b/c", () => {});
    expect(seen).toBe("/b/run/a%20b%2Fc");
  });
});

describe("ScrapePanel", () => {
  const mock = () => createMockScrapeClient({ delayMs: 0 });

  it("lista los escenarios y deshabilita el que el servidor no puede ejecutar", async () => {
    render(<ScrapePanel client={mock()} />);
    expect(await screen.findByRole("radio", { name: /Catálogo paginado/ })).toBeTruthy();
    expect(
      (screen.getByRole("radio", { name: /Página con JavaScript/ }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(screen.getByText(/el servidor no tiene Chrome/)).toBeTruthy();
  });

  it("ejecuta el catálogo: avance, páginas y tabla de datos", async () => {
    render(<ScrapePanel client={mock()} />);
    await screen.findByRole("radio", { name: /Catálogo paginado/ });
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "Terminado: 3 páginas, 10 registros, 0 fallos",
      ),
    );
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(11); // cabecera + 10
    expect(within(table).getByText("Cuaderno cuadriculado")).toBeTruthy();
    expect(within(table).getByText("12.500")).toBeTruthy();
  });

  it("muestra el motivo de cada fallo y los reintentos", async () => {
    render(<ScrapePanel client={mock()} />);
    fireEvent.click(await screen.findByRole("radio", { name: /Lista de URLs con fallos/ }));
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("2 fallos"));
    expect(screen.getByText(/robots: robots.txt no permite esta ruta/)).toBeTruthy();
    expect(screen.getByText(/http: HTTP 404/)).toBeTruthy();
    expect(screen.getByText(/Reintento 1 de \/inestable/)).toBeTruthy();
  });

  it("Cancelar detiene la ejecución", async () => {
    render(<ScrapePanel client={createMockScrapeClient({ delayMs: 40 })} />);
    await screen.findByRole("radio", { name: /Catálogo paginado/ });
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar" }));
    await waitFor(() => expect(screen.getByRole("progressbar")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("status").textContent).toContain("Cancelado");
    await act(() => new Promise((r) => setTimeout(r, 200)));
    expect(screen.getByRole("status").textContent).toContain("Cancelado"); // no sigue llegando
    expect((screen.getByRole("button", { name: "Ejecutar" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("si no puede conectar con el servidor, lo dice con un aviso", async () => {
    const broken: ScrapeClient = {
      scenarios: async () => {
        throw new ScrapeApiError("network_error");
      },
      run: async () => {},
    };
    render(<ScrapePanel client={broken} />);
    expect((await screen.findByRole("alert")).textContent).toContain("No se pudo conectar");
  });

  it("un fallo al arrancar la ejecución se comunica", async () => {
    const client: ScrapeClient = {
      scenarios: async () => [
        { id: "a", title: "A", description: "d", needsBrowser: false, available: true },
      ],
      run: async () => {
        throw new ScrapeApiError("x", 429);
      },
    };
    render(<ScrapePanel client={client} />);
    await screen.findByRole("radio", { name: /A/ });
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("ocupado"));
  });
});

describe("summarize", () => {
  it("describe cada estado", () => {
    expect(summarize(initialRunState)).toContain("Elige un escenario");
    expect(summarize({ ...initialRunState, status: "error", error: "Boom" })).toBe("Boom");
  });
});
