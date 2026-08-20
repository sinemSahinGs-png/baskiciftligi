/**
 * Turkish → English 3D-printing query expansion (deterministic, no paid API required).
 */
export interface TurkishQueryExpansion {
  original: string;
  normalized: string;
  category: string | null;
  englishQueries: string[];
  blocked: boolean;
  blockReason?: string;
}

const BLOCKED_PATTERNS = [
  /\b(silah|tabanca|silahlar)\b/i,
  /\b(glock|ak47|ar15)\b/i,
  /\bporn\b/i,
  /\bnsfw\b/i,
];

const VOCABULARY: Array<{
  tr: RegExp;
  category: string;
  en: string[];
}> = [
  { tr: /\bvazo(lar)?\b/i, category: "dekorasyon", en: ["vase", "decorative vase", "spiral vase"] },
  {
    tr: /\btelefon\s*tutucu(lar)?\b/i,
    category: "aksesuar",
    en: ["phone stand", "phone holder", "smartphone dock"],
  },
  {
    tr: /\bmasaüstü\s*düzenleyici(lar)?\b/i,
    category: "organizer",
    en: ["desk organizer", "desktop organizer", "office organizer"],
  },
  { tr: /\bsaksı(lar)?\b/i, category: "bahçe", en: ["planter", "plant pot", "flower pot"] },
  { tr: /\banahtarlık(lar)?\b/i, category: "aksesuar", en: ["keychain", "key ring", "key fob"] },
  {
    tr: /\bkablo\s*düzenleyici(lar)?\b/i,
    category: "organizer",
    en: ["cable organizer", "cable clip", "cable management"],
  },
  { tr: /\blamba(lar)?\b/i, category: "aydınlatma", en: ["lamp", "lampshade", "desk lamp"] },
  {
    tr: /\bduvar\s*raf(ı|ları)?\b/i,
    category: "mobilya",
    en: ["wall shelf", "floating shelf", "wall mounted shelf"],
  },
  {
    tr: /\byedek\s*parça(lar)?\b/i,
    category: "parça",
    en: ["replacement part", "repair part", "spare part"],
  },
  { tr: /\bbench(y)?\b/i, category: "kalibrasyon", en: ["3dbenchy", "benchmark boat"] },
];

function normalizeTurkish(input: string) {
  return input
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\u0307/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function expandTurkishModelQuery(raw: string): TurkishQueryExpansion {
  const normalized = normalizeTurkish(raw);
  if (!normalized) {
    return { original: raw, normalized, category: null, englishQueries: [], blocked: false };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        original: raw,
        normalized,
        category: null,
        englishQueries: [],
        blocked: true,
        blockReason: "policy",
      };
    }
  }

  const matches = VOCABULARY.filter((entry) => entry.tr.test(normalized));
  const englishQueries = [
    ...new Set([
      normalized,
      ...matches.flatMap((entry) => entry.en),
    ]),
  ].slice(0, 6);

  return {
    original: raw,
    normalized,
    category: matches[0]?.category ?? null,
    englishQueries: englishQueries.length ? englishQueries : [normalized],
    blocked: false,
  };
}

export function displayTitleFromQuery(expansion: TurkishQueryExpansion, fallback: string) {
  if (expansion.original.trim()) {
    return expansion.original.trim();
  }
  return fallback;
}
