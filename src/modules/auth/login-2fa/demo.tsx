import { useMemo, useState } from "react";
import { Login2FA, MfaSetup } from "./index";
import { createMockAuthClient, DEMO } from "./mock-client";

export default function Demo() {
  const client = useMemo(() => createMockAuthClient(), []);
  const [view, setView] = useState<"login" | "setup">("login");
  const [user, setUser] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
        <p className="font-medium">Backend simulado (no hay red):</p>
        <ul className="list-disc pl-5">
          <li>
            Contraseña: <code>{DEMO.password}</code>
          </li>
          <li>
            Código 2FA: <code>{DEMO.code}</code> · recuperación: <code>{DEMO.recovery}</code>
          </li>
          <li>
            Un correo que empiece por <code>sin2fa</code> entra sin segundo factor.
          </li>
          <li>Tres códigos incorrectos seguidos bloquean la cuenta.</li>
        </ul>
      </div>

      <div className="flex gap-2 text-sm">
        {(["login", "setup"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setView(v);
              setUser(null);
            }}
            className={`rounded-md border px-3 py-1 ${view === v ? "border-indigo-500 bg-indigo-500 text-white" : "border-zinc-300 dark:border-zinc-700"}`}
          >
            {v === "login" ? "Login con 2FA" : "Activar 2FA"}
          </button>
        ))}
      </div>

      <div className="max-w-sm">
        {view === "login" &&
          (user ? (
            <p role="status">
              ✅ Sesión iniciada como <strong>{user}</strong>.
            </p>
          ) : (
            <Login2FA client={client} onAuthenticated={(u) => setUser(u.email)} />
          ))}
        {view === "setup" && <MfaSetup client={client} onDone={() => setView("login")} />}
      </div>
    </div>
  );
}
