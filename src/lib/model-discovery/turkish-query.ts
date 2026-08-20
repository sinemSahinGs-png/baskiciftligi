/**
 * Turkish → English 3D-printing query expansion (deterministic, no paid API required).
 */
import { normalizeTurkish } from "@/lib/search/turkish-match";

export interface TurkishQueryExpansion {
  original: string;
  normalized: string;
  category: string | null;
  englishQueries: string[];
  blocked: boolean;
  blockReason?: string;
}

const BLOCKED_PATTERNS = [
  /\b(silah|tabanca|silahlar|tüfek|bomba|patlayici|patlayıcı)\b/i,
  /\b(glock|ak47|ar15|m16|uzi)\b/i,
  /\bporn\b/i,
  /\bnsfw\b/i,
  /\b(18\+|yetiskin|yetişkin)\b/i,
];

const INTENT_TERMS: Record<string, string[]> = {
  stand: ["stand", "holder", "dock"],
  tutucu: ["holder", "stand", "mount"],
  duzenleyici: ["organizer", "organiser", "tray", "storage"],
  aski: ["hook", "hanger", "wall mount", "bracket"],
  raf: ["shelf", "rack", "wall shelf"],
  vazo: ["vase", "planter pot"],
  saksı: ["planter", "flower pot", "plant pot"],
  saksi: ["planter", "flower pot", "plant pot"],
  lamba: ["lamp", "light shade", "desk lamp"],
  anahtarlik: ["keychain", "key ring", "key fob"],
};

const VOCABULARY: Array<{
  tr: RegExp;
  category: string;
  en: string[];
}> = [
  { tr: /\bvazo(lar)?\b/i, category: "dekorasyon", en: ["vase", "decorative vase", "spiral vase"] },
  {
    tr: /\btelefon\s*tutucu(lar)?|telefon\s*stand(i|lari)?\b/i,
    category: "masaüstü",
    en: ["phone stand", "phone holder", "smartphone dock", "desktop phone stand"],
  },
  {
    tr: /\bmasaustu\s*duzenleyici(lar)?|masa\s*duzenleyici(lar)?\b/i,
    category: "masaüstü",
    en: ["desk organizer", "desktop organizer", "office organizer", "pen holder tray"],
  },
  {
    tr: /\bgozluk\s*stand(i|lari)?|gozluk\s*tutucu(lar)?\b/i,
    category: "masaüstü",
    en: ["glasses stand", "eyewear holder", "sunglasses stand"],
  },
  {
    tr: /\bkulaklik\s*stand(i|lari)?|kulaklik\s*tutucu(lar)?\b/i,
    category: "masaüstü",
    en: ["headphone stand", "headset holder", "earphone dock"],
  },
  {
    tr: /\boyun\s*kolu\s*stand(i|lari)?|kontrolcu\s*stand(i|lari)?\b/i,
    category: "masaüstü",
    en: ["controller stand", "gamepad holder", "xbox controller stand"],
  },
  {
    tr: /\bkablo\s*duzenleyici(lar)?|kablo\s*klips(i|leri)?\b/i,
    category: "fonksiyonel",
    en: ["cable organizer", "cable clip", "cable management", "wire holder"],
  },
  {
    tr: /\bduvar\s*aski(sı|si|ilar)?|\baski\b/i,
    category: "fonksiyonel",
    en: ["wall hook", "wall hanger", "coat hook", "wall mount hook"],
  },
  { tr: /\bsaks(i|ı)(lar)?|saksi(lar)?\b/i, category: "saksı/vazo", en: ["planter", "plant pot", "flower pot"] },
  { tr: /\banahtarlik(lar)?\b/i, category: "aksesuar", en: ["keychain", "key ring", "key fob"] },
  { tr: /\blamba(lar)?\b/i, category: "aydınlatma", en: ["lamp", "lampshade", "desk lamp", "light fixture"] },
  {
    tr: /\bduvar\s*raf(i|lari)?\b/i,
    category: "mobilya",
    en: ["wall shelf", "floating shelf", "wall mounted shelf"],
  },
  {
    tr: /\bmasa\s*raf(i|lari)?\b/i,
    category: "masaüstü",
    en: ["desk shelf", "monitor shelf", "desk riser"],
  },
  {
    tr: /\byedek\s*parca(lar)?\b/i,
    category: "parça",
    en: ["replacement part", "repair part", "spare part"],
  },
  { tr: /\bbench(y)?\b/i, category: "kalibrasyon", en: ["3dbenchy", "benchmark boat"] },
  {
    tr: /\bkalem\s*tutucu(lar)?|kalemlik(ler)?\b/i,
    category: "masaüstü",
    en: ["pen holder", "pencil cup", "desk pen organizer"],
  },
  {
    tr: /\bmumluk(lar)?\b/i,
    category: "dekorasyon",
    en: ["candle holder", "candlestick"],
  },
  {
    tr: /\babajur(lar)?\b/i,
    category: "aydınlatma",
    en: ["lampshade", "lamp shade"],
  },
  {
    tr: /\bcop\s*kova(sı|si|lari)?\b/i,
    category: "fonksiyonel",
    en: ["trash bin", "waste basket", "desktop bin"],
  },
];

function expandIntentTerms(normalized: string) {
  const extras: string[] = [];
  for (const [tr, enTerms] of Object.entries(INTENT_TERMS)) {
    if (normalized.includes(tr)) {
      extras.push(...enTerms);
    }
  }
  return extras;
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
      ...matches.flatMap((entry) => entry.en),
      ...(matches.length === 0 ? expandIntentTerms(normalized) : []),
    ]),
  ].slice(0, 8);

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
