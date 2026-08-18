export type ThingiverseIntegrationStatus =
  | "not_configured"
  | "credentials_missing"
  | "authorization_required"
  | "connected"
  | "api_limited"
  | "api_unavailable"
  | "authentication_expired";

export const thingiverseStatusCopy: Record<
  ThingiverseIntegrationStatus,
  { title: string; body: string }
> = {
  not_configured: {
    title: "Thingiverse bağlantısı henüz yapılandırılmadı",
    body: "Resmî API kimlik bilgileri yok. Sonuç üretilmez, tarama yapılmaz ve sahte model listelenmez.",
  },
  credentials_missing: {
    title: "Kimlik bilgileri eksik",
    body: "THINGIVERSE_CLIENT_ID, THINGIVERSE_CLIENT_SECRET veya THINGIVERSE_ACCESS_TOKEN tamamlanmadan istek atılmaz.",
  },
  authorization_required: {
    title: "Yetkilendirme gerekli",
    body: "Uygulama kimliği var; resmî OAuth veya uygulama jetonu olmadan Thingiverse çağrılmaz.",
  },
  connected: {
    title: "Bağlı",
    body: "Resmî Thingiverse API yanıt veriyor. Lisans rozeti ticari izin değildir.",
  },
  api_limited: {
    title: "API sınırına ulaşıldı",
    body: "Thingiverse hız sınırını bildirdi. Kısa süre sonra yeniden deneyin.",
  },
  api_unavailable: {
    title: "API kullanılamıyor",
    body: "Resmî uç nokta yanıt vermedi. Keşif durur; sahte katalog gösterilmez.",
  },
  authentication_expired: {
    title: "Kimlik doğrulama süresi doldu",
    body: "Jeton reddedildi. Yeni bir resmî uygulama jetonu veya OAuth izni gerekir.",
  },
};

export function identifyThingiverseUrl(url: string) {
  const match = url.match(/thingiverse\.com\/thing:(\d+)/i);
  return match?.[1] ? { externalId: match[1] } : null;
}

export function resolveThingiverseConfigStatus(input: {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
}): ThingiverseIntegrationStatus {
  const hasId = Boolean(input.clientId);
  const hasSecret = Boolean(input.clientSecret);
  const hasToken = Boolean(input.accessToken);

  if (!hasId && !hasSecret && !hasToken) {
    return "not_configured";
  }
  if (hasToken) {
    return "connected";
  }
  if (hasId && hasSecret) {
    return "authorization_required";
  }
  return "credentials_missing";
}
