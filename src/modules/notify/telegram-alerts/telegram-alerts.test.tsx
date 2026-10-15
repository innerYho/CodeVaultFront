import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AlertButton,
  alertReducer,
  classifyError,
  classifyReport,
  createTelegramAlertsClient,
  LinkWizard,
  type NotifyReport,
  type TelegramAlertsClient,
  TelegramApiError,
  useLinkFlow,
} from "./index";
import { createMockTelegramClient } from "./mock-client";

const report = (delivered: number, failed: number, notLinked = 0): NotifyReport => ({
  delivered,
  failed,
  notLinked,
});

describe("classifyReport (la verificación)", () => {
  it("éxito solo si se entregó algo y nada falló", () => {
    expect(classifyReport(report(3, 0)).kind).toBe("success");
    expect(classifyReport(report(1, 0)).message).toBe("Se avisó a 1 persona por Telegram.");
  });
  it("parcial si algunos fallaron", () => {
    const o = classifyReport(report(2, 1));
    expect(o.kind).toBe("partial");
    expect(o.message).toContain("no se pudo entregar a 1");
  });
  it("fallo total si Telegram no entregó a nadie", () => {
    expect(classifyReport(report(0, 2)).kind).toBe("failed");
  });
  it("NADIE notificado cuando no hay destinatarios: jamás se muestra como éxito (el fallo real de Hydra)", () => {
    const o = classifyReport(report(0, 0, 3));
    expect(o.kind).toBe("nobody");
    expect(o.message).toContain("NO llegó a nadie");
    expect(classifyReport(report(0, 0, 0)).kind).toBe("nobody");
  });
  it("nunca es éxito con delivered = 0 sea cual sea el resto", () => {
    for (const f of [0, 1, 5])
      for (const n of [0, 2]) expect(classifyReport(report(0, f, n)).kind).not.toBe("success");
  });
});

describe("classifyError", () => {
  it("mensajes por código", () => {
    expect(classifyError(new TelegramApiError("network_error")).message).toContain("conexión");
    expect(classifyError(new TelegramApiError("unauthenticated", 401)).message).toContain("sesión");
    expect(classifyError(new TelegramApiError("rate_limited", 429, 42)).message).toContain(
      "42 segundos",
    );
    expect(classifyError(new TelegramApiError("disabled", 503)).message).toContain("configurado");
    expect(classifyError(new Error("boom")).message).toContain("inesperado");
  });
});

describe("alertReducer", () => {
  const outcome = classifyReport(report(1, 0));
  it("recorre idle → confirming → sending → done → idle", () => {
    let s = alertReducer({ phase: "idle" }, { type: "open" });
    expect(s.phase).toBe("confirming");
    s = alertReducer(s, { type: "send" });
    expect(s.phase).toBe("sending");
    s = alertReducer(s, { type: "finished", outcome });
    expect(s).toEqual({ phase: "done", outcome });
    expect(alertReducer(s, { type: "close" }).phase).toBe("idle");
  });
  it("no se puede enviar sin confirmar ni enviar dos veces", () => {
    expect(alertReducer({ phase: "idle" }, { type: "send" }).phase).toBe("idle");
    expect(alertReducer({ phase: "sending" }, { type: "send" }).phase).toBe("sending");
  });
  it("no se puede cancelar mientras se envía", () => {
    expect(alertReducer({ phase: "sending" }, { type: "cancel" }).phase).toBe("sending");
  });
  it("se puede reintentar desde el resultado", () => {
    expect(alertReducer({ phase: "done", outcome }, { type: "open" }).phase).toBe("confirming");
  });
});

describe("<AlertButton />", () => {
  const fake = (impl: (note?: string) => Promise<NotifyReport>) => {
    const sendAlert = vi.fn(impl);
    return { client: { sendAlert } as unknown as TelegramAlertsClient, sendAlert };
  };
  const openAndSend = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Alerta urgente" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sí, enviar" }));
  };

  it("pide confirmación y muestra los pasos antes de enviar", async () => {
    const { client, sendAlert } = fake(async () => report(1, 0));
    render(<AlertButton client={client}>Alerta urgente</AlertButton>);
    fireEvent.click(screen.getByRole("button", { name: "Alerta urgente" }));
    expect(await screen.findByText(/solo si presentas o evidencias una emergencia/)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(sendAlert).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("éxito verificado → mensaje de éxito en role=status", async () => {
    const { client } = fake(async () => report(2, 0));
    const done = vi.fn();
    render(
      <AlertButton client={client} onFinished={done}>
        Alerta urgente
      </AlertButton>,
    );
    await openAndSend();
    expect(await screen.findByText("Se avisó a 2 personas por Telegram.")).toBeTruthy();
    expect(screen.getByText("Se avisó a 2 personas por Telegram.").getAttribute("role")).toBe(
      "status",
    );
    expect(done).toHaveBeenCalledWith("success");
  });

  it("sin nadie vinculado NO muestra éxito: es una alerta (role=alert)", async () => {
    const { client } = fake(async () => report(0, 0, 3));
    render(<AlertButton client={client}>Alerta urgente</AlertButton>);
    await openAndSend();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("NO llegó a nadie");
    expect(screen.queryByText("Alerta enviada")).toBeNull();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });

  it("un error de red se explica y permite reintentar", async () => {
    const { client } = fake(async () => {
      throw new TelegramApiError("network_error");
    });
    render(<AlertButton client={client}>Alerta urgente</AlertButton>);
    await openAndSend();
    expect((await screen.findByRole("alert")).textContent).toContain("conexión");
  });

  it("un doble clic en «Sí, enviar» manda una sola alerta", async () => {
    let release!: (r: NotifyReport) => void;
    const { client, sendAlert } = fake(
      () =>
        new Promise((r) => {
          release = r;
        }),
    );
    render(<AlertButton client={client}>Alerta urgente</AlertButton>);
    fireEvent.click(screen.getByRole("button", { name: "Alerta urgente" }));
    const send = await screen.findByRole("button", { name: "Sí, enviar" });
    // Dos clics seguidos sobre el mismo botón, sin que React alcance a repintar entre ambos.
    act(() => {
      send.click();
      send.click();
    });
    expect(sendAlert).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/verificando la entrega/i)).toBeTruthy();
    await act(async () => release(report(1, 0)));
  });

  it("envía la nota recortada y vacía no se envía", async () => {
    const { client, sendAlert } = fake(async () => report(1, 0));
    render(<AlertButton client={client}>Alerta urgente</AlertButton>);
    fireEvent.click(screen.getByRole("button", { name: "Alerta urgente" }));
    fireEvent.change(await screen.findByLabelText(/Nota para quien la reciba/), {
      target: { value: "  segundo piso  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sí, enviar" }));
    await screen.findByText(/Se avisó a 1 persona/);
    expect(sendAlert).toHaveBeenCalledWith("segundo piso");
  });
});

describe("asistente de vinculación", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const flush = (ms: number) => act(async () => vi.advanceTimersByTimeAsync(ms));

  it("paso a paso: empezar → enlace y QR → verificación → vinculado → prueba entregada", async () => {
    const mock = createMockTelegramClient({ delayMs: 0, linkTtlMs: 60_000 });
    render(<LinkWizard client={mock.client} pollMs={500} />);
    await flush(10);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    await flush(10);
    expect(screen.getByRole("img", { name: /Código QR/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Abrir Telegram/ }).getAttribute("href")).toMatch(
      /^https:\/\/t\.me\/CodeVaultBot\?start=/,
    );
    expect(screen.getByText(/Esperando a que pulses/)).toBeTruthy();
    expect(screen.getByRole("timer").textContent).toContain("1:00");

    await flush(1500); // sigue sin vincular: no avanza solo
    expect(screen.queryByText(/Telegram vinculado/)).toBeNull();

    mock.simulateStart(); // la persona pulsa «Iniciar»
    await flush(1000);
    expect(screen.getByText(/Telegram vinculado/)).toBeTruthy();
    expect(screen.getByText("@ana_demo")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje de prueba" }));
    await flush(10);
    expect(screen.getByText(/Prueba entregada/)).toBeTruthy();
  });

  it("la cuenta atrás avanza y al caducar ofrece generar otro enlace", async () => {
    const mock = createMockTelegramClient({ delayMs: 0, linkTtlMs: 5000 });
    render(<LinkWizard client={mock.client} pollMs={500} />);
    await flush(10);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    await flush(10);
    await flush(2000);
    expect(screen.getByRole("timer").textContent).toContain("0:03");
    await flush(4000);
    expect(screen.getByText("El enlace caducó. Genera uno nuevo.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generar nuevo enlace" })).toBeTruthy();
    mock.simulateStart(); // con el enlace caducado ya no vincula
    expect(mock.linked).toBe(false);
  });

  it("si ya estaba vinculado lo muestra y permite desvincular", async () => {
    const mock = createMockTelegramClient({ delayMs: 0 });
    await mock.client.createLink();
    mock.simulateStart();
    render(<LinkWizard client={mock.client} />);
    await flush(10);
    expect(screen.getByText(/Telegram vinculado/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Desvincular" }));
    await flush(10);
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
  });

  it("avisa si el servidor no tiene el bot configurado", async () => {
    const mock = createMockTelegramClient({ delayMs: 0, enabled: false });
    render(<LinkWizard client={mock.client} />);
    await flush(10);
    expect(screen.getByRole("alert").textContent).toContain("falta el token del bot");
  });

  it("la prueba sin Telegram vinculado no se da por entregada", async () => {
    const mock = createMockTelegramClient({ delayMs: 0 });
    const { result } = renderHook(() => useLinkFlow(mock.client));
    await flush(10);
    await act(async () => {
      await result.current.runTest();
    });
    const t = result.current.test;
    expect(t.kind === "result" && t.outcome.kind).toBe("nobody");
  });

  it("tolera fallos de red puntuales mientras espera, pero se rinde tras varios seguidos", async () => {
    let calls = 0;
    let broken = false;
    const client: TelegramAlertsClient = {
      status: async () => {
        calls++;
        if (broken) throw new TelegramApiError("network_error");
        return { enabled: true, linked: false, username: null, linkedAt: null };
      },
      createLink: async () => ({
        url: "https://t.me/b?start=x",
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      }),
      unlink: async () => {},
      sendTest: async () => report(1, 0),
      sendAlert: async () => report(1, 0),
    };
    const { result } = renderHook(() => useLinkFlow(client, { pollMs: 100, maxPollFailures: 3 }));
    await flush(10);
    await act(async () => {
      await result.current.begin();
    });
    broken = true;
    await flush(150);
    expect(result.current.state.phase).toBe("waiting"); // 1 fallo: sigue
    await flush(400);
    expect(result.current.state.phase).toBe("error");
    expect(calls).toBeGreaterThan(3);
  });
});

describe("createTelegramAlertsClient", () => {
  const fakeFetch = (status: number, body: unknown) =>
    vi.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response);

  it("usa credentials: include y las rutas del back", async () => {
    const f = fakeFetch(200, { delivered: 1, failed: 0, notLinked: 0 });
    const c = createTelegramAlertsClient({
      baseUrl: "/api/telegram",
      fetch: f as unknown as typeof fetch,
    });
    await c.sendAlert("ayuda");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/telegram/alerts");
    expect(init).toMatchObject({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ note: "ayuda" }),
    });
  });
  it("traduce errores del back a TelegramApiError con retryAfter", async () => {
    const c = createTelegramAlertsClient({
      fetch: fakeFetch(429, { error: "rate_limited", retryAfter: 30 }) as unknown as typeof fetch,
    });
    await expect(c.sendAlert()).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
      retryAfter: 30,
    });
  });
  it("un fallo de red es network_error y unlink acepta 204", async () => {
    const down = createTelegramAlertsClient({
      fetch: (async () => {
        throw new Error("x");
      }) as unknown as typeof fetch,
    });
    await expect(down.status()).rejects.toMatchObject({ code: "network_error" });
    const ok = createTelegramAlertsClient({
      fetch: (async () =>
        ({
          ok: true,
          status: 204,
          json: async () => {
            throw new Error("sin cuerpo");
          },
        }) as unknown as Response) as unknown as typeof fetch,
    });
    await expect(ok.unlink()).resolves.toBeUndefined();
  });
});
