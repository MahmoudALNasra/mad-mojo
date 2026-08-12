/**
 * Approximate visitor location from IP / edge headers.
 * Never uses the browser Geolocation API (no permission popups).
 */

export type DetectedLocation = {
  postal: string;
  city?: string;
  region?: string;
  country?: string;
  source: "vercel" | "cloudflare" | "ipapi" | "none";
};

function header(headers: Headers, name: string): string | undefined {
  return headers.get(name)?.trim() || undefined;
}

/** Client IP from common proxy headers (never trust for auth — fine for ETA). */
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = header(headers, "x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first && first !== "127.0.0.1" && first !== "::1") return first;
  }
  const realIp = header(headers, "x-real-ip");
  if (realIp && realIp !== "127.0.0.1" && realIp !== "::1") return realIp;
  return null;
}

/**
 * Prefer platform geo headers (Vercel / Cloudflare), then a lightweight
 * IP→postal lookup. All of this is server-side — no browser permission UI.
 */
export async function detectLocationFromRequest(
  headers: Headers
): Promise<DetectedLocation> {
  const vercelPostal = header(headers, "x-vercel-ip-postal-code");
  const vercelCountry = header(headers, "x-vercel-ip-country");
  const vercelCity = header(headers, "x-vercel-ip-city");
  if (vercelPostal) {
    return {
      postal: vercelPostal,
      city: vercelCity ? decodeURIComponent(vercelCity) : undefined,
      country: vercelCountry,
      source: "vercel",
    };
  }

  // Cloudflare may expose country/city; postal is uncommon.
  const cfCountry = header(headers, "cf-ipcountry");
  const cfCity = header(headers, "cf-ipcity");

  const ip = clientIpFromHeaders(headers);
  if (ip) {
    const fromIp = await lookupIpApi(ip);
    if (fromIp) return fromIp;
  }

  // Last resort: ask ipapi with no IP (uses the outbound request IP — useful
  // when the edge didn't forward a client IP, e.g. some local proxies).
  if (!ip) {
    const fallback = await lookupIpApi();
    if (fallback) return fallback;
  }

  if (cfCountry && cfCountry !== "XX") {
    return {
      postal: "",
      city: cfCity,
      country: cfCountry,
      source: "cloudflare",
    };
  }

  return { postal: "", source: "none" };
}

async function lookupIpApi(ip?: string): Promise<DetectedLocation | null> {
  try {
    const url = ip
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : "https://ipapi.co/json/";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
      // Cache per-IP briefly to avoid hammering the free endpoint.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      error?: boolean;
      postal?: string | null;
      city?: string | null;
      region?: string | null;
      country_code?: string | null;
    };
    if (data.error || !data.postal) return null;
    return {
      postal: String(data.postal).trim(),
      city: data.city ?? undefined,
      region: data.region ?? undefined,
      country: data.country_code ?? undefined,
      source: "ipapi",
    };
  } catch {
    return null;
  }
}
