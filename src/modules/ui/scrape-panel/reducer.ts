import type { PageSummary, RunProgress, ScrapeEvent } from "./types";

export interface RunState {
  status: "idle" | "running" | "done" | "cancelled" | "error";
  scenario: string | null;
  title: string | null;
  progress: RunProgress | null;
  pages: PageSummary[];
  logs: string[];
  error: string | null;
}

export type RunAction =
  | { type: "begin"; scenario: string }
  | { type: "event"; event: ScrapeEvent }
  | { type: "cancelled" }
  | { type: "failed"; message: string };

export const initialRunState: RunState = {
  status: "idle",
  scenario: null,
  title: null,
  progress: null,
  pages: [],
  logs: [],
  error: null,
};

const MAX_LOGS = 50;

export function runReducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case "begin":
      return { ...initialRunState, status: "running", scenario: action.scenario };
    case "cancelled":
      return state.status === "running" ? { ...state, status: "cancelled" } : state;
    case "failed":
      return { ...state, status: "error", error: action.message };
    case "event": {
      const e = action.event;
      switch (e.type) {
        case "start":
          return { ...state, title: e.title };
        case "log":
          return { ...state, logs: [...state.logs, e.message].slice(-MAX_LOGS) };
        case "page":
          return { ...state, pages: [...state.pages, e.page] };
        case "progress":
          return { ...state, progress: e.progress };
        case "done":
          return {
            ...state,
            progress: e.progress,
            status: e.progress.state === "cancelled" ? "cancelled" : "done",
          };
        case "error":
          return { ...state, status: "error", error: e.message };
      }
    }
  }
}
