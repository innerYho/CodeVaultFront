import type { AuthUser } from "./types";

/** Pasos del login. Es una máquina de estados explícita: no hay combinaciones imposibles. */
export type FlowState =
  | { step: "credentials"; pending: boolean; error: FlowError | null }
  | { step: "mfa"; challenge: string; pending: boolean; error: FlowError | null }
  | { step: "done"; user: AuthUser };

export interface FlowError {
  code: string;
  retryAfter?: number;
}

export type FlowAction =
  | { type: "submit" }
  | { type: "failed"; error: FlowError }
  | { type: "mfa_required"; challenge: string }
  | { type: "authenticated"; user: AuthUser }
  | { type: "back" };

export const initialState: FlowState = { step: "credentials", pending: false, error: null };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  if (state.step === "done") return state;
  switch (action.type) {
    case "submit":
      return { ...state, pending: true, error: null };
    case "failed":
      // Un desafío expirado o inválido obliga a volver a empezar.
      return action.error.code === "invalid_challenge"
        ? { step: "credentials", pending: false, error: action.error }
        : { ...state, pending: false, error: action.error };
    case "mfa_required":
      return { step: "mfa", challenge: action.challenge, pending: false, error: null };
    case "authenticated":
      return { step: "done", user: action.user };
    case "back":
      return initialState;
  }
}
