import type { ExternalModelSummary, BrowsableExternalModelProvider, ExternalModelProvider } from "@/providers/contracts";

export function isBrowsableProvider(
  provider: ExternalModelProvider | BrowsableExternalModelProvider,
): provider is BrowsableExternalModelProvider {
  return "browse" in provider && typeof provider.browse === "function";
}

export function dedupeSummaries(items: ExternalModelSummary[]) {
  const seen = new Set<string>();
  const output: ExternalModelSummary[] = [];
  for (const item of items) {
    const key = `${item.source}:${item.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

export function rankSummaries(
  items: ExternalModelSummary[],
  englishQueries: string[],
): ExternalModelSummary[] {
  const terms = englishQueries.map((term) => term.toLocaleLowerCase("en-US"));
  return [...items].sort((a, b) => score(b, terms) - score(a, terms));
}

function score(item: ExternalModelSummary, terms: string[]) {
  const haystack = `${item.title} ${item.description ?? ""}`.toLocaleLowerCase("en-US");
  let value = 0;
  for (const term of terms) {
    if (haystack.includes(term)) value += 10;
    if (item.title.toLocaleLowerCase("en-US").includes(term)) value += 5;
  }
  if (item.thumbnailUrl) value += 2;
  if (item.isPurchasable) value += 3;
  if (item.automaticManufacturingAllowed) value += 4;
  if (item.fileCount && item.fileCount > 0) value += 2;
  return value;
}
