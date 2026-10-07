export function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "127.0.0.1";
  return ip.slice(0, 39);
}

export function requestIdFrom(request: Request): string {
  return (
    request.headers.get("x-request-id") ||
    request.headers.get("cf-ray") ||
    `ws-${Date.now().toString(36)}`
  );
}
