import { NextResponse } from "next/server";
import {
  estimateFromPostalCode,
  type DeliveryEstimate,
} from "@/lib/shipping";

/**
 * GET /api/shipping/estimate?postal=90210
 *
 * With SHIPPO_API_KEY set, asks Shippo for live UPS rates (transit days) from
 * the studio to the destination. Otherwise falls back to the built-in zone
 * table so the estimator always answers.
 */

const ORIGIN_ADDRESS = {
  name: "Mad Mojo Studio",
  street1: process.env.SHIP_FROM_STREET ?? "Rynek 1",
  city: process.env.SHIP_FROM_CITY ?? "Krakow",
  zip: process.env.SHIP_FROM_ZIP ?? "31-042",
  country: process.env.SHIP_FROM_COUNTRY ?? "PL",
};

/** Default parcel: a 50×70 print in a shipping tube. */
const DEFAULT_PARCEL = {
  length: "60",
  width: "12",
  height: "12",
  distance_unit: "cm",
  weight: "1.2",
  mass_unit: "kg",
};

async function shippoEstimate(
  postal: string,
  zoneGuess: DeliveryEstimate
): Promise<DeliveryEstimate | null> {
  const key = process.env.SHIPPO_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_from: ORIGIN_ADDRESS,
        address_to: {
          zip: postal,
          country: zoneGuess.country === "EU" ? "PL" : zoneGuess.country,
        },
        parcels: [DEFAULT_PARCEL],
        async: false,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const shipment = await res.json();

    const rates: {
      provider?: string;
      estimated_days?: number;
      servicelevel?: { name?: string };
    }[] = shipment.rates ?? [];

    const upsRates = rates
      .filter((r) => r.provider?.toUpperCase().includes("UPS") && r.estimated_days)
      .sort((a, b) => (a.estimated_days ?? 99) - (b.estimated_days ?? 99));

    const best = upsRates[0] ?? rates.find((r) => r.estimated_days);
    if (!best?.estimated_days) return null;

    return {
      ...zoneGuess,
      minDays: best.estimated_days,
      maxDays: best.estimated_days + 2,
      carrier: best.servicelevel?.name
        ? `UPS ${best.servicelevel.name}`
        : zoneGuess.carrier,
      source: "shippo",
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postal = searchParams.get("postal")?.trim() ?? "";

  if (!postal || postal.length > 12) {
    return NextResponse.json({ error: "Invalid postal code" }, { status: 400 });
  }

  const zoneEstimate = estimateFromPostalCode(postal);
  if (!zoneEstimate) {
    return NextResponse.json(
      { error: "Unrecognized postal code" },
      { status: 422 }
    );
  }

  const live = await shippoEstimate(postal, zoneEstimate);

  return NextResponse.json({ estimate: live ?? zoneEstimate });
}
