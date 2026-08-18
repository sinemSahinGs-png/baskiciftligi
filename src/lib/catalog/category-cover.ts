export function categoryCoverPublicPath(slug: string): string {
  return `/demo/categories/${slug}.png`;
}

export function resolveCategoryCoverUrl(
  slug: string,
  stored?: string | null,
): string {
  const value = stored?.trim() ?? "";
  if (!value || value.endsWith(".svg")) {
    return categoryCoverPublicPath(slug);
  }
  return value;
}
