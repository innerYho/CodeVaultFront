import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { LoginForm } from "./LoginForm";
import { MfaChallenge } from "./MfaChallenge";
import { type Messages, messageFor } from "./messages";
import type { AuthClient, AuthUser } from "./types";
import { useLoginFlow } from "./useLoginFlow";

export interface Login2FAProps {
  client: AuthClient;
  /** Se llama al terminar el login (con o sin 2FA). */
  onAuthenticated: (user: AuthUser) => void;
  /** Sobrescribe textos de error por código (`invalid_code`, `locked`...). */
  messages?: Messages;
}

/** Flujo completo: credenciales → (si el usuario tiene 2FA) código → listo. */
export function Login2FA({ client, onAuthenticated, messages }: Login2FAProps) {
  const { state, submitCredentials, submitMfa, back } = useLoginFlow(client);
  const reduce = useReducedMotion();
  const user = state.step === "done" ? state.user : null;

  useEffect(() => {
    if (user) onAuthenticated(user);
  }, [user, onAuthenticated]);

  if (state.step === "done") {
    return (
      <p role="status" className="text-sm text-zinc-500">
        Sesión iniciada.
      </p>
    );
  }

  const error = state.error ? messageFor(state.error.code, state.error.retryAfter, messages) : null;
  const slide = reduce ? { opacity: 0 } : { opacity: 0, x: 24 };

  return (
    <div className="max-w-sm">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state.step}
          initial={slide}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
        >
          {state.step === "credentials" ? (
            <>
              <h2 className="mb-4 text-lg font-semibold">Iniciar sesión</h2>
              <LoginForm onSubmit={submitCredentials} pending={state.pending} error={error} />
            </>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold">Verificación en dos pasos</h2>
              <MfaChallenge
                onSubmit={submitMfa}
                onBack={back}
                pending={state.pending}
                error={error}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
