import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type {
  CreateConsultationInput,
  ModelConsultationRequest,
  UpdateConsultationInput,
} from "@/domain/consultation/types";
import {
  localCreateConsultation,
  localGetConsultation,
  localListConsultations,
  localUpdateConsultation,
  mapConsultationRow,
} from "@/domain/consultation/local-store";

function shouldUseLocalStore() {
  return !isSupabaseConfigured || process.env.BC_FORCE_LOCAL_PERSISTENCE === "true";
}

export async function createConsultationRequest(
  input: CreateConsultationInput,
): Promise<ModelConsultationRequest> {
  if (shouldUseLocalStore()) {
    return localCreateConsultation(input);
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return localCreateConsultation(input);
  }
  const { data, error } = await client
    .from("model_consultation_requests")
    .insert({
      source: input.source,
      external_id: input.externalId,
      model_title: input.modelTitle,
      creator_name: input.creatorName ?? null,
      source_url: input.sourceUrl,
      license_label: input.licenseLabel ?? null,
      license_code: input.licenseCode ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail ?? null,
      material: input.material,
      color: input.color,
      size_label: input.sizeLabel,
      quantity: input.quantity,
      customer_note: input.customerNote ?? null,
      estimated_gross_minor: input.estimatedGrossMinor ?? null,
      production_options: input.productionOptions ?? {},
      status: "pending_license_review",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error("Danışma talebi kaydedilemedi.");
  }
  return mapConsultationRow(data as Record<string, unknown>);
}

export async function listConsultationRequests(): Promise<ModelConsultationRequest[]> {
  if (shouldUseLocalStore()) {
    return localListConsultations();
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return localListConsultations();
  }
  const { data, error } = await client
    .from("model_consultation_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error("Danışma talepleri alınamadı.");
  }
  return (data ?? []).map((row) => mapConsultationRow(row as Record<string, unknown>));
}

export async function getConsultationRequest(
  id: string,
): Promise<ModelConsultationRequest | null> {
  if (shouldUseLocalStore()) {
    return localGetConsultation(id);
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return localGetConsultation(id);
  }
  const { data, error } = await client
    .from("model_consultation_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error("Danışma talebi alınamadı.");
  }
  return data ? mapConsultationRow(data as Record<string, unknown>) : null;
}

export async function updateConsultationRequest(
  id: string,
  input: UpdateConsultationInput,
): Promise<ModelConsultationRequest | null> {
  if (shouldUseLocalStore()) {
    return localUpdateConsultation(id, input);
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return localUpdateConsultation(id, input);
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.status) patch.status = input.status;
  if (input.adminNote !== undefined) patch.admin_note = input.adminNote;
  if (input.finalQuoteGrossMinor !== undefined) {
    patch.final_quote_gross_minor = input.finalQuoteGrossMinor;
  }
  const { data, error } = await client
    .from("model_consultation_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    throw new Error("Danışma talebi güncellenemedi.");
  }
  return data ? mapConsultationRow(data as Record<string, unknown>) : null;
}
