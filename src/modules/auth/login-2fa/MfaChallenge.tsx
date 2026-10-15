import { useEffect, useId, useRef, useState } from "react";
import { OtpInput } from "../../ui/otp-input";
import { field, linkButton, primaryButton } from "./styles";
import type { MfaProof } from "./types";

export interface MfaChallengeProps {
  onSubmit: (proof: MfaProof) => void;
  onBack?: () => void;
  pending?: boolean;
  error?: string | null;
}

export function MfaChallenge({ onSubmit, onBack, pending, error }: MfaChallengeProps) {
  const id = useId();
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const recoveryRef = useRef<HTMLInputElement>(null);

  // Tras un error se limpia el campo para reintentar sin borrar a mano.
  useEffect(() => {
    if (error) setCode("");
  }, [error]);

  useEffect(() => {
    if (useRecovery) recoveryRef.current?.focus();
  }, [useRecovery]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (useRecovery ? recovery.trim() : code.length === 6)
          onSubmit(useRecovery ? { recoveryCode: recovery } : { code });
      }}
      className="space-y-4"
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400" id={`${id}-help`}>
        {useRecovery
          ? "Introduce uno de tus códigos de recuperación. Cada uno funciona una sola vez."
          : "Introduce el código de 6 dígitos de tu app autenticadora."}
      </p>

      {useRecovery ? (
        <input
          ref={recoveryRef}
          aria-label="Código de recuperación"
          aria-describedby={`${id}-help`}
          autoComplete="off"
          spellCheck={false}
          placeholder="XXXXX-XXXXX"
          value={recovery}
          onChange={(e) => setRecovery(e.target.value)}
          className={`${field} font-mono uppercase`}
        />
      ) : (
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={(c) => onSubmit({ code: c })}
          disabled={pending}
          invalid={!!error}
          autoFocus
        />
      )}

      <p role="alert" className="min-h-5 text-sm text-red-600 dark:text-red-400">
        {error}
      </p>

      {useRecovery && (
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Verificando…" : "Verificar"}
        </button>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          className={linkButton}
          onClick={() => {
            setUseRecovery((u) => !u);
            setCode("");
            setRecovery("");
          }}
        >
          {useRecovery ? "Usar mi app autenticadora" : "Usar un código de recuperación"}
        </button>
        {onBack && (
          <button type="button" className={linkButton} onClick={onBack}>
            Volver
          </button>
        )}
      </div>
    </form>
  );
}
