/**
 * Notion-synced collection hubs often embed full phase/week bodies inline.
 * Child folders hold the same content — trim the hub to overview-only at read time.
 */
export function trimCollectionHubBody(
  content: string,
  childSlugs: string[],
): string {
  if (childSlugs.length === 0) return content;

  const match = content.match(/^## (?:Phase|Week) \d+ —/m);
  if (!match || match.index === undefined) return content;

  return content.slice(0, match.index).trimEnd();
}
