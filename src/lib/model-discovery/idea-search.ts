import { expandTurkishModelQuery } from "@/lib/model-discovery/turkish-query";
import { translateTurkishToEnglishPhrase } from "@/lib/model-discovery/printables-redirect";
import { normalizeTurkish } from "@/lib/search/turkish-match";
import type { ExternalModelSummary } from "@/providers/contracts";

export const IDEA_SEARCH_MIN_LENGTH = 2;
export const IDEA_SEARCH_MAX_LENGTH = 160;
export const IDEA_SEARCH_MAX_VARIANTS = 3;
export const IDEA_SEARCH_MOBILE_PAGE_SIZE = 6;
export const IDEA_SEARCH_RESULT_CAP = 18;

const STOPWORDS = new Set([
  "istiyorum",
  "isterim",
  "lutfen",
  "lütfen",
  "icin",
  "için",
  "seklinde",
  "şeklinde",
  "gibi",
  "bir",
  "ve",
  "ile",
  "olan",
  "bana",
  "benim",
  "ben",
  "ya",
  "da",
  "de",
  "mi",
  "mu",
  "mü",
  "misin",
  "misiniz",
  "yap",
  "yapin",
  "yapın",
  "uretebilir",
  "üretebilir",
  "of",
  "the",
  "a",
  "an",
  "for",
  "my",
  "me",
  "to",
  "with",
]);

const MODIFIERS: Array<{ pattern: RegExp; en: string[] }> = [
  { pattern: /\bejderha|dragon\b/i, en: ["dragon"] },
  { pattern: /\bkedim?|cats?\b/i, en: ["cat"] },
  { pattern: /\bkopek(ler)?|köpek(ler)?\b/i, en: ["dog"] },
  { pattern: /\bevcıl|evcil\b/i, en: ["pet"] },
  { pattern: /\bgitar\b/i, en: ["guitar"] },
  { pattern: /\baraba\b/i, en: ["car"] },
  { pattern: /\bnoel|yilbasi|yılbaşı\b/i, en: ["christmas"] },
  { pattern: /\bkalp\b/i, en: ["heart"] },
  { pattern: /\bisimli|kisisellestir|kişiselleştir\b/i, en: ["personalized"] },
  { pattern: /\bduvara\s+asilan|duvara\s+asılan\b/i, en: ["wall"] },
  { pattern: /\bmasaustu|masaüstü\b/i, en: ["desktop"] },
  { pattern: /\bsevgiliye\b/i, en: ["gift"] },
];

const OBJECTS: Array<{
  pattern: RegExp;
  primary: string;
  alts: string[];
  category: string;
}> = [
  {
    pattern: /\btelefon\s*(standi|standı|tutucu|holder)|phone\s*(stand|holder|dock)|smartphone\s*(holder|stand)\b/i,
    primary: "phone stand",
    alts: ["smartphone holder", "phone holder"],
    category: "masaüstü",
  },
  {
    pattern: /\bmama\s*kab(i|ı)|mama\s*kasesi\b/i,
    primary: "pet bowl",
    alts: ["cat bowl", "dog bowl"],
    category: "evcil",
  },
  {
    pattern: /\bgitar\s*(aparati|aparatı|aski|askısı|askisi|hanger|tutucu)\b/i,
    primary: "guitar hanger",
    alts: ["guitar wall mount", "guitar holder"],
    category: "fonksiyonel",
  },
  {
    pattern: /\bkulaklik\s*(standi|standı|tutucu)\b/i,
    primary: "headphone stand",
    alts: ["headset holder", "headphone holder"],
    category: "masaüstü",
  },
  {
    pattern: /\bmumluk(lar)?\b/i,
    primary: "candle holder",
    alts: ["candlestick", "tealight holder"],
    category: "dekorasyon",
  },
  {
    pattern: /\banahtarlik(lar)?\b/i,
    primary: "keychain",
    alts: ["key ring", "heart keychain"],
    category: "aksesuar",
  },
  {
    pattern: /\bsaks(i|ı)(lar)?\b/i,
    primary: "planter",
    alts: ["flower pot", "plant pot"],
    category: "saksı/vazo",
  },
  {
    pattern: /\bvazo(lar)?\b/i,
    primary: "vase",
    alts: ["decorative vase", "spiral vase"],
    category: "dekorasyon",
  },
  {
    pattern: /\bduvar\s*dekoru|duvar\s*susu|wall\s*decor\b/i,
    primary: "wall decor",
    alts: ["wall art", "wall sculpture"],
    category: "dekorasyon",
  },
  {
    pattern: /\bmasaustu\s*duzenleyici|masa\s*duzenleyici\b/i,
    primary: "desk organizer",
    alts: ["desktop organizer", "office organizer"],
    category: "masaüstü",
  },
  {
    pattern: /\bfigur|figür|figuru|figürü\b/i,
    primary: "figurine",
    alts: ["statue", "sculpture"],
    category: "dekorasyon",
  },
  {
    pattern: /\blamba(lar)?|abajur(lar)?\b/i,
    primary: "lamp",
    alts: ["desk lamp", "lampshade"],
    category: "aydınlatma",
  },
  {
    pattern: /\bevcıl\s*hayvan|evcil\s*hayvan\b/i,
    primary: "pet accessory",
    alts: ["pet bowl", "pet toy"],
    category: "evcil",
  },
];

export type IdeaSearchValidation =
  | { ok: true; query: string }
  | { ok: false; reason: "empty" | "too_short" | "too_long" | "unsafe" };

export interface IdeaSearchPlan {
  original: string;
  sanitized: string;
  normalized: string;
  blocked: boolean;
  blockReason?: string;
  object: string | null;
  modifiers: string[];
  category: string | null;
  variants: string[];
  chips: string[];
}

export function sanitizeIdeaQuery(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw
    .replace(/<script\b[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, IDEA_SEARCH_MAX_LENGTH);
}

export function validateIdeaQuery(raw: unknown): IdeaSearchValidation {
  if (typeof raw !== "string") {
    return { ok: false, reason: "empty" };
  }
  if (raw.trim().length > IDEA_SEARCH_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  const sanitized = sanitizeIdeaQuery(raw);
  if (!sanitized) {
    return { ok: false, reason: "empty" };
  }
  if (sanitized.length < IDEA_SEARCH_MIN_LENGTH) {
    return { ok: false, reason: "too_short" };
  }
  if (/javascript:|data:text\/html/i.test(sanitized)) {
    return { ok: false, reason: "unsafe" };
  }
  return { ok: true, query: sanitized };
}

function uniqueTerms(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const term = value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
    if (!term || seen.has(term)) continue;
    seen.add(term);
    output.push(term);
  }
  return output;
}

function extractModifiers(normalized: string) {
  const found: string[] = [];
  for (const entry of MODIFIERS) {
    if (entry.pattern.test(normalized)) {
      found.push(...entry.en);
    }
  }
  return uniqueTerms(found);
}

function extractObject(normalized: string) {
  for (const entry of OBJECTS) {
    if (entry.pattern.test(normalized)) {
      return entry;
    }
  }
  return null;
}

function composeSpecifiedExamples(modifiers: string[], object: string | null) {
  const hasDragon = modifiers.includes("dragon");
  const hasCat = modifiers.includes("cat") || modifiers.includes("pet");
  const hasPersonalized = modifiers.includes("personalized");
  if (hasDragon && object?.includes("phone")) {
    return ["dragon phone stand", "dragon smartphone holder", "phone stand dragon"];
  }
  if (hasCat && (object?.includes("bowl") || object?.includes("pet"))) {
    return ["custom cat bowl", "personalized pet bowl", "cat name bowl"];
  }
  if (hasPersonalized && object?.includes("keychain") && modifiers.includes("heart")) {
    return ["heart keychain", "custom heart keychain", "personalized keychain"];
  }
  return null;
}

function composeVariants(input: {
  modifiers: string[];
  object: ReturnType<typeof extractObject>;
  translated: string;
  expansion: string[];
}) {
  const specified = composeSpecifiedExamples(
    input.modifiers,
    input.object?.primary ?? null,
  );
  if (specified) {
    return specified.slice(0, IDEA_SEARCH_MAX_VARIANTS);
  }

  const modifiers = input.modifiers.filter(
    (item) => item !== "personalized" && item !== "custom",
  );
  const custom = input.modifiers.includes("personalized");
  const primary = input.object?.primary ?? null;
  const alt = input.object?.alts[0] ?? null;
  const variants: string[] = [];

  if (primary) {
    const head = [...(custom ? ["custom"] : []), ...modifiers].join(" ").trim();
    variants.push([head, primary].filter(Boolean).join(" ").trim());
    if (alt) {
      variants.push(
        [custom ? "personalized" : modifiers.join(" "), alt]
          .filter(Boolean)
          .join(" ")
          .trim(),
      );
    }
    variants.push([primary, modifiers.join(" ")].filter(Boolean).join(" ").trim());
    return uniqueTerms(variants).slice(0, IDEA_SEARCH_MAX_VARIANTS);
  }

  const cleanedTranslation = uniqueTerms(
    input.translated
      .split(/\s+/)
      .filter((token) => token && !STOPWORDS.has(token)),
  ).join(" ");
  if (cleanedTranslation) {
    variants.push(cleanedTranslation);
  }
  variants.push(...input.expansion);

  return uniqueTerms(variants).slice(0, IDEA_SEARCH_MAX_VARIANTS);
}

export function planIdeaSearch(raw: unknown): IdeaSearchPlan {
  const sanitized = sanitizeIdeaQuery(raw);
  const normalized = normalizeTurkish(sanitized);
  const expansion = expandTurkishModelQuery(sanitized);

  if (!sanitized) {
    return {
      original: typeof raw === "string" ? raw : "",
      sanitized,
      normalized,
      blocked: false,
      object: null,
      modifiers: [],
      category: null,
      variants: [],
      chips: [],
    };
  }

  if (expansion.blocked) {
    return {
      original: sanitized,
      sanitized,
      normalized,
      blocked: true,
      blockReason: expansion.blockReason,
      object: null,
      modifiers: [],
      category: null,
      variants: [],
      chips: [],
    };
  }

  const object = extractObject(normalized);
  const modifiers = extractModifiers(normalized);
  const translated = translateTurkishToEnglishPhrase(sanitized).englishQuery;
  const leftover = normalized
    .split(/\s+/)
    .filter((token) => token && !STOPWORDS.has(token));
  const chips = uniqueTerms([
    ...modifiers,
    ...(object ? [object.primary, ...object.alts.slice(0, 1)] : []),
    ...leftover.slice(0, 3),
  ]).slice(0, 5);

  const variants = composeVariants({
    modifiers,
    object,
    translated,
    expansion: expansion.englishQueries,
  });

  return {
    original: sanitized,
    sanitized,
    normalized,
    blocked: false,
    object: object?.primary ?? null,
    modifiers,
    category: object?.category ?? expansion.category,
    variants:
      variants.length > 0 ? variants : uniqueTerms([translated || sanitized]).slice(0, 1),
    chips,
  };
}

export function ideaSearchCacheKey(plan: IdeaSearchPlan, page: number) {
  return `${plan.normalized}:${plan.variants.join("|")}:${page}`;
}

export function scoreIdeaResult(item: ExternalModelSummary, variants: string[]) {
  const haystack = `${item.title} ${item.description ?? ""}`.toLocaleLowerCase("en-US");
  let value = 0;
  for (const variant of variants) {
    const terms = variant.split(/\s+/).filter(Boolean);
    if (haystack.includes(variant)) value += 14;
    for (const term of terms) {
      if (haystack.includes(term)) value += 4;
      if (item.title.toLocaleLowerCase("en-US").includes(term)) value += 3;
    }
  }
  if (item.thumbnailUrl) value += 2;
  if (typeof item.likeCount === "number") {
    value += Math.min(8, Math.log10(item.likeCount + 1) * 2);
  }
  if (item.pricingAllowed) value += 1;
  return value;
}

export function rankAndDedupeIdeaResults(
  items: ExternalModelSummary[],
  variants: string[],
) {
  const seen = new Set<string>();
  const unique: ExternalModelSummary[] = [];
  for (const item of items) {
    const id = item.externalId?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(item);
  }
  return unique.sort(
    (a, b) => scoreIdeaResult(b, variants) - scoreIdeaResult(a, variants),
  );
}

export function isWeakIdeaMatch(
  items: ExternalModelSummary[],
  variants: string[],
) {
  if (items.length === 0) return false;
  const top = items[0];
  if (!top) return false;
  return scoreIdeaResult(top, variants) < 8;
}

export interface IdeaSearchCard {
  externalId: string;
  title: string;
  creatorName: string;
  thumbnailUrl: string | null;
  likeCount: number | null;
  collectCount: number | null;
  source: "thingiverse";
  detailPath: string;
  pricingAllowed: boolean;
}
