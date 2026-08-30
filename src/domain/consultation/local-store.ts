import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ConsultationStatus,
  CreateConsultationInput,
  ModelConsultationRequest,
  UpdateConsultationInput,
} from "@/domain/consultation/types";
import {
  resolveLicenseEvaluationFromCode,
  type LicenseEvaluationCode,
} from "@/domain/consultation/license-evaluation";

const storePath = path.join(process.cwd(), ".octo-data", "consultation-requests.json");

async function readStore(): Promise<ModelConsultationRequest[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as ModelConsultationRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(rows: ModelConsultationRequest[]) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(rows, null, 2), "utf8");
}

function resolveStoredLicenseEvaluation(row: Record<string, unknown>): LicenseEvaluationCode {
  const stored = row.license_evaluation ?? row.licenseEvaluation;
  if (
    typeof stored === "string" &&
    ["auto_suitable", "suitable_unmodified", "permission_required", "manual_review"].includes(
      stored,
    )
  ) {
    return stored as LicenseEvaluationCode;
  }
  return resolveLicenseEvaluationFromCode(
    (row.license_code ?? row.licenseCode) as string | null,
    (row.license_label ?? row.licenseLabel) as string | null,
  ).code;
}

function mapRow(row: Record<string, unknown>): ModelConsultationRequest {
  return {
    id: String(row.id),
    source: String(row.source),
    externalId: String(row.external_id ?? row.externalId),
    modelTitle: String(row.model_title ?? row.modelTitle),
    creatorName: (row.creator_name ?? row.creatorName) as string | null,
    sourceUrl: String(row.source_url ?? row.sourceUrl),
    licenseLabel: (row.license_label ?? row.licenseLabel) as string | null,
    licenseCode: (row.license_code ?? row.licenseCode) as string | null,
    licenseEvaluation: resolveStoredLicenseEvaluation(row),
    thumbnailUrl: (row.thumbnail_url ?? row.thumbnailUrl) as string | null,
    customerName: String(row.customer_name ?? row.customerName),
    customerPhone: String(row.customer_phone ?? row.customerPhone),
    customerEmail: (row.customer_email ?? row.customerEmail) as string | null,
    material: String(row.material),
    color: String(row.color),
    sizeLabel: String(row.size_label ?? row.sizeLabel),
    quantity: Number(row.quantity),
    customerNote: (row.customer_note ?? row.customerNote) as string | null,
    estimatedGrossMinor:
      row.estimated_gross_minor != null
        ? Number(row.estimated_gross_minor)
        : row.estimatedGrossMinor != null
          ? Number(row.estimatedGrossMinor)
          : null,
    productionOptions:
      (row.production_options as Record<string, unknown>) ??
      (row.productionOptions as Record<string, unknown>) ??
      {},
    status: String(row.status) as ConsultationStatus,
    adminNote: (row.admin_note ?? row.adminNote) as string | null,
    finalQuoteGrossMinor:
      row.final_quote_gross_minor != null
        ? Number(row.final_quote_gross_minor)
        : row.finalQuoteGrossMinor != null
          ? Number(row.finalQuoteGrossMinor)
          : null,
    createdAt: String(row.created_at ?? row.createdAt),
    updatedAt: String(row.updated_at ?? row.updatedAt),
  };
}

export async function localCreateConsultation(
  input: CreateConsultationInput,
): Promise<ModelConsultationRequest> {
  const rows = await readStore();
  const now = new Date().toISOString();
  const evaluation =
    input.licenseEvaluation ??
    resolveLicenseEvaluationFromCode(input.licenseCode, input.licenseLabel).code;
  const record: ModelConsultationRequest = {
    id: crypto.randomUUID(),
    source: input.source,
    externalId: input.externalId,
    modelTitle: input.modelTitle,
    creatorName: input.creatorName ?? null,
    sourceUrl: input.sourceUrl,
    licenseLabel: input.licenseLabel ?? null,
    licenseCode: input.licenseCode ?? null,
    licenseEvaluation: evaluation,
    thumbnailUrl: input.thumbnailUrl ?? null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail ?? null,
    material: input.material,
    color: input.color,
    sizeLabel: input.sizeLabel,
    quantity: input.quantity,
    customerNote: input.customerNote ?? null,
    estimatedGrossMinor: input.estimatedGrossMinor ?? null,
    productionOptions: input.productionOptions ?? {},
    status: "pending_license_review",
    adminNote: null,
    finalQuoteGrossMinor: null,
    createdAt: now,
    updatedAt: now,
  };
  rows.unshift(record);
  await writeStore(rows);
  return record;
}

export async function localListConsultations(): Promise<ModelConsultationRequest[]> {
  const rows = await readStore();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function localGetConsultation(
  id: string,
): Promise<ModelConsultationRequest | null> {
  const rows = await readStore();
  return rows.find((row) => row.id === id) ?? null;
}

export async function localUpdateConsultation(
  id: string,
  input: UpdateConsultationInput,
): Promise<ModelConsultationRequest | null> {
  const rows = await readStore();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return null;
  const current = rows[index]!;
  const next: ModelConsultationRequest = {
    ...current,
    status: input.status ?? current.status,
    adminNote: input.adminNote !== undefined ? input.adminNote : current.adminNote,
    finalQuoteGrossMinor:
      input.finalQuoteGrossMinor !== undefined
        ? input.finalQuoteGrossMinor
        : current.finalQuoteGrossMinor,
    updatedAt: new Date().toISOString(),
  };
  rows[index] = next;
  await writeStore(rows);
  return next;
}

export { mapRow as mapConsultationRow };
