import type { ApiType } from "../../scripts/build-api";
import { useLocale } from "./i18n";

export function ApiTable({ types }: { types: ApiType[] }) {
  const { t: m } = useLocale();
  if (!types.length) return null;
  return (
    <section aria-labelledby="api-heading" className="not-prose">
      <h2 id="api-heading" className="mb-1 text-2xl font-bold">
        API
      </h2>
      <p className="mb-4 text-sm text-zinc-500">{m.api.generated}</p>
      {types.map((t) => (
        <div key={t.name} className="mb-6">
          <h3 className="mb-2 font-mono text-sm font-semibold">{t.name}</h3>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2">{m.api.prop}</th>
                  <th className="px-3 py-2">{m.api.type}</th>
                  <th className="px-3 py-2">{m.api.default}</th>
                  <th className="px-3 py-2">{m.api.description}</th>
                </tr>
              </thead>
              <tbody>
                {t.props.map((p) => (
                  <tr
                    key={p.name}
                    className="border-t border-zinc-200 align-top dark:border-zinc-800"
                  >
                    <td className="px-3 py-2 font-mono">
                      {p.name}
                      {p.required && (
                        <span title={m.api.required} className="text-red-500">
                          {" "}
                          *
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-indigo-700 dark:text-indigo-300">
                      {p.type}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{p.default ?? "—"}</td>
                    <td className="px-3 py-2">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
