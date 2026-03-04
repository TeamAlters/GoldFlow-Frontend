import { getAllEntityNames, getEntityConfig, hasEntityFeature } from '../../config/entity.config';

export interface EntitySearchItem {
  entityName: string;
  displayName: string;
  displayNamePlural: string;
  routes: {
    list: string;
    add?: string;
  };
  canCreate: boolean;
}

function normalize(str: string): string {
  return str.toLowerCase();
}

/**
 * Build a static index of entities that can be searched in the UI.
 * Pure function: no router, no stores, no side effects.
 */
export function buildEntitySearchIndex(): EntitySearchItem[] {
  const entityNames = getAllEntityNames();

  return entityNames.map((entityName) => {
    const config = getEntityConfig(entityName);
    const canCreate = hasEntityFeature(entityName, 'canCreate') && !!config.routes.add;

    return {
      entityName,
      displayName: config.displayName,
      displayNamePlural: config.displayNamePlural,
      routes: {
        list: config.routes.list,
        add: config.routes.add,
      },
      canCreate,
    };
  });
}

/**
 * Filter the entity search index by a query string.
 * Matches on displayName and displayNamePlural using case-insensitive "contains".
 * Results are sorted so that "starts with" matches come before plain "contains" matches.
 */
export function filterEntitySearchIndex(index: EntitySearchItem[], rawQuery: string): EntitySearchItem[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const q = normalize(query);

  type ScoredItem = { score: number; item: EntitySearchItem };
  const scored: ScoredItem[] = [];

  for (const item of index) {
    const name = normalize(item.displayName);
    const plural = normalize(item.displayNamePlural);

    const inName = name.includes(q);
    const inPlural = plural.includes(q);

    if (!inName && !inPlural) continue;

    let score = 0;
    if (name.startsWith(q) || plural.startsWith(q)) {
      score += 10;
    }
    if (inName) score += 2;
    if (inPlural) score += 1;

    scored.push({ score, item });
  }

  scored.sort((a, b) => b.score - a.score || a.item.displayName.localeCompare(b.item.displayName));

  return scored.map((entry) => entry.item);
}

