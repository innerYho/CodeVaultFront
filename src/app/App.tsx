import { useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { formatHotkey } from "../modules/hooks/use-hotkey";
import { type CommandItem, CommandPalette } from "../modules/ui/command-palette";
import { Drawer } from "../modules/ui/drawer";
import { ThemeToggle, useTheme } from "../modules/ui/theme-toggle";
import { useLocale } from "./i18n";
import { LangToggle } from "./LangToggle";
import { ModulePage } from "./ModulePage";
import { Nav } from "./Nav";
import { modules } from "./registry";

const HOTKEY = "mod+k";

export function App() {
  const first = modules[0];
  const navigate = useNavigate();
  const { t } = useLocale();
  const { resolved } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Cada módulo es un resultado; categoría y etiquetas también son buscables.
  const items = useMemo<CommandItem[]>(
    () =>
      modules.map((m) => ({
        id: `${m.category}/${m.name}`,
        title: m.title,
        description: m.description,
        keywords: m.tags,
        group: m.category,
        hint: m.status,
      })),
    [],
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-8 px-4">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto py-8 md:block">
        <NavLink to="/" className="mb-6 block text-xl font-bold">
          CodeVault
        </NavLink>
        <Nav />
      </aside>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} label={t.nav.menu}>
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xl font-bold">CodeVault</span>
          <button
            type="button"
            aria-label={t.nav.closeMenu}
            onClick={() => setMenuOpen(false)}
            className="rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>
        <Nav onNavigate={() => setMenuOpen(false)} />
      </Drawer>

      <CommandPalette
        items={items}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        hotkey={HOTKEY}
        placeholder={t.search.placeholder}
        emptyText={t.search.empty}
        label={t.search.label}
        onSelect={(item) => navigate(`/${item.id}`)}
      />

      <main className="min-w-0 flex-1 py-4 md:py-8">
        <header className="mb-6 flex items-center gap-2">
          <button
            type="button"
            aria-label={t.nav.openMenu}
            onClick={() => setMenuOpen(true)}
            className="grid size-10 place-items-center rounded-full border border-zinc-300 md:hidden dark:border-zinc-700"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex h-10 flex-1 items-center gap-2 rounded-full border border-zinc-300 px-4 text-sm text-zinc-500 hover:bg-zinc-50 md:max-w-xs md:flex-none dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <span className="flex-1 text-left">{t.search.button}</span>
            <kbd className="hidden rounded border border-zinc-300 px-1.5 text-xs sm:inline dark:border-zinc-700">
              {formatHotkey(HOTKEY)}
            </kbd>
          </button>
          <LangToggle />
          <ThemeToggle aria-label={resolved === "dark" ? t.theme.toLight : t.theme.toDark} />
        </header>

        <Routes>
          <Route
            path="/"
            element={first ? <Navigate to={`/${first.category}/${first.name}`} replace /> : null}
          />
          <Route path="/:category/:name" element={<ModulePage />} />
          <Route path="*" element={<p>{t.page.notFound}</p>} />
        </Routes>
      </main>
    </div>
  );
}
