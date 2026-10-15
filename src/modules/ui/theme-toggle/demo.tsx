import { ThemeToggle, useTheme } from "./index";

export default function Demo() {
  const { mode, resolved, setMode } = useTheme();
  return (
    <div className="flex flex-wrap items-center gap-6">
      <ThemeToggle />
      <ThemeToggle circularReveal={false} />
      <div className="flex gap-2">
        {(["light", "dark", "system"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md border px-3 py-1 text-sm ${mode === m ? "border-indigo-500 bg-indigo-500 text-white" : "border-zinc-300 dark:border-zinc-700"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        mode: <code>{mode}</code> · resolved: <code>{resolved}</code>
      </p>
    </div>
  );
}
