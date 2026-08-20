import { expandTurkishModelQuery } from "@/lib/model-discovery/turkish-query";
import { normalizeTurkish } from "@/lib/search/turkish-match";

const PRINTABLES_ORIGIN = "https://www.printables.com";
const PRINTABLES_PATH = "/search/models";
const MAX_QUERY_LENGTH = 80;

/**
 * Longest-phrase-first Turkish → English map.
 * Keys are normalized (ASCII-folded). Suffix variants are expanded at build time.
 */
const BASE_PHRASES: Array<[string, string]> = [
  ["aksiyon figuru", "action figure"],
  ["karakter figuru", "character figurine"],
  ["kedi figuru", "cat figurine"],
  ["kopek figuru", "dog figurine"],
  ["oyun kolu standi", "game controller stand"],
  ["oyun kolu tutucu", "game controller stand"],
  ["masaustu duzenleyici", "desk organizer"],
  ["masa duzenleyici", "desk organizer"],
  ["telefon tutucu", "phone stand"],
  ["telefon standi", "phone stand"],
  ["gozluk standi", "glasses stand"],
  ["gozluk tutucu", "glasses stand"],
  ["kulaklik standi", "headphone stand"],
  ["kulaklik tutucu", "headphone stand"],
  ["kablo duzenleyici", "cable organizer"],
  ["duvar aski", "wall hook"],
  ["araba modeli", "car model"],
  ["ucak modeli", "airplane model"],
  ["figur", "figurine"],
  ["figuru", "figurine"],
  ["figurler", "figurines"],
  ["figurleri", "figurines"],
  ["biblo", "decorative figurine"],
  ["heykel", "sculpture"],
  ["bust", "bust"],
  ["oyuncak", "toy"],
  ["ejderha", "dragon"],
  ["vazo", "vase"],
  ["saksi", "planter"],
  ["anahtarlik", "keychain"],
  ["mumluk", "candle holder"],
  ["abajur", "lampshade"],
  ["duzenleyici", "desk organizer"],
  ["aski", "wall hook"],
  ["lamba", "lamp"],
  ["kalemlik", "pen holder"],
  ["kalem tutucu", "pen holder"],
];

function expandSuffixVariants(phrase: string): string[] {
  const parts = phrase.split(" ");
  const last = parts[parts.length - 1]!;
  const head = parts.slice(0, -1);
  const variants = new Set<string>([phrase]);

  // Common stand / tutucu / figür / düzenleyici / model packs (explicit only —
  // avoid blanket suffixes that collide, e.g. figur+ler vs figurler).
  if (last === "standi" || last.startsWith("stand")) {
    for (const form of ["standi", "stand", "standlari", "standlar", "standini"]) {
      variants.add([...head, form].join(" ").trim());
    }
  }
  if (last === "tutucu") {
    for (const form of ["tutucu", "tutucular", "tutucusu", "tutacagi", "tutacagini"]) {
      variants.add([...head, form].join(" ").trim());
    }
  }
  if (last === "duzenleyici") {
    for (const form of [
      "duzenleyici",
      "duzenleyicisi",
      "duzenleyiciler",
      "duzenleyicileri",
    ]) {
      variants.add([...head, form].join(" ").trim());
    }
  }
  if (last === "figurler" || last === "figurleri") {
    for (const form of ["figurler", "figurleri"]) {
      variants.add([...head, form].join(" ").trim());
    }
  } else if (last === "figur" || last === "figuru") {
    for (const form of ["figur", "figuru", "figurun", "figurunu", "figure"]) {
      variants.add([...head, form].join(" ").trim());
    }
  }
  if (last === "modeli") {
    for (const form of ["modeli", "model", "modelleri", "modeller"]) {
      variants.add([...head, form].join(" ").trim());
    }
  }
  if (last === "aski") {
    for (const form of ["aski", "askisi", "askilar", "askilari"]) {
      variants.add([...head, form].join(" ").trim());
    }
  }

  // Light singular inflection for roots (standı / tutucu already covered above).
  if (parts.length === 1) {
    for (const suffix of ["i", "u", "si", "su", "in", "un", "ini", "unu"]) {
      variants.add(`${last}${suffix}`);
    }
  } else {
    for (const suffix of ["i", "u", "si", "su", "ini", "unu"]) {
      variants.add([...head, `${last}${suffix}`].join(" ").trim());
    }
  }

  return [...variants];
}

const LOOKUP = new Map<string, string>();
for (const [phrase, en] of BASE_PHRASES) {
  for (const variant of expandSuffixVariants(phrase)) {
    if (!LOOKUP.has(variant)) {
      LOOKUP.set(variant, en);
    }
  }
}

const MAX_PHRASE_TOKENS = Math.max(
  ...[...LOOKUP.keys()].map((key) => key.split(" ").length),
);

export interface PrintablesRedirectPlan {
  turkishQuery: string;
  englishQuery: string;
  blocked: boolean;
  blockReason?: string;
  dictionaryMatch: boolean;
  href: string | null;
}

export function sanitizePrintablesQuery(raw: string) {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

/**
 * Greedy left-to-right longest-phrase translation.
 * Avoids “kedi figürü” → “cat figurine figurine”.
 */
export function translateTurkishToEnglishPhrase(turkishInput: string): {
  englishQuery: string;
  dictionaryMatch: boolean;
} {
  const normalized = normalizeTurkish(sanitizePrintablesQuery(turkishInput));
  if (!normalized) {
    return { englishQuery: "", dictionaryMatch: false };
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let i = 0;
  let matchedAny = false;

  while (i < tokens.length) {
    let hit: string | null = null;
    let consumed = 0;
    const maxLen = Math.min(MAX_PHRASE_TOKENS, tokens.length - i);
    for (let len = maxLen; len >= 1; len -= 1) {
      const slice = tokens.slice(i, i + len).join(" ");
      const en = LOOKUP.get(slice);
      if (en) {
        hit = en;
        consumed = len;
        break;
      }
    }
    if (hit) {
      out.push(hit);
      i += consumed;
      matchedAny = true;
    } else if (!matchedAny) {
      out.push(tokens[i]!);
      i += 1;
    } else {
      // Ignore leftover unknown tokens after a confident phrase.
      break;
    }
  }

  if (matchedAny) {
    return {
      englishQuery: sanitizePrintablesQuery(out.join(" ")),
      dictionaryMatch: true,
    };
  }

  const expansion = expandTurkishModelQuery(turkishInput);
  const fallback = sanitizePrintablesQuery(
    expansion.englishQueries[0] ?? normalized,
  );
  return { englishQuery: fallback, dictionaryMatch: false };
}

export function selectBestPrintablesEnglishQuery(turkishInput: string): PrintablesRedirectPlan {
  const turkishQuery = sanitizePrintablesQuery(turkishInput);
  const expansion = expandTurkishModelQuery(turkishQuery);

  if (expansion.blocked) {
    return {
      turkishQuery,
      englishQuery: "",
      blocked: true,
      blockReason: expansion.blockReason,
      dictionaryMatch: false,
      href: null,
    };
  }

  if (!turkishQuery) {
    return {
      turkishQuery: "",
      englishQuery: "",
      blocked: false,
      dictionaryMatch: false,
      href: null,
    };
  }

  const translated = translateTurkishToEnglishPhrase(turkishQuery);
  return {
    turkishQuery,
    englishQuery: translated.englishQuery,
    blocked: false,
    dictionaryMatch: translated.dictionaryMatch,
    href: buildPrintablesSearchUrl(translated.englishQuery),
  };
}

export function buildPrintablesSearchUrl(englishQuery: string): string | null {
  const q = sanitizePrintablesQuery(englishQuery);
  if (!q) {
    return null;
  }

  const url = new URL(PRINTABLES_PATH, PRINTABLES_ORIGIN);
  const params = new URLSearchParams();
  params.set("q", q);
  url.search = params.toString();

  if (url.protocol !== "https:") {
    return null;
  }
  if (url.hostname !== "www.printables.com") {
    return null;
  }
  if (url.pathname !== PRINTABLES_PATH) {
    return null;
  }
  if ([...url.searchParams.keys()].join(",") !== "q") {
    return null;
  }

  return `${url.origin}${url.pathname}?q=${encodeURIComponent(q)}`;
}

export function isAllowedPrintablesSearchUrl(candidate: string) {
  try {
    const url = new URL(candidate);
    return (
      url.protocol === "https:" &&
      url.hostname === "www.printables.com" &&
      url.pathname === PRINTABLES_PATH &&
      [...url.searchParams.keys()].join(",") === "q" &&
      Boolean(url.searchParams.get("q")?.trim())
    );
  } catch {
    return false;
  }
}
