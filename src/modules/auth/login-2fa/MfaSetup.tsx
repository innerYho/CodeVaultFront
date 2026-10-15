import { useEffect, useState } from "react";
import { OtpInput } from "../../ui/otp-input";
import { QrCode } from "../../ui/qr-code";
import { messageFor } from "./messages";
import { field, linkButton, primaryButton } from "./styles";
import { AuthApiError, type AuthClient, type MfaSetupData } from "./types";

export interface MfaSetupProps {
  client: AuthClient;
  /** Se llama cuando el usuario confirma que guardó los códigos de recuperación. */
  onDone: () => void;
}

/** Enrolamiento: 1) escanear el QR, 2) confirmar con un código, 3) guardar los códigos de recuperación. */
export function MfaSetup({ client, onDone }: MfaSetupProps) {
  const [setup, setSetup] = useState<MfaSetupData | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .beginMfaSetup()
      .then((s) => !cancelled && setSetup(s))
      .catch(
        (e) =>
          !cancelled &&
          setError(messageFor(e instanceof AuthApiError ? e.code : "unknown_error", undefined)),
      );
    return () => {
      cancelled = true;
    };
  }, [client]);

  async function confirm(value: string) {
    setPending(true);
    setError(null);
    try {
      setRecoveryCodes((await client.enableMfa(value)).recoveryCodes);
    } catch (e) {
      const err = e instanceof AuthApiError ? e : new AuthApiError("unknown_error");
      setError(messageFor(err.code, err.retryAfter));
      setCode("");
    } finally {
      setPending(false);
    }
  }

  if (recoveryCodes) {
    const text = recoveryCodes.join("\n");
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Guarda tus códigos de recuperación</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Si pierdes tu teléfono, son la única forma de entrar. Cada código sirve una vez.{" "}
          <strong>No volverán a mostrarse.</strong>
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-3 font-mono text-sm dark:bg-zinc-800">
          {recoveryCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex gap-4">
          <button
            type="button"
            className={linkButton}
            onClick={() => navigator.clipboard?.writeText(text)}
          >
            Copiar
          </button>
          <a
            className={linkButton}
            download="codigos-de-recuperacion.txt"
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
          >
            Descargar
          </a>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          Ya guardé mis códigos en un lugar seguro
        </label>
        <button type="button" disabled={!saved} onClick={onDone} className={primaryButton}>
          Terminar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Activar verificación en dos pasos</h2>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
        <li>Escanea el QR con tu app autenticadora (Google Authenticator, Authy, 1Password…).</li>
        <li>Escribe el código de 6 dígitos que muestra.</li>
      </ol>
      {setup ? (
        <>
          <div className="flex justify-center">
            <QrCode
              value={setup.otpauthUri}
              label="Código QR para configurar la app autenticadora"
            />
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer">
              ¿No puedes escanear? Introduce la clave a mano
            </summary>
            <input
              readOnly
              aria-label="Clave secreta"
              value={setup.secret}
              onFocus={(e) => e.target.select()}
              className={`${field} mt-2 font-mono`}
            />
          </details>
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={confirm}
            disabled={pending}
            invalid={!!error}
          />
        </>
      ) : (
        !error && <p className="text-sm text-zinc-500">Preparando…</p>
      )}
      <p role="alert" className="min-h-5 text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    </div>
  );
}
