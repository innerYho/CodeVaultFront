import { useEffect, useId, useRef, useState } from "react";
import { field, primaryButton } from "./styles";

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  pending?: boolean;
  /** Mensaje de error ya traducido; se anuncia a lectores de pantalla. */
  error?: string | null;
}

export function LoginForm({ onSubmit, pending, error }: LoginFormProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => emailRef.current?.focus(), []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email, password);
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label htmlFor={`${id}-email`} className="text-sm font-medium">
          Correo electrónico
        </label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${id}-password`} className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id={`${id}-password`}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={field}
        />
      </div>
      <p id={`${id}-error`} role="alert" className="min-h-5 text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Verificando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
