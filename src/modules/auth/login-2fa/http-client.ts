import { AuthApiError, type AuthClient, type AuthUser } from "./types";

export interface AuthClientOptions {
  /** Prefijo de las rutas de autenticación.
   * @default "/auth" */
  baseUrl?: string;
  /** Para pruebas o para usar otro `fetch`. */
  fetch?: typeof fetch;
}

/**
 * Cliente `fetch` para las rutas de `auth/mfa-login` del back. La sesión viaja en una
 * cookie `httpOnly`: por eso `credentials: "include"` y no se guarda ningún token aquí.
 */
export function createAuthClient({
  baseUrl = "/auth",
  fetch: doFetch = fetch,
}: AuthClientOptions = {}): AuthClient {
  async function post<T>(path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new AuthApiError("network_error");
    }
    const data = await res.json().catch(() => null);
    if (!res.ok)
      throw new AuthApiError(data?.error ?? "unknown_error", res.status, data?.retryAfter);
    return data as T;
  }

  return {
    login: (email, password) => post("/login", { email, password }),
    verifyMfa: async (challenge, proof) =>
      (await post<{ user: AuthUser }>("/mfa/verify", { challenge, ...proof })).user,
    beginMfaSetup: () => post("/mfa/setup"),
    enableMfa: (code) => post("/mfa/enable", { code }),
  };
}
