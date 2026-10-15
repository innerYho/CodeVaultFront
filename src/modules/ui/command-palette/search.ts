export interface SearchableItem {
  id: string;
  title: string;
  description?: string;
  /** Palabras extra por las que debe poder encontrarse. */
  keywords?: string[];
  /** Categoría; también es buscable (escribir "guides" filtra ese grupo). */
  group?: string;
}

/** Minúsculas y sin tildes: "Autenticación" coincide con "autenticacion". */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // marcas de acento tras NFD
    .toLowerCase();

function scoreToken(item: SearchableItem, token: string): number {
  const title = normalize(item.title);
  if (title.split(/[\s\-_/]+/).some((w) => w.startsWith(token)))
    return title.startsWith(token) ? 120 : 100;
  if (title.includes(token)) return 60;
  if (item.keywords?.some((k) => normalize(k).includes(token))) return 40;
  if (item.group && normalize(item.group).includes(token)) return 20;
  if (item.description && normalize(item.description).includes(token)) return 10;
  return 0;
}

/**
 * Filtra y ordena por relevancia. Todas las palabras de la consulta deben coincidir en algún
 * campo (título > palabras clave > grupo > descripción). Sin consulta devuelve el orden original.
 */
export function searchItems<T extends SearchableItem>(items: T[], query: string): T[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return items;
  return items
    .map((item, index) => {
      const scores = tokens.map((t) => scoreToken(item, t));
      return { item, index, score: scores.includes(0) ? 0 : scores.reduce((a, b) => a + b, 0) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.item);
}
