import { useCallback, useReducer } from "react";
import { flowReducer, initialState } from "./login-flow";
import { AuthApiError, type AuthClient, type MfaProof } from "./types";

export function useLoginFlow(client: AuthClient) {
  const [state, dispatch] = useReducer(flowReducer, initialState);

  const run = useCallback(async (action: () => Promise<void>) => {
    dispatch({ type: "submit" });
    try {
      await action();
    } catch (e) {
      const err = e instanceof AuthApiError ? e : new AuthApiError("unknown_error");
      dispatch({ type: "failed", error: { code: err.code, retryAfter: err.retryAfter } });
    }
  }, []);

  const submitCredentials = useCallback(
    (email: string, password: string) =>
      run(async () => {
        const r = await client.login(email, password);
        dispatch(
          r.status === "authenticated"
            ? { type: "authenticated", user: r.user }
            : { type: "mfa_required", challenge: r.challenge },
        );
      }),
    [client, run],
  );

  const submitMfa = useCallback(
    (proof: MfaProof) =>
      run(async () => {
        if (state.step !== "mfa") return;
        dispatch({ type: "authenticated", user: await client.verifyMfa(state.challenge, proof) });
      }),
    [client, run, state],
  );

  return { state, submitCredentials, submitMfa, back: () => dispatch({ type: "back" }) };
}
