export interface AuthUser {
  id: string;
  email: string;
}

export type LoginResult =
  | { status: "authenticated"; user: AuthUser }
  | { status: "mfa_required"; challenge: string };

export type MfaProof = { code: string } | { recoveryCode: string };

export interface MfaSetupData {
  /** Secreto en base32, para quien no pueda escanear el QR. */
  secret: string;
  /** URI `otpauth://` que se codifica en el QR. */
  otpauthUri: string;
}

/**
 * Lo único que el flujo necesita del backend. Implementa esta interfaz con `fetch`
 * (ver `createAuthClient`), con otro protocolo, o con un simulacro para pruebas y demos.
 */
export interface AuthClient {
  login(email: string, password: string): Promise<LoginResult>;
  verifyMfa(challenge: string, proof: MfaProof): Promise<AuthUser>;
  beginMfaSetup(): Promise<MfaSetupData>;
  enableMfa(code: string): Promise<{ recoveryCodes: string[] }>;
}

/** Error con el código que devuelve el backend (`invalid_code`, `locked`, ...). */
export class AuthApiError extends Error {
  constructor(
    readonly code: string,
    readonly status = 0,
    readonly retryAfter?: number,
  ) {
    super(code);
    this.name = "AuthApiError";
  }
}
