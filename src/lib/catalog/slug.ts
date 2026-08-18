const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function slugifyTurkish(value: string, maxLength = 180): string {
  const mapped = Array.from(value)
    .map((character) => TURKISH_CHAR_MAP[character] ?? character)
    .join("");

  return mapped
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export function assertUniqueSlug(
  slug: string,
  owners: Array<{ id: string; slug: string }>,
  currentId?: string,
): void {
  const conflict = owners.find(
    (item) => item.slug === slug && item.id !== currentId,
  );

  if (conflict) {
    throw new Error("Bu slug başka bir üründe kullanılıyor.");
  }
}
