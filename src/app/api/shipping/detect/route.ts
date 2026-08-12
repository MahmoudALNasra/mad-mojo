import { NextResponse } from "next/server";
import { detectLocationFromRequest } from "@/lib/geo";
import { estimateFromPostalCode } from "@/lib/shipping";

/**
 * GET /api/shipping/detect
 *
 * Infers an approximate ZIP/postal code from IP / edge headers and returns a
 * delivery estimate. Does NOT use browser geolocation — no permission prompt.
 */
export async function GET(request: Request) {
  const location = await detectLocationFromRequest(request.headers);

  if (!location.postal) {
    return NextResponse.json({
      detected: false,
      location,
      estimate: null,
    });
  }

  const estimate = estimateFromPostalCode(location.postal);
  if (!estimate) {
    return NextResponse.json({
      detected: false,
      location,
      estimate: null,
    });
  }

  return NextResponse.json({
    detected: true,
    location: {
      postal: location.postal,
      city: location.city,
      region: location.region,
      country: location.country,
      source: location.source,
    },
    estimate,
  });
}
