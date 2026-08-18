const ALLOWED_HOSTS = new Set([
  "api.thingiverse.com",
  "cdn.thingiverse.com",
  "www.thingiverse.com",
  "thingiverse-production-new.s3.amazonaws.com",
]);

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

export function assertSafeThingiverseUrl(raw: string, allowHttp = false): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SsrfError("İndirme adresi geçersiz.");
  }
  if (url.protocol !== "https:" && !(allowHttp && url.protocol === "http:")) {
    throw new SsrfError("İndirme yalnızca HTTPS üzerinden yapılır.");
  }
  if (url.username || url.password) {
    throw new SsrfError("Kimlik bilgisi içeren URL reddedildi.");
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "127.0.0.1" || host === "::1") {
    throw new SsrfError("İç ağ adresi reddedildi.");
  }
  if (!ALLOWED_HOSTS.has(host) && !host.endsWith(".thingiverse.com")) {
    throw new SsrfError("Onaysız indirme sunucusu.");
  }
  return url;
}

export function isRedirectHostAllowed(location: string) {
  try {
    assertSafeThingiverseUrl(location);
    return true;
  } catch {
    return false;
  }
}
