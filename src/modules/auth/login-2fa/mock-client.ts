import { AuthApiError, type AuthClient } from "./types";

export const DEMO = { password: "demo-password-123", code: "123456", recovery: "ABCDE-FGHJK" };

/**
 * Backend simulado para demos y pruebas, sin red. Reglas:
 * - contraseña `DEMO.password`; los correos que empiezan por "sin2fa" no piden segundo factor;
 * - código válido `DEMO.code`; 3 códigos incorrectos seguidos bloquean (como el backend real).
 */
export function createMockAuthClient({ delayMs = 400 }: { delayMs?: number } = {}): AuthClient {
  const wait = () => new Promise((r) => setTimeout(r, delayMs));
  let failures = 0;
  const user = (email: string) => ({ id: "demo-user", email });
  let lastEmail = "";

  return {
    async login(email, password) {
      await wait();
      if (password !== DEMO.password) throw new AuthApiError("invalid_credentials", 401);
      lastEmail = email;
      return email.startsWith("sin2fa")
        ? { status: "authenticated", user: user(email) }
        : { status: "mfa_required", challenge: "demo-challenge" };
    },
    async verifyMfa(_challenge, proof) {
      await wait();
      if (failures >= 3) throw new AuthApiError("locked", 423, 900);
      const ok =
        "code" in proof
          ? proof.code === DEMO.code
          : proof.recoveryCode.toUpperCase() === DEMO.recovery;
      if (!ok) {
        failures++;
        throw new AuthApiError(
          failures >= 3 ? "locked" : "invalid_code",
          failures >= 3 ? 423 : 401,
          failures >= 3 ? 900 : undefined,
        );
      }
      failures = 0;
      return user(lastEmail);
    },
    async beginMfaSetup() {
      await wait();
      return {
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUri:
          "otpauth://totp/CodeVault:demo%40codevault.dev?secret=JBSWY3DPEHPK3PXP&issuer=CodeVault",
      };
    },
    async enableMfa(code) {
      await wait();
      if (code !== DEMO.code) throw new AuthApiError("invalid_code", 401);
      return {
        recoveryCodes: [DEMO.recovery, "KMNPQ-RSTUV", "WXYZ2-34567", "89ABC-DEFGH", "JKMNP-QRSTU"],
      };
    },
  };
}
