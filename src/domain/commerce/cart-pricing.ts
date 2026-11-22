import {
  displayKindForProduct,
  type CartLineDisplayKind,
} from "@/domain/catalog/presentation";
import {
  COMMERCE_SHIPPING_POLICY,
  computeCartShippingMinor,
  publicShippingPolicyFields,
} from "@/domain/commerce/shipping-policy";
import { isPubliclyVisibleProduct } from "@/lib/catalog/visibility";
import type { Product, ProductKind } from "@/domain/catalog/types";
import {
  listProjectCatalogProducts,
  projectSourceFromProduct,
  type ProjectSource,
} from "@/domain/project-destinations/catalog";
import { assertMinorUnits } from "@/lib/money";

export interface CartInputLine {
  productId: string;
  variantId?: string | null;
  quantity: number;
  personalization?: Record<string, string>;
  quoteId?: string;
}

export interface PricedCartLine {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  slug: string;
  imageUrl: string | null;
  unitPriceMinor: number;
  lineTotalMinor: number;
  quantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  productionLeadTimeDays: Product["productionLeadTimeDays"];
  isDemo: boolean;
  kind: ProductKind | null;
  displayKind: CartLineDisplayKind;
  quoteId?: string;
  projectSource?: ProjectSource | null;
  manufacturing?: {
    source: "upload" | "thingiverse";
    filename: string;
    thingTitle: string | null;
    selectedFileName: string | null;
    dimensionsMm: { x: number; y: number; z: number } | null;
    material: string;
    color: string;
    quality: string;
    infillPercent: number;
    supports: string;
    estimatedDurationSeconds: number | null;
    vatMinor: number;
    netMinor: number;
    reviewRequired: boolean;
    quoteExpiresAt: string;
    attributionText: string | null;
    licenseLabel: string | null;
  };
}

export interface CartPriceResult {
  currency: "TRY";
  lines: PricedCartLine[];
  subtotalMinor: number;
  campaignDiscountMinor: number;
  campaignLabel: string | null;
  estimatedShippingMinor: number;
  totalMinor: number;
  freeShippingThresholdMinor: number;
  hasUnavailableItems: boolean;
  pricedAt: string;
  shippingPolicy: ReturnType<typeof publicShippingPolicyFields>;
}

export const FREE_SHIPPING_THRESHOLD_MINOR =
  COMMERCE_SHIPPING_POLICY.freeShippingThresholdMinor ?? 0;
export const STANDARD_SHIPPING_MINOR = COMMERCE_SHIPPING_POLICY.standardShippingMinor;
export const CEP_ALBUM_SECOND_HALF_LABEL = "2. ürün %50 indirimli";

export function catalogForCartPricing(catalog: Product[]): Product[] {
  return [...catalog, ...listProjectCatalogProducts()];
}

export function priceCart(
  inputLines: CartInputLine[],
  products: Product[],
  pricedAt = new Date().toISOString(),
): CartPriceResult {
  const productById = new Map(products.map((product) => [product.id, product]));

  const lines = inputLines.map((input): PricedCartLine => {
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) {
      throw new RangeError("Sepet adedi pozitif bir tam sayı olmalıdır.");
    }

    const product = productById.get(input.productId);
    const key = `${input.productId}:${input.variantId ?? "default"}`;

    if (!product || !isPubliclyVisibleProduct(product)) {
      return {
        key,
        productId: input.productId,
        variantId: input.variantId ?? null,
        name: "Satışta olmayan ürün",
        variantName: null,
        slug: "",
        imageUrl: null,
        unitPriceMinor: 0,
        lineTotalMinor: 0,
        quantity: input.quantity,
        availableQuantity: 0,
        isAvailable: false,
        productionLeadTimeDays: { min: 0, max: 0 },
        isDemo: false,
        kind: null,
        displayKind: "store",
        projectSource: null,
      };
    }

    const variant = input.variantId
      ? product.variants.find(
          (item) => item.id === input.variantId && item.isActive,
        )
      : undefined;

    const requiresVariant = product.variants.length > 0;
    const availableQuantity = variant
      ? variant.inventoryQuantity
      : product.inventoryQuantity;
    const unitPriceMinor = assertMinorUnits(
      product.priceMinor + (variant?.priceAdjustmentMinor ?? 0),
    );
    const personalizationOk = personalizationSatisfied(
      product,
      input.personalization,
    );
    const allowsBackorder = product.inventoryPolicy === "continue";
    const isAvailable =
      (!requiresVariant || Boolean(variant)) &&
      personalizationOk &&
      (allowsBackorder ||
        (availableQuantity >= input.quantity && availableQuantity > 0));

    return {
      key,
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantName: variant?.name ?? null,
      slug: product.slug,
      imageUrl:
        product.media
          .find((item) => item.type === "image")
          ?.url.split("?")[0] ?? null,
      unitPriceMinor,
      lineTotalMinor: assertMinorUnits(unitPriceMinor * input.quantity),
      quantity: input.quantity,
      availableQuantity,
      isAvailable,
      productionLeadTimeDays: product.productionLeadTimeDays,
      isDemo: product.isDemo,
      kind: product.kind,
      displayKind: displayKindForProduct(product),
      projectSource: projectSourceFromProduct(product),
    };
  });

  const pricedLines = applyCepAlbumSecondHalfOff(lines);
  const grossSubtotalMinor = assertMinorUnits(
    lines.reduce(
      (total, line) => total + (line.isAvailable ? line.lineTotalMinor : 0),
      0,
    ),
  );
  const subtotalMinor = assertMinorUnits(
    pricedLines.reduce(
      (total, line) => total + (line.isAvailable ? line.lineTotalMinor : 0),
      0,
    ),
  );
  const campaignDiscountMinor = assertMinorUnits(grossSubtotalMinor - subtotalMinor);
  const estimatedShippingMinor = computeCartShippingMinor(subtotalMinor);

  return {
    currency: "TRY",
    lines: pricedLines,
    subtotalMinor,
    campaignDiscountMinor,
    campaignLabel: campaignDiscountMinor > 0 ? CEP_ALBUM_SECOND_HALF_LABEL : null,
    estimatedShippingMinor,
    totalMinor: assertMinorUnits(subtotalMinor + estimatedShippingMinor),
    freeShippingThresholdMinor: FREE_SHIPPING_THRESHOLD_MINOR,
    hasUnavailableItems: pricedLines.some((line) => !line.isAvailable),
    pricedAt,
    shippingPolicy: publicShippingPolicyFields(),
  };
}

function applyCepAlbumSecondHalfOff(lines: PricedCartLine[]): PricedCartLine[] {
  let unitIndex = 0;
  return lines.map((line) => {
    if (!line.isAvailable || line.projectSource !== "cep_album") {
      return line;
    }
    let lineTotalMinor = 0;
    for (let index = 0; index < line.quantity; index += 1) {
      const halfOff = unitIndex % 2 === 1;
      lineTotalMinor += halfOff
        ? assertMinorUnits(Math.trunc(line.unitPriceMinor / 2))
        : line.unitPriceMinor;
      unitIndex += 1;
    }
    return { ...line, lineTotalMinor: assertMinorUnits(lineTotalMinor) };
  });
}

export function splitLineForPayment(line: PricedCartLine): Array<{
  name: string;
  unitPriceMinor: number;
  quantity: number;
}> {
  const grossMinor = line.unitPriceMinor * line.quantity;
  const discountMinor = grossMinor - line.lineTotalMinor;
  if (discountMinor <= 0 || line.quantity < 1) {
    return [
      {
        name: line.name,
        unitPriceMinor: line.unitPriceMinor,
        quantity: line.quantity,
      },
    ];
  }

  const halfUnitMinor = Math.trunc(line.unitPriceMinor / 2);
  const discountPerHalf = line.unitPriceMinor - halfUnitMinor;
  if (discountPerHalf <= 0 || discountMinor % discountPerHalf !== 0) {
    return [
      {
        name: line.name,
        unitPriceMinor: line.lineTotalMinor,
        quantity: 1,
      },
    ];
  }

  const halfCount = discountMinor / discountPerHalf;
  const fullCount = line.quantity - halfCount;
  const rows: Array<{ name: string; unitPriceMinor: number; quantity: number }> =
    [];
  if (fullCount > 0) {
    rows.push({
      name: line.name,
      unitPriceMinor: line.unitPriceMinor,
      quantity: fullCount,
    });
  }
  if (halfCount > 0) {
    rows.push({
      name: `${line.name} · ${CEP_ALBUM_SECOND_HALF_LABEL}`,
      unitPriceMinor: halfUnitMinor,
      quantity: halfCount,
    });
  }
  return rows;
}

function personalizationSatisfied(
  product: Product,
  values: Record<string, string> | undefined,
): boolean {
  if (!product.personalizationEnabled) {
    return true;
  }

  return (product.personalizationFields ?? [])
    .filter((field) => field.required)
    .every((field) => {
      const value = values?.[field.id]?.trim() ?? "";
      if (!value) {
        return false;
      }
      if (field.minLength && value.length < field.minLength) {
        return false;
      }
      if (field.maxLength && value.length > field.maxLength) {
        return false;
      }
      return true;
    });
}
