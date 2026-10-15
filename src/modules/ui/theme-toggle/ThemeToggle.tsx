import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { useTheme } from "./useTheme";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Icono</title>
      {children}
    </svg>
  );
}

const Sun = () => (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);
const Moon = () => (
  <Icon>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Icon>
);

export type ThemeToggleProps = Omit<ComponentProps<"button">, "onClick" | "children"> & {
  /** Anima la transición como círculo desde el botón (View Transitions API).
   * @default true */
  circularReveal?: boolean;
};

export function ThemeToggle({ circularReveal = true, className = "", ...rest }: ThemeToggleProps) {
  const { resolved, toggle } = useTheme();
  const reduce = useReducedMotion();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      aria-pressed={isDark}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle(circularReveal ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
      }}
      className={`relative grid size-10 place-items-center overflow-hidden rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 ${className}`}
      {...rest}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={resolved}
          initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.18 }}
          className="grid place-items-center"
        >
          {isDark ? <Sun /> : <Moon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
