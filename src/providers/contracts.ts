import type { CurrencyCode } from "@/domain/catalog/types";

export interface ProviderContext {
  correlationId: string;
  requestedBy?: string;
}

export interface MoneyAmount {
  amountMinor: number;
  currency: CurrencyCode;
}

export interface PaymentIntentInput {
  orderId: string;
  orderNumber: string;
  amount: MoneyAmount;
  customerIp: string;
  returnUrl: string;
  failureUrl: string;
  idempotencyKey: string;
}

export interface PaymentIntentResult {
  providerReference: string;
  redirectUrl?: string;
  embeddedToken?: string;
  expiresAt?: string;
}

export interface VerifiedPaymentCallback {
  providerReference: string;
  orderNumber: string;
  status: "paid" | "failed";
  eventId: string;
  rawPayloadHash: string;
}

export interface PaymentProvider {
  readonly name: string;
  createIntent(
    input: PaymentIntentInput,
    context: ProviderContext,
  ): Promise<PaymentIntentResult>;
  verifyCallback(
    request: Request,
    context: ProviderContext,
  ): Promise<VerifiedPaymentCallback>;
  refund(
    providerReference: string,
    amount: MoneyAmount,
    idempotencyKey: string,
    context: ProviderContext,
  ): Promise<{ refundReference: string }>;
}

export interface ShippingQuoteInput {
  destinationCity: string;
  destinationDistrict?: string;
  totalWeightGrams: number;
  packageCount: number;
  basketTotal: MoneyAmount;
}

export interface ShippingProvider {
  readonly name: string;
  quote(
    input: ShippingQuoteInput,
    context: ProviderContext,
  ): Promise<{
    serviceCode: string;
    label: string;
    price: MoneyAmount;
    estimatedBusinessDays: { min: number; max: number };
  }[]>;
  createShipment(
    orderId: string,
    serviceCode: string,
    context: ProviderContext,
  ): Promise<{ trackingNumber: string; trackingUrl?: string }>;
}

export interface NotificationMessage {
  template:
    | "order-confirmed"
    | "order-status-changed"
    | "quote-ready"
    | "password-reset";
  recipient: string;
  locale: "tr";
  variables: Record<string, string | number>;
  idempotencyKey: string;
}

export interface NotificationProvider {
  readonly name: string;
  send(
    message: NotificationMessage,
    context: ProviderContext,
  ): Promise<{ messageId: string }>;
}

export interface SlicerJobInput {
  analysisId: string;
  signedDownloadUrl: string;
  fileName: string;
  technology: "FDM" | "SLA";
  printerProfileId: string;
  printProfileId: string;
  callbackUrl: string;
}

export interface SlicerAnalysisResult {
  dimensionsMm: { x: number; y: number; z: number };
  estimatedMaterialAmount: number;
  materialUnit: "gram" | "milliliter";
  estimatedDurationSeconds: number;
  layerCount?: number;
  supportRatio?: number;
  confidence: "high" | "medium" | "low";
  warnings: string[];
  engine: { name: string; version: string };
  resultSignature: string;
}

export interface SlicerProvider {
  readonly name: string;
  enqueue(
    input: SlicerJobInput,
    context: ProviderContext,
  ): Promise<{ jobId: string }>;
  getResult(
    jobId: string,
    context: ProviderContext,
  ): Promise<SlicerAnalysisResult | null>;
}

export interface ModelConverterProvider {
  readonly name: string;
  convertToMesh(
    input: {
      analysisId: string;
      signedDownloadUrl: string;
      sourceFormat: "step" | "stp";
    },
    context: ProviderContext,
  ): Promise<{ privateObjectPath: string; warnings: string[] }>;
}

export type ExternalModelPermissionStatus =
  | "discovery_only"
  | "license_review"
  | "permission_requested"
  | "permission_verified"
  | "rejected"
  | "revoked"
  | "unavailable";

export interface ExternalModelSummary {
  source: string;
  externalId: string;
  title: string;
  creatorName: string;
  creatorUsername?: string;
  creatorUrl?: string;
  sourceUrl: string;
  thumbnailUrl?: string;
  licenseLabel?: string;
  licenseUrl?: string;
  licenseCode?: string;
  categoryLabel?: string;
  attributionText: string;
  attributionRequired?: boolean;
  permissionStatus: ExternalModelPermissionStatus;
  isPurchasable: boolean;
  /** Discovery may show the card; price modal only when true. */
  pricingAllowed?: boolean;
  automaticManufacturingAllowed?: boolean;
  description?: string;
  likeCount?: number;
  collectCount?: number;
  fileCount?: number;
  imageUrls?: string[];
}

export interface ExternalModelBrowseResult {
  items: ExternalModelSummary[];
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface ExternalModelProvider {
  readonly source: string;
  search(
    query: string,
    context: ProviderContext,
  ): Promise<ExternalModelSummary[]>;
  getById(
    externalId: string,
    context: ProviderContext,
  ): Promise<ExternalModelSummary | null>;
  identifyUrl(url: string): { externalId: string } | null;
}

export interface BrowsableExternalModelProvider extends ExternalModelProvider {
  browse(
    input: { page: number; query?: string },
    context: ProviderContext,
  ): Promise<ExternalModelBrowseResult>;
}
