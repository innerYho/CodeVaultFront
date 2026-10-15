import { NavLink } from "react-router-dom";
import { categories, modules } from "./registry";

/** Navegación por categorías; se usa en la barra lateral (escritorio) y en el Drawer (móvil). */
export function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {categories.map((c) => (
        <nav key={c} className="mb-6" aria-label={c}>
          <h2 className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">{c}</h2>
          <ul className="space-y-1">
            {modules
              .filter((m) => m.category === c)
              .map((m) => (
                <li key={m.name}>
                  <NavLink
                    to={`/${m.category}/${m.name}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-1 text-sm ${isActive ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`
                    }
                  >
                    {m.title}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>
      ))}
    </>
  );
}
