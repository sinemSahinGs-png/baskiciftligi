import { normalizeTurkish } from "@/lib/search/turkish-match";

export const THINGIVERSE_CATEGORY_LABELS = [
  "Masaüstü Aksesuarları",
  "Biblo ve Heykel",
  "Ev ve Dekorasyon",
  "Anahtarlık",
  "Fonksiyonel Parçalar",
  "Kişiye Özel Ürünler",
  "Kurumsal Promosyon",
] as const;

export type ThingiverseCategoryLabel =
  (typeof THINGIVERSE_CATEGORY_LABELS)[number];

const RULES: Array<{ label: ThingiverseCategoryLabel; needles: string[] }> = [
  {
    label: "Masaüstü Aksesuarları",
    needles: [
      "gadget",
      "gadgets",
      "desk",
      "phone stand",
      "phone holder",
      "organizer",
      "holder",
      "stand",
      "masa",
      "telefon",
      "tutucu",
    ],
  },
  {
    label: "Biblo ve Heykel",
    needles: [
      "art",
      "sculpture",
      "sculptures",
      "figurine",
      "figure",
      "statue",
      "bust",
      "heykel",
      "biblo",
      "figur",
    ],
  },
  {
    label: "Ev ve Dekorasyon",
    needles: [
      "household",
      "home",
      "decor",
      "decoration",
      "vase",
      "planter",
      "lamp",
      "ev",
      "dekor",
      "vazo",
      "saksi",
    ],
  },
  {
    label: "Anahtarlık",
    needles: ["keychain", "keychains", "key ring", "anahtarlik", "anahtar"],
  },
  {
    label: "Fonksiyonel Parçalar",
    needles: [
      "tool",
      "tools",
      "replacement",
      "spare part",
      "mechanical",
      "bracket",
      "mount",
      "fonksiyonel",
      "yedek",
      "parca",
    ],
  },
  {
    label: "Kişiye Özel Ürünler",
    needles: [
      "customizable",
      "custom",
      "personalized",
      "name plate",
      "kisiye ozel",
      "ozel",
    ],
  },
  {
    label: "Kurumsal Promosyon",
    needles: [
      "business",
      "promotional",
      "promo",
      "corporate",
      "logo",
      "kurumsal",
      "promosyon",
    ],
  },
];

export function mapThingiverseCategory(input: {
  name?: string | null;
  description?: string | null;
  tags?: Array<string | { name?: string | null } | null> | null;
}): ThingiverseCategoryLabel | "Thingiverse" {
  const tagText = (input.tags ?? [])
    .map((tag) => (typeof tag === "string" ? tag : tag?.name ?? ""))
    .join(" ");
  const haystack = normalizeTurkish(
    `${input.name ?? ""} ${input.description ?? ""} ${tagText}`,
  );
  if (!haystack) {
    return "Thingiverse";
  }

  for (const rule of RULES) {
    if (rule.needles.some((needle) => haystack.includes(normalizeTurkish(needle)))) {
      return rule.label;
    }
  }
  return "Thingiverse";
}
