export const QUOTE_JOB_STATES = [
  "created",
  "uploading",
  "uploaded",
  "validating",
  "analyzing",
  "slicing",
  "pricing",
  "priced",
  "needs_review",
  "failed",
  "expired",
  "cancelled",
] as const;

export type QuoteJobState = (typeof QUOTE_JOB_STATES)[number];

export const MANUFACTURING_FORMATS = ["stl", "obj", "3mf"] as const;
export type ManufacturingFormat = (typeof MANUFACTURING_FORMATS)[number];

export const MESH_UNITS = ["mm", "cm", "m", "custom"] as const;
export type MeshUnit = (typeof MESH_UNITS)[number];

export const SUPPORT_MODES = ["auto", "on", "off"] as const;
export type SupportMode = (typeof SUPPORT_MODES)[number];

export const QUALITY_IDS = ["ekonomik", "standart", "detayli"] as const;
export type QualityId = (typeof QUALITY_IDS)[number];

export const MATERIAL_IDS = ["pla"] as const;
export type MaterialId = (typeof MATERIAL_IDS)[number];

export type ManufacturingSourceKind = "upload" | "thingiverse";

export type LicenseCommercialUse =
  | "permitted"
  | "prohibited"
  | "unknown"
  | "missing";

export type LicenseVerdictCode =
  | "cc0"
  | "cc_by"
  | "cc_by_sa"
  | "cc_by_nc"
  | "cc_by_nd"
  | "public_domain"
  | "unknown"
  | "missing"
  | "requires_review";

export interface LicenseVerdict {
  code: LicenseVerdictCode;
  commercialUse: LicenseCommercialUse;
  attributionRequired: boolean;
  shareAlike: boolean;
  noDerivatives: boolean;
  publicDomain: boolean;
  automaticManufacturingAllowed: boolean;
  requiresManualReview: boolean;
  summaryTr: string;
  mappedFrom: string | null;
}

export interface Vec3Mm {
  x: number;
  y: number;
  z: number;
}

export interface MeshAnalysis {
  format: ManufacturingFormat;
  triangleCount: number;
  vertexCount: number;
  shellCount: number;
  boundingBoxMm: { min: Vec3Mm; max: Vec3Mm };
  dimensionsMm: Vec3Mm;
  volumeMm3: number | null;
  manifold: boolean | null;
  watertight: boolean | null;
  degenerateFaces: number;
  hasInvalidCoordinates: boolean;
  fitsBuildVolume: boolean;
  scalePercent: number;
  checksumSha256: string;
  unitAssumed: MeshUnit;
  flags: ReviewFlag[];
}

export type ReviewFlag =
  | "non_manifold"
  | "not_watertight"
  | "multiple_shells"
  | "thin_features"
  | "extremely_small"
  | "extremely_large"
  | "does_not_fit"
  | "high_triangle_count"
  | "support_heavy"
  | "excessive_duration"
  | "excessive_material"
  | "slicer_warning"
  | "slicer_failure"
  | "ambiguous_orientation"
  | "quantity_multi_plate"
  | "license_review"
  | "implausible_units";

export interface PrintConfiguration {
  printerProfileId: string;
  printerProfileVersion: number;
  materialId: MaterialId;
  colorId: string;
  qualityId: QualityId;
  infillPercent: number;
  supports: SupportMode;
  scalePercent: number;
  quantity: number;
  unit: MeshUnit;
  customScale: number | null;
  manufacturingTransform?: import("@/domain/manufacturing/transform").ManufacturingTransform;
}

export interface SlicingMetrics {
  dimensionsMm: Vec3Mm;
  filamentLengthMm: number;
  filamentWeightGrams: number;
  estimatedDurationSeconds: number;
  layerCount: number | null;
  /** True only when G-code contains actual support toolpath extrusion. */
  supportUsed: boolean;
  supportGenerated?: boolean;
  supportMaterialMm?: number;
  supportMaterialGrams?: number;
  supportLayerCount?: number;
  gcodeParserVersion?: string;
  materialId: MaterialId;
  qualityId: QualityId;
  quantity: number;
  orientation: { rotateX: number; rotateY: number; rotateZ: number };
  engine: { name: string; version: string };
  profileChecksum: string;
  warnings: string[];
}

export interface PublicPriceBreakdown {
  materialMinor: number;
  productionDurationSeconds: number;
  quantity: number;
  configurationSummary: string;
  netMinor: number;
  vatMinor: number;
  grossMinor: number;
  vatRate: number;
  shippingStatus: "not_included";
  quoteExpiresAt: string;
  reviewRequired: boolean;
  reviewMessage: string | null;
}

export interface InternalCostBreakdown {
  materialCostMinor: number;
  machineCostMinor: number;
  energyCostMinor: number;
  setupFeeMinor: number;
  postProcessingFeeMinor: number;
  packagingFeeMinor: number;
  supportFeeMinor: number;
  reviewFeeMinor: number;
  directCostMinor: number;
  riskAdjustedCostMinor: number;
  netSellingPriceMinor: number;
  vatMinor: number;
  grossPriceMinor: number;
  slicerFilamentWeightGrams?: number;
  slicerDurationSeconds?: number;
  slicerQuantity?: number;
  slicerSupportGenerated?: boolean;
  materialWasteMinor?: number;
  depreciationCostMinor?: number;
  maintenanceCostMinor?: number;
  shippingMinor?: number;
}

export interface PricingRates {
  materialPricePerGramMinor: number;
  machineHourlyRateMinor: number;
  electricityPricePerKwhMinor: number;
  machinePowerKw: number;
  setupFeeMinor: number;
  postProcessingFeeMinor: number;
  packagingFeeMinor: number;
  supportHandlingFeeMinor: number;
  modelReviewFeeMinor: number;
  riskRate: number;
  targetMarginRate: number;
  minimumOrderNetMinor: number;
  vatRate: number;
  quoteLifetimeHours: number;
  quantityAdjustments: Array<{ minQty: number; multiplier: number }>;
}

export type QuoteFormulaId = "bc-quote-v1" | "bc-quote-v2";

export type MaintenanceBasis = "hourly" | "annual";
export type PackagingBasis = "unit" | "shipment";

export interface PricingCalibrationInputs {
  presetName?: string;
  filamentSpoolPriceMinor: number;
  spoolWeightGrams: number;
  wastePercent: number;
  printerPurchasePriceMinor: number;
  depreciationHours: number;
  maintenanceBasis: MaintenanceBasis;
  maintenanceMinor: number;
  expectedAnnualPrintHours: number;
  electricityPricePerKwhMinor: number;
  printerPowerWatts: number;
  laborHourlyMinor: number;
  setupMinutesPerOrder: number;
  postProcessingMinutesPerUnit: number;
  supportRemovalMinutesPerJob: number;
  packagingMinor: number;
  packagingBasis: PackagingBasis;
  failedPrintPercent: number;
  targetMarginRate: number;
  minimumOrderNetMinor: number;
  vatRate: number;
  shippingDisplayMinor: number;
  shippingFreeThresholdMinor: number | null;
  quoteLifetimeHours: number;
}

export interface PricingConfig {
  id: string;
  version: number;
  checksum: string;
  rates: PricingRates;
  calibration: PricingCalibrationInputs | null;
  formulaId: QuoteFormulaId;
  isDevelopmentSeed: boolean;
  activatedAt: string | null;
  activatedBy: string | null;
  createdAt: string;
}

export interface PrinterProfile {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  model: string;
  technology: "FDM";
  buildVolumeMm: Vec3Mm;
  nozzleDiameterMm: number;
  filamentDiameterMm: number;
  slicerProfileFile: string;
  version: number;
  checksum: string;
  isActive: boolean;
  isDevelopmentSeed: boolean;
  notes: string;
}

export interface MaterialProfile {
  id: MaterialId;
  name: string;
  densityGPerCm3: number;
  slicerProfileFile: string;
  version: number;
  checksum: string;
  isActive: boolean;
}

export interface QualityProfile {
  id: QualityId;
  name: string;
  layerHeightMm: number;
  defaultInfillPercent: number;
  slicerProfileFile: string;
  version: number;
  checksum: string;
}

export interface ProvenanceSnapshot {
  source: ManufacturingSourceKind;
  thingId: string | null;
  fileId: string | null;
  thingTitle: string | null;
  creatorUsername: string | null;
  creatorUrl: string | null;
  sourceUrl: string | null;
  licenseName: string | null;
  licenseUrl: string | null;
  retrievedAt: string | null;
  permissionVerdict: LicenseVerdict | null;
  selectedFilename: string;
  fileChecksum: string;
  attributionText: string | null;
  rightsConfirmedAt: string | null;
}

export interface ManufacturingFileRecord {
  id: string;
  ownerUserId: string | null;
  sessionId: string;
  source: ManufacturingSourceKind;
  originalFilename: string;
  format: ManufacturingFormat;
  sizeBytes: number;
  checksumSha256: string;
  storageKey: string;
  mimeType: string;
  rightsConfirmedAt: string;
  provenance: ProvenanceSnapshot;
  createdAt: string;
}

export interface QuoteJobRecord {
  id: string;
  fileId: string;
  ownerUserId: string | null;
  sessionId: string;
  state: QuoteJobState;
  idempotencyKey: string;
  attemptCount: number;
  maxAttempts: number;
  lockedAt: string | null;
  lockedBy: string | null;
  configuration: PrintConfiguration;
  analysis: MeshAnalysis | null;
  metrics: SlicingMetrics | null;
  quoteId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  reviewFlags: ReviewFlag[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface QuoteStatusEvent {
  id: string;
  jobId: string;
  fromState: QuoteJobState | null;
  toState: QuoteJobState;
  at: string;
  detail: string | null;
}

export interface ManufacturingQuoteRecord {
  id: string;
  jobId: string;
  fileId: string;
  ownerUserId: string | null;
  sessionId: string;
  status: "priced" | "needs_review" | "expired" | "cancelled";
  configuration: PrintConfiguration;
  metrics: SlicingMetrics;
  publicBreakdown: PublicPriceBreakdown;
  internalBreakdown: InternalCostBreakdown;
  pricingVersion: number;
  pricingChecksum: string;
  slicerProfileChecksum: string;
  fileChecksum: string;
  provenance: ProvenanceSnapshot;
  signature: string;
  reviewRequired: boolean;
  reviewFlags: ReviewFlag[];
  expiresAt: string;
  createdAt: string;
}

export interface PermissionReviewRecord {
  id: string;
  source: "thingiverse";
  thingId: string;
  reviewerId: string;
  reviewedAt: string;
  snapshotChecksum: string;
  licenseName: string;
  verdict: LicenseVerdict;
  legalBasis: string;
  allowedCommercialUse: boolean;
}

export interface PricingActivationAuditEntry {
  id: string;
  at: string;
  activatedBy: string;
  previousVersion: number | null;
  previousChecksum: string | null;
  newVersion: number;
  newChecksum: string;
  formulaId: QuoteFormulaId;
  backupFile: string;
  verificationPassed: boolean;
  cubeGrossMinor: number;
}

export interface QuoteRevocationRecord {
  id: string;
  quoteId: string;
  reason: string;
  revokedBy: string;
  revokedAt: string;
}

export interface ManufacturingStoreSnapshot {
  files: ManufacturingFileRecord[];
  jobs: QuoteJobRecord[];
  quotes: ManufacturingQuoteRecord[];
  events: QuoteStatusEvent[];
  pricing: PricingConfig[];
  permissionReviews: PermissionReviewRecord[];
  integration: IntegrationStatusSnapshot;
  pricingAuditLog?: PricingActivationAuditEntry[];
  quoteRevocations?: QuoteRevocationRecord[];
}

export interface IntegrationStatusSnapshot {
  thingiverseLastSuccessAt: string | null;
  thingiverseLastFailureAt: string | null;
  thingiverseLastError: string | null;
  thingiverseRateLimitedUntil: string | null;
  workerLastSeenAt: string | null;
  workerVersion: string | null;
  prusaSlicerVersion: string | null;
}

export const ALLOWED_INFILL = [10, 15, 20, 30, 50, 100] as const;
export const MANUFACTURING_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const PREVIEW_TRIANGLE_LIMIT = 400_000;
export const SERVER_TRIANGLE_LIMIT = 2_000_000;
export const ZIP_MAX_ENTRIES = 512;
export const ZIP_MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
export const JOB_LOCK_MS = 12 * 60 * 1000;
export const JOB_MAX_ATTEMPTS = 3;
export const FORMULA_ID = "bc-quote-v1" as const;
export const CALIBRATED_FORMULA_ID = "bc-quote-v2" as const;
export const ORIENTATION_CANDIDATES = [
  { rotateX: 0, rotateY: 0, rotateZ: 0 },
  { rotateX: 90, rotateY: 0, rotateZ: 0 },
  { rotateX: 180, rotateY: 0, rotateZ: 0 },
  { rotateX: 270, rotateY: 0, rotateZ: 0 },
  { rotateX: 0, rotateY: 90, rotateZ: 0 },
  { rotateX: 0, rotateY: 270, rotateZ: 0 },
] as const;
