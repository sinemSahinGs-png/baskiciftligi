import { assertMinorUnits } from "@/lib/money";
import {
  CALIBRATED_FORMULA_ID,
  FORMULA_ID,
  type InternalCostBreakdown,
  type PricingCalibrationInputs,
  type PricingRates,
  type PublicPriceBreakdown,
  type SlicingMetrics,
} from "@/domain/manufacturing/types";

export const CUBE_CALIBRATION_METRICS = {
  grams: 4.6,
  seconds: 1193,
  supportUsed: false,
  dimensionsMm: { x: 20, y: 20, z: 20 },
} as const;

export interface CalibrationFieldSpec {
  key: keyof PricingCalibrationInputs;
  label: string;
  help: string;
  group: "material" | "machine" | "labor" | "packaging" | "commercial";
}

export const CALIBRATION_FIELDS: CalibrationFieldSpec[] = [
  {
    key: "filamentSpoolPriceMinor",
    label: "Filament rulo fiyatı",
    help: "Bir rulo PLA’nın KDV hariç alış tutarı. Gram maliyeti = rulo fiyatı ÷ rulo ağırlığı. Kâr eklenmez.",
    group: "material",
  },
  {
    key: "spoolWeightGrams",
    label: "Rulo ağırlığı (gram)",
    help: "Rulonun net filament ağırlığı (çoğu rulo 1000 g). Makara ve kutu ağırlığını katmayın.",
    group: "material",
  },
  {
    key: "wastePercent",
    label: "Fire / atık yüzdesi",
    help: "Purge, brim, ilk katman ve küçük fire. Dilimlenen grama eklenir. Destek filamentı zaten dilim çıktısındadır; burası kâr değildir.",
    group: "material",
  },
  {
    key: "printerPurchasePriceMinor",
    label: "Yazıcı alış fiyatı",
    help: "Makinenin satın alma bedeli. Saatlik yıpranma = alış fiyatı ÷ beklenen ömür saati. İçinde kâr olmamalı.",
    group: "machine",
  },
  {
    key: "depreciationHours",
    label: "Beklenen yıpranma saati",
    help: "Yazıcının ekonomik ömrü (örneğin 5.000–10.000 baskı saati). Bu sayı küçüldükçe her işe daha çok yıpranma yazılır.",
    group: "machine",
  },
  {
    key: "maintenanceBasis",
    label: "Bakım birimi",
    help: "Bakımı saat başı mı yoksa yıllık mı girdiğinizi seçin. Yıllık tutar, beklenen yıllık baskı saatine bölünür.",
    group: "machine",
  },
  {
    key: "maintenanceMinor",
    label: "Bakım ödeneği",
    help: "Nozul, kayış, yağ ve küçük yedekler. Kâr değil; makineyi çalışır tutma maliyeti.",
    group: "machine",
  },
  {
    key: "expectedAnnualPrintHours",
    label: "Yıllık baskı saati",
    help: "Bakımı yıllık girdiyseniz gerekir. Saatlik bakıma çevirmek için yıllık tutar bu saate bölünür.",
    group: "machine",
  },
  {
    key: "electricityPricePerKwhMinor",
    label: "Elektrik (kWh)",
    help: "Faturadaki kilowatt-saat fiyatı. Enerji, yazıcı yıpranmasından ayrıdır; iki kez yazılmaz.",
    group: "machine",
  },
  {
    key: "printerPowerWatts",
    label: "Ortalama güç (watt)",
    help: "Baskı sırasındaki ortalama çekiş. Enerji = saat × (watt ÷ 1000) × kWh fiyatı.",
    group: "machine",
  },
  {
    key: "laborHourlyMinor",
    label: "Emek saati değeri",
    help: "Sizin bir saatinizin değeri. Dakikaya çevrilip yalnızca kurulum ve son işlem süreleriyle çarpılır. Makine saatine gömülmez.",
    group: "labor",
  },
  {
    key: "setupMinutesPerOrder",
    label: "Sipariş kurulum dakikası",
    help: "Dosya kontrolü, tabla ve iş hazırlığı. Sipariş başına bir kez; 5 veya 10 kopyada tekrar yazılmaz.",
    group: "labor",
  },
  {
    key: "postProcessingMinutesPerUnit",
    label: "Birim son işlem dakikası",
    help: "Her kopya için zımpara ve kontrol. Adetle çarpılır. Destek filamentı burada tekrar yazılmaz.",
    group: "labor",
  },
  {
    key: "supportRemovalMinutesPerJob",
    label: "Destek söküm dakikası / iş",
    help: "Yalnızca G-code gerçek destek takım yolu ürettiğinde (supportGenerated), iş başına bir kez uygulanır. Filament veya makine süresini tekrarlamaz. Profil bayrağı yeterli değildir.",
    group: "labor",
  },
  {
    key: "packagingMinor",
    label: "Paketleme maliyeti",
    help: "Kutu, dolgu ve etiket. Kurye bedeli değildir. Birim veya gönderi başına seçin.",
    group: "packaging",
  },
  {
    key: "packagingBasis",
    label: "Paketleme tahsisi",
    help: "Birim: her kopyaya yazılır. Gönderi: siparişte bir kez. Kargo her iki durumda da teklif dışındadır.",
    group: "packaging",
  },
  {
    key: "failedPrintPercent",
    label: "Başarısız baskı payı",
    help: "Fire için maliyet çarpanı: doğrudan maliyet ÷ (1 − pay). Makine saatine kâr gömmez; ayrı bir risk katmanıdır.",
    group: "commercial",
  },
  {
    key: "targetMarginRate",
    label: "Hedef net kâr oranı",
    help: "Maliyet ve fire çıktıktan SONRA uygulanır. Net = riskli maliyet ÷ (1 − marj). Makine saatine ikinci kez kâr yazılmaz.",
    group: "commercial",
  },
  {
    key: "minimumOrderNetMinor",
    label: "Asgari net sipariş",
    help: "Çok küçük işlerin KDV hariç tabanı. Maliyet bunun altındaysa net bu tutara çekilir.",
    group: "commercial",
  },
  {
    key: "vatRate",
    label: "KDV oranı",
    help: "Satış KDV’si netin üzerine eklenir. Maliyet kalemlerine karışmaz.",
    group: "commercial",
  },
  {
    key: "shippingDisplayMinor",
    label: "Kargo gösterim tutarı",
    help: "Sepette ayrı gösterilir. İmzalı ürün teklifine asla eklenmez (shippingStatus: not_included).",
    group: "packaging",
  },
  {
    key: "shippingFreeThresholdMinor",
    label: "Ücretsiz kargo eşiği",
    help: "İsteğe bağlı. Eşik yalnızca kargo politikasıdır; ürün net/brüt fiyatını değiştirmez.",
    group: "packaging",
  },
  {
    key: "quoteLifetimeHours",
    label: "Teklif süresi (saat)",
    help: "İmzalı teklifin geçerlilik penceresi. Fiyat kalemlerini değiştirmez.",
    group: "commercial",
  },
];

export interface CalibrationIssue {
  key: keyof PricingCalibrationInputs | "form";
  message: string;
}

export interface CalibratedStep {
  id: string;
  title: string;
  detail: string;
  minor: number;
  kind: "unit" | "fixed" | "order" | "tax" | "shipping";
}

export interface CalibratedQuote {
  formulaId: typeof CALIBRATED_FORMULA_ID;
  quantity: number;
  grams: number;
  seconds: number;
  printHours: number;
  billedGrams: number;
  materialPerGramMinor: number;
  depreciationPerHourMinor: number;
  maintenancePerHourMinor: number;
  energyPerHourMinor: number;
  laborPerHourMinor: number;
  materialRawMinor: number;
  materialWasteMinor: number;
  materialMinor: number;
  energyMinor: number;
  depreciationMinor: number;
  maintenanceMinor: number;
  machineMinor: number;
  setupLaborMinor: number;
  postLaborMinor: number;
  supportLaborMinor: number;
  packagingMinor: number;
  fixedOrderMinor: number;
  variableMinor: number;
  directMinor: number;
  riskAllowanceMinor: number;
  riskAdjustedMinor: number;
  unconstrainedNetMinor: number;
  minimumApplied: boolean;
  profitMinor: number;
  netMinor: number;
  vatMinor: number;
  grossMinor: number;
  shippingMinor: number;
  unitGrossMinor: number;
  steps: CalibratedStep[];
  publicBreakdown: PublicPriceBreakdown;
  internalBreakdown: InternalCostBreakdown;
}

function roundMinor(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("Parasal ara değer sayısal değil.");
  }
  return assertMinorUnits(Math.round(value));
}

export function calibrationIssues(
  input: Partial<PricingCalibrationInputs> | null | undefined,
): CalibrationIssue[] {
  const issues: CalibrationIssue[] = [];
  if (!input) {
    return [{ key: "form", message: "Sahip iş girdileri henüz girilmedi." }];
  }
  const requirePositive = (
    key: keyof PricingCalibrationInputs,
    value: number | undefined,
    label: string,
  ) => {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
      issues.push({ key, message: `${label} gerekli ve sıfırdan büyük olmalıdır.` });
    }
  };
  const requireNonNegative = (
    key: keyof PricingCalibrationInputs,
    value: number | undefined,
    label: string,
  ) => {
    if (value === undefined || !Number.isFinite(value) || value < 0) {
      issues.push({ key, message: `${label} gerekli ve negatif olamaz.` });
    }
  };

  requirePositive("filamentSpoolPriceMinor", input.filamentSpoolPriceMinor, "Rulo fiyatı");
  requirePositive("spoolWeightGrams", input.spoolWeightGrams, "Rulo ağırlığı");
  requireNonNegative("wastePercent", input.wastePercent, "Fire yüzdesi");
  if ((input.wastePercent ?? 0) >= 100) {
    issues.push({ key: "wastePercent", message: "Fire yüzdesi 100’den küçük olmalıdır." });
  }
  requirePositive("printerPurchasePriceMinor", input.printerPurchasePriceMinor, "Yazıcı fiyatı");
  requirePositive("depreciationHours", input.depreciationHours, "Yıpranma saati");
  requireNonNegative("maintenanceMinor", input.maintenanceMinor, "Bakım ödeneği");
  if (input.maintenanceBasis !== "hourly" && input.maintenanceBasis !== "annual") {
    issues.push({ key: "maintenanceBasis", message: "Bakım birimi saatlik veya yıllık olmalıdır." });
  }
  if (input.maintenanceBasis === "annual") {
    requirePositive(
      "expectedAnnualPrintHours",
      input.expectedAnnualPrintHours,
      "Yıllık baskı saati",
    );
  }
  requirePositive(
    "electricityPricePerKwhMinor",
    input.electricityPricePerKwhMinor,
    "Elektrik fiyatı",
  );
  requirePositive("printerPowerWatts", input.printerPowerWatts, "Yazıcı gücü");
  requirePositive("laborHourlyMinor", input.laborHourlyMinor, "Emek saati");
  requireNonNegative("setupMinutesPerOrder", input.setupMinutesPerOrder, "Kurulum dakikası");
  requireNonNegative(
    "postProcessingMinutesPerUnit",
    input.postProcessingMinutesPerUnit,
    "Son işlem dakikası",
  );
  requireNonNegative(
    "supportRemovalMinutesPerJob",
    input.supportRemovalMinutesPerJob,
    "Destek söküm dakikası",
  );
  requireNonNegative("packagingMinor", input.packagingMinor, "Paketleme");
  if (input.packagingBasis !== "unit" && input.packagingBasis !== "shipment") {
    issues.push({
      key: "packagingBasis",
      message: "Paketleme birim veya gönderi başına olmalıdır.",
    });
  }
  requireNonNegative("failedPrintPercent", input.failedPrintPercent, "Başarısız baskı payı");
  if ((input.failedPrintPercent ?? 0) >= 100) {
    issues.push({
      key: "failedPrintPercent",
      message: "Başarısız baskı payı 100’den küçük olmalıdır.",
    });
  }
  if (
    input.targetMarginRate === undefined ||
    !Number.isFinite(input.targetMarginRate) ||
    input.targetMarginRate < 0 ||
    input.targetMarginRate >= 1
  ) {
    issues.push({
      key: "targetMarginRate",
      message: "Kâr oranı 0 ile 1 arasında olmalıdır (örneğin %25 için 0,25).",
    });
  }
  requireNonNegative("minimumOrderNetMinor", input.minimumOrderNetMinor, "Asgari net");
  if (
    input.vatRate === undefined ||
    !Number.isFinite(input.vatRate) ||
    input.vatRate < 0 ||
    input.vatRate > 1
  ) {
    issues.push({ key: "vatRate", message: "KDV oranı 0 ile 1 arasında olmalıdır." });
  }
  requireNonNegative("shippingDisplayMinor", input.shippingDisplayMinor, "Kargo tutarı");
  if (
    input.shippingFreeThresholdMinor !== null &&
    input.shippingFreeThresholdMinor !== undefined &&
    (!Number.isFinite(input.shippingFreeThresholdMinor) ||
      input.shippingFreeThresholdMinor < 0)
  ) {
    issues.push({
      key: "shippingFreeThresholdMinor",
      message: "Ücretsiz kargo eşiği boş veya negatif olmayan bir tutar olmalıdır.",
    });
  }
  requirePositive("quoteLifetimeHours", input.quoteLifetimeHours, "Teklif süresi");
  return issues;
}

export function isCompleteCalibration(
  input: Partial<PricingCalibrationInputs> | null | undefined,
): input is PricingCalibrationInputs {
  return calibrationIssues(input).length === 0;
}

function maintenancePerHourMinor(input: PricingCalibrationInputs): number {
  if (input.maintenanceBasis === "hourly") {
    return input.maintenanceMinor;
  }
  return input.maintenanceMinor / input.expectedAnnualPrintHours;
}

export function derivedHourlyCosts(input: PricingCalibrationInputs) {
  return {
    materialPerGramMinor: input.filamentSpoolPriceMinor / input.spoolWeightGrams,
    depreciationPerHourMinor: input.printerPurchasePriceMinor / input.depreciationHours,
    maintenancePerHourMinor: maintenancePerHourMinor(input),
    energyPerHourMinor:
      (input.printerPowerWatts / 1000) * input.electricityPricePerKwhMinor,
    laborPerHourMinor: input.laborHourlyMinor,
  };
}

export function computeCalibratedQuote(input: {
  metrics: Pick<
    SlicingMetrics,
    "filamentWeightGrams" | "estimatedDurationSeconds" | "quantity" | "supportUsed" | "supportGenerated"
  >;
  calibration: PricingCalibrationInputs;
  reviewRequired?: boolean;
  expiresAt: string;
  configurationSummary: string;
}): CalibratedQuote {
  const issues = calibrationIssues(input.calibration);
  if (issues.length > 0) {
    throw new RangeError(issues[0]?.message ?? "Kalibrasyon eksik.");
  }
  const quantity = Math.max(1, input.metrics.quantity);
  const grams = input.metrics.filamentWeightGrams;
  const seconds = input.metrics.estimatedDurationSeconds;
  const printHours = seconds / 3600;
  const derived = derivedHourlyCosts(input.calibration);
  const waste = input.calibration.wastePercent / 100;
  const billedGrams = grams * (1 + waste) * quantity;
  const materialRawMinor = roundMinor(grams * derived.materialPerGramMinor * quantity);
  const materialMinor = roundMinor(billedGrams * derived.materialPerGramMinor);
  const materialWasteMinor = assertMinorUnits(materialMinor - materialRawMinor);
  const energyMinor = roundMinor(
    printHours * derived.energyPerHourMinor * quantity,
  );
  const depreciationMinor = roundMinor(
    printHours * derived.depreciationPerHourMinor * quantity,
  );
  const maintenanceMinor = roundMinor(
    printHours * derived.maintenancePerHourMinor * quantity,
  );
  const machineMinor = assertMinorUnits(depreciationMinor + maintenanceMinor);
  const setupLaborMinor = roundMinor(
    (input.calibration.laborHourlyMinor * input.calibration.setupMinutesPerOrder) / 60,
  );
  const postLaborMinor = roundMinor(
    (input.calibration.laborHourlyMinor *
      input.calibration.postProcessingMinutesPerUnit *
      quantity) /
      60,
  );
  const supportGenerated = Boolean(
    input.metrics.supportGenerated ?? input.metrics.supportUsed,
  );
  const supportLaborMinor =
    supportGenerated && input.calibration.supportRemovalMinutesPerJob > 0
      ? roundMinor(
          (input.calibration.laborHourlyMinor *
            input.calibration.supportRemovalMinutesPerJob) /
            60,
        )
      : 0;
  const packagingMinor = roundMinor(
    input.calibration.packagingBasis === "unit"
      ? input.calibration.packagingMinor * quantity
      : input.calibration.packagingMinor,
  );
  const fixedOrderMinor = assertMinorUnits(
    setupLaborMinor +
      supportLaborMinor +
      (input.calibration.packagingBasis === "shipment" ? packagingMinor : 0),
  );
  const variableMinor = assertMinorUnits(
    materialMinor +
      energyMinor +
      machineMinor +
      postLaborMinor +
      (input.calibration.packagingBasis === "unit" ? packagingMinor : 0),
  );
  const directMinor = assertMinorUnits(fixedOrderMinor + variableMinor);
  const failRate = input.calibration.failedPrintPercent / 100;
  const riskAdjustedMinor = roundMinor(directMinor / (1 - failRate));
  const riskAllowanceMinor = assertMinorUnits(riskAdjustedMinor - directMinor);
  const unconstrainedNetMinor = roundMinor(
    riskAdjustedMinor / (1 - input.calibration.targetMarginRate),
  );
  const minimumApplied = unconstrainedNetMinor < input.calibration.minimumOrderNetMinor;
  const netMinor = assertMinorUnits(
    Math.max(input.calibration.minimumOrderNetMinor, unconstrainedNetMinor),
  );
  const profitMinor = assertMinorUnits(netMinor - riskAdjustedMinor);
  const vatMinor = roundMinor(netMinor * input.calibration.vatRate);
  const grossMinor = assertMinorUnits(netMinor + vatMinor);
  const shippingMinor = input.calibration.shippingDisplayMinor;
  const unitGrossMinor = roundMinor(grossMinor / quantity);

  const steps: CalibratedStep[] = [
    {
      id: "material-raw",
      title: "Ham madde",
      detail: `${grams.toFixed(2)} g × ${quantity} adet × ${derived.materialPerGramMinor.toFixed(4)} kuruş/g. Rulo fiyatı ÷ rulo gramı.`,
      minor: materialRawMinor,
      kind: "unit",
    },
    {
      id: "material-waste",
      title: "Fire payı",
      detail: `Dilimlenen grama %${input.calibration.wastePercent} eklenir. Destek filamentı dilim çıktısındadır; ayrı kâr satırı değildir.`,
      minor: materialWasteMinor,
      kind: "unit",
    },
    {
      id: "energy",
      title: "Elektrik",
      detail: `${printHours.toFixed(4)} sa × ${quantity} × ${(input.calibration.printerPowerWatts / 1000).toFixed(3)} kW × enerji fiyatı. Makine yıpranmasına karışmaz.`,
      minor: energyMinor,
      kind: "unit",
    },
    {
      id: "depreciation",
      title: "Makine yıpranması",
      detail: `Yazıcı fiyatı ÷ ${input.calibration.depreciationHours} sa × baskı saati. Kâr içermez.`,
      minor: depreciationMinor,
      kind: "unit",
    },
    {
      id: "maintenance",
      title: "Bakım",
      detail:
        input.calibration.maintenanceBasis === "hourly"
          ? "Saatlik bakım × baskı saati × adet."
          : `Yıllık bakım ÷ ${input.calibration.expectedAnnualPrintHours} sa × baskı saati.`,
      minor: maintenanceMinor,
      kind: "unit",
    },
    {
      id: "setup",
      title: "Kurulum emeği (sabit)",
      detail: `${input.calibration.setupMinutesPerOrder} dk × emek saati ÷ 60. Sipariş başına bir kez.`,
      minor: setupLaborMinor,
      kind: "fixed",
    },
    {
      id: "post",
      title: "Son işlem emeği",
      detail: `${input.calibration.postProcessingMinutesPerUnit} dk/adet × ${quantity} × emek saati ÷ 60.`,
      minor: postLaborMinor,
      kind: "unit",
    },
    ...(supportLaborMinor > 0
      ? [
          {
            id: "support-removal",
            title: "Destek söküm emeği (sabit)",
            detail: `${input.calibration.supportRemovalMinutesPerJob} dk × emek saati ÷ 60. Yalnızca gerçek destek takım yolu (supportGenerated); filament/makine tekrarlanmaz.`,
            minor: supportLaborMinor,
            kind: "fixed" as const,
          },
        ]
      : []),
    {
      id: "packaging",
      title:
        input.calibration.packagingBasis === "shipment"
          ? "Paketleme (gönderi, sabit)"
          : "Paketleme (birim)",
      detail: "Kutu maliyeti. Kurye bedeli teklife eklenmez.",
      minor: packagingMinor,
      kind: input.calibration.packagingBasis === "shipment" ? "fixed" : "unit",
    },
    {
      id: "direct",
      title: "Doğrudan maliyet",
      detail: "Ham madde + fire + enerji + yıpranma + bakım + emek + paketleme. Ambiguous makine kârı yok.",
      minor: directMinor,
      kind: "order",
    },
    {
      id: "risk",
      title: "Başarısız baskı payı",
      detail: `Doğrudan maliyet ÷ (1 − %${input.calibration.failedPrintPercent}). Marjdan önce uygulanır.`,
      minor: riskAllowanceMinor,
      kind: "order",
    },
    {
      id: "margin",
      title: "Hedef kâr",
      detail: `Riskli maliyet ÷ (1 − %${Math.round(input.calibration.targetMarginRate * 100)}). Makine saatine ikinci kâr yazılmaz.${minimumApplied ? " Asgari net uygulandı." : ""}`,
      minor: profitMinor,
      kind: "order",
    },
    {
      id: "vat",
      title: "KDV",
      detail: `Net × %${Math.round(input.calibration.vatRate * 100)}.`,
      minor: vatMinor,
      kind: "tax",
    },
    {
      id: "shipping",
      title: "Kargo (teklif dışı)",
      detail: "İmzalı ürüne dahil değil. Yalnızca sepet gösterimi.",
      minor: shippingMinor,
      kind: "shipping",
    },
  ];

  const publicBreakdown: PublicPriceBreakdown = {
    materialMinor,
    productionDurationSeconds: Math.round(seconds * quantity),
    quantity,
    configurationSummary: input.configurationSummary,
    netMinor,
    vatMinor,
    grossMinor,
    vatRate: input.calibration.vatRate,
    shippingStatus: "not_included",
    quoteExpiresAt: input.expiresAt,
    reviewRequired: Boolean(input.reviewRequired),
    reviewMessage: input.reviewRequired
      ? "Otomatik analiz tamamlandı ancak üretim öncesi teknik onay gerekiyor."
      : null,
  };

  const internalBreakdown: InternalCostBreakdown = {
    materialCostMinor: materialMinor,
    machineCostMinor: machineMinor,
    energyCostMinor: energyMinor,
    setupFeeMinor: setupLaborMinor,
    postProcessingFeeMinor: postLaborMinor,
    packagingFeeMinor: packagingMinor,
    supportFeeMinor: supportLaborMinor,
    reviewFeeMinor: 0,
    directCostMinor: directMinor,
    riskAdjustedCostMinor: riskAdjustedMinor,
    netSellingPriceMinor: netMinor,
    vatMinor,
    grossPriceMinor: grossMinor,
  };

  return {
    formulaId: CALIBRATED_FORMULA_ID,
    quantity,
    grams,
    seconds,
    printHours,
    billedGrams,
    materialPerGramMinor: derived.materialPerGramMinor,
    depreciationPerHourMinor: derived.depreciationPerHourMinor,
    maintenancePerHourMinor: derived.maintenancePerHourMinor,
    energyPerHourMinor: derived.energyPerHourMinor,
    laborPerHourMinor: derived.laborPerHourMinor,
    materialRawMinor,
    materialWasteMinor,
    materialMinor,
    energyMinor,
    depreciationMinor,
    maintenanceMinor,
    machineMinor,
    setupLaborMinor,
    postLaborMinor,
    supportLaborMinor,
    packagingMinor,
    fixedOrderMinor,
    variableMinor,
    directMinor,
    riskAllowanceMinor,
    riskAdjustedMinor,
    unconstrainedNetMinor,
    minimumApplied,
    profitMinor,
    netMinor,
    vatMinor,
    grossMinor,
    shippingMinor,
    unitGrossMinor,
    steps,
    publicBreakdown,
    internalBreakdown,
  };
}

export function cubeCalibrationPreview(
  calibration: PricingCalibrationInputs,
  quantities: number[] = [1, 5, 10],
  options?: { supportUsed?: boolean },
) {
  const supportUsed = options?.supportUsed ?? false;
  return quantities.map((quantity) =>
    computeCalibratedQuote({
      metrics: {
        filamentWeightGrams: CUBE_CALIBRATION_METRICS.grams,
        estimatedDurationSeconds: CUBE_CALIBRATION_METRICS.seconds,
        quantity,
        supportUsed,
      },
      calibration,
      expiresAt: "2099-01-01T00:00:00.000Z",
      configurationSummary: "PLA · Standart · önizleme (etkin değil)",
    }),
  );
}

export function ratesSnapshotFromCalibration(
  calibration: PricingCalibrationInputs,
): PricingRates {
  const derived = derivedHourlyCosts(calibration);
  return {
    materialPricePerGramMinor: roundMinor(derived.materialPerGramMinor),
    machineHourlyRateMinor: roundMinor(
      derived.depreciationPerHourMinor + derived.maintenancePerHourMinor,
    ),
    electricityPricePerKwhMinor: calibration.electricityPricePerKwhMinor,
    machinePowerKw: calibration.printerPowerWatts / 1000,
    setupFeeMinor: roundMinor(
      (calibration.laborHourlyMinor * calibration.setupMinutesPerOrder) / 60,
    ),
    postProcessingFeeMinor: roundMinor(
      (calibration.laborHourlyMinor * calibration.postProcessingMinutesPerUnit) / 60,
    ),
    packagingFeeMinor: calibration.packagingMinor,
    supportHandlingFeeMinor: 0,
    modelReviewFeeMinor: 0,
    riskRate: calibration.failedPrintPercent / 100,
    targetMarginRate: calibration.targetMarginRate,
    minimumOrderNetMinor: calibration.minimumOrderNetMinor,
    vatRate: calibration.vatRate,
    quoteLifetimeHours: calibration.quoteLifetimeHours,
    quantityAdjustments: [],
  };
}

export const LEGACY_FORMULA_WARNING =
  `${FORMULA_ID} geliştirme tohumu ₺150/sa “makine” bedelinin ardından %8 risk ve %35 marj uygular. Bu yapı kârı çift sayabilir. Yeni kalibrasyon (${CALIBRATED_FORMULA_ID}) yıpranma, bakım, enerji, emeği ve marjı ayırır; sahip onayına kadar inactive kalır.`;
