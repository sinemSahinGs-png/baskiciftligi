/**
 * Turkish-insensitive text matching for storefront search.
 */
export function normalizeTurkish(input: string) {
  return input
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\u0307/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");
}

export function matchesTurkish(haystack: string, needle: string) {
  const normalizedHaystack = normalizeTurkish(haystack);
  const normalizedNeedle = normalizeTurkish(needle);
  if (!normalizedNeedle) {
    return true;
  }
  return normalizedHaystack.includes(normalizedNeedle);
}

export function tokenizeTurkish(input: string) {
  return normalizeTurkish(input)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}
