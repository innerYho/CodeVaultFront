import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createAuthClient } from "./http-client";
import { Login2FA } from "./Login2FA";
import { type FlowState, flowReducer, initialState } from "./login-flow";
import { createMockAuthClient, DEMO } from "./mock-client";
import { AuthApiError } from "./types";

describe("flowReducer", () => {
  it("credenciales → mfa → done", () => {
    let s: FlowState = flowReducer(initialState, { type: "submit" });
    expect(s).toMatchObject({ step: "credentials", pending: true });
    s = flowReducer(s, { type: "mfa_required", challenge: "c" });
    expect(s).toMatchObject({ step: "mfa", challenge: "c", pending: false });
    s = flowReducer(s, { type: "authenticated", user: { id: "1", email: "a@b.co" } });
    expect(s.step).toBe("done");
  });
  it("un desafío inválido devuelve al primer paso con el error", () => {
    const mfa: FlowState = { step: "mfa", challenge: "c", pending: true, error: null };
    expect(
      flowReducer(mfa, { type: "failed", error: { code: "invalid_challenge" } }),
    ).toMatchObject({
      step: "credentials",
      error: { code: "invalid_challenge" },
    });
  });
  it("un código incorrecto mantiene el paso y guarda el error", () => {
    const mfa: FlowState = { step: "mfa", challenge: "c", pending: true, error: null };
    expect(flowReducer(mfa, { type: "failed", error: { code: "invalid_code" } })).toMatchObject({
      step: "mfa",
      pending: false,
    });
  });
});

const fill = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
};
const paste = (code: string) =>
  fireEvent.paste(screen.getByLabelText(/dígito 1 de 6/), {
    clipboardData: { getData: () => code },
  });

describe("Login2FA", () => {
  it("con 2FA: pide el código y autentica al introducirlo", async () => {
    const onAuthenticated = vi.fn();
    render(
      <Login2FA client={createMockAuthClient({ delayMs: 0 })} onAuthenticated={onAuthenticated} />,
    );
    fill("ana@x.co", DEMO.password);
    await screen.findByText("Verificación en dos pasos");
    paste(DEMO.code);
    await waitFor(() =>
      expect(onAuthenticated).toHaveBeenCalledWith({ id: "demo-user", email: "ana@x.co" }),
    );
  });

  it("sin 2FA: entra directamente", async () => {
    const onAuthenticated = vi.fn();
    render(
      <Login2FA client={createMockAuthClient({ delayMs: 0 })} onAuthenticated={onAuthenticated} />,
    );
    fill("sin2fa@x.co", DEMO.password);
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
  });

  it("muestra el error de credenciales con role=alert", async () => {
    render(<Login2FA client={createMockAuthClient({ delayMs: 0 })} onAuthenticated={() => {}} />);
    fill("ana@x.co", "mala");
    // Siempre hay una región role="alert" (vacía): se espera a que contenga el mensaje.
    const message = await screen.findByText(/incorrectos/);
    expect(message.getAttribute("role")).toBe("alert");
  });

  it("un código incorrecto muestra el error y deja reintentar", async () => {
    render(<Login2FA client={createMockAuthClient({ delayMs: 0 })} onAuthenticated={() => {}} />);
    fill("ana@x.co", DEMO.password);
    await screen.findByText("Verificación en dos pasos");
    paste("000000");
    expect(await screen.findByText(/Código incorrecto/)).toBeTruthy();
    // El campo se limpia solo, listo para reintentar.
    await waitFor(() =>
      expect((screen.getByLabelText(/dígito 1 de 6/) as HTMLInputElement).value).toBe(""),
    );
  });
});

describe("createAuthClient", () => {
  it("envía credenciales con cookie y traduce errores del backend", async () => {
    const f = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "locked", retryAfter: 900 }), { status: 423 }),
    );
    const client = createAuthClient({ fetch: f as unknown as typeof fetch });
    await expect(client.login("a@b.co", "x")).rejects.toMatchObject({
      code: "locked",
      status: 423,
      retryAfter: 900,
    });
    expect(f).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({ credentials: "include" }),
    );
  });
  it("un fallo de red se vuelve network_error", async () => {
    const client = createAuthClient({
      fetch: (async () => Promise.reject(new Error("x"))) as typeof fetch,
    });
    await expect(client.login("a", "b")).rejects.toBeInstanceOf(AuthApiError);
  });
});
