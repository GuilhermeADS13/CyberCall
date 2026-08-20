import type { IncomingMessage } from "http";

// The session cookie uses SameSite=None so the app keeps working inside preview
// iframes. That means the browser attaches it to cross-site requests too, so
// every state-changing HTTP request and every WebSocket upgrade must prove it
// came from an origin we trust.

function normalizeHost(value: string | undefined | null) {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/\.$/, "") || null;
}

function hostOfOrigin(origin: string) {
  try {
    return normalizeHost(new URL(origin).host);
  } catch {
    return null;
  }
}

export function getConfiguredOrigins(
  rawList = process.env.ALLOWED_ORIGINS ?? ""
) {
  return rawList
    .split(",")
    .map(entry => hostOfOrigin(entry.trim()) ?? normalizeHost(entry))
    .filter((entry): entry is string => Boolean(entry));
}

export function isTrustedOrigin(
  origin: string | undefined | null,
  host: string | undefined | null,
  allowedHosts = getConfiguredOrigins()
) {
  // Non-browser clients (tests, server-to-server, CLI) send no Origin at all.
  // Browsers always send one on cross-site requests, which is what we guard.
  if (!origin) return true;
  const originHost = hostOfOrigin(origin);
  if (!originHost) return false;
  if (originHost === normalizeHost(host)) return true;
  return allowedHosts.includes(originHost);
}

export function isTrustedRequest(
  request: Pick<IncomingMessage, "headers">,
  allowedHosts = getConfiguredOrigins()
) {
  const headers = request.headers;
  const origin = Array.isArray(headers.origin)
    ? headers.origin[0]
    : headers.origin;
  const host = Array.isArray(headers.host) ? headers.host[0] : headers.host;
  if (origin) return isTrustedOrigin(origin, host, allowedHosts);

  // Some browsers omit Origin on same-site navigations but still send Referer.
  const referer = Array.isArray(headers.referer)
    ? headers.referer[0]
    : headers.referer;
  if (referer) return isTrustedOrigin(referer, host, allowedHosts);
  return true;
}
