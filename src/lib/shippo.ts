import "server-only";

/**
 * Shippo helper for creating shipments & buying UPS labels from the admin
 * panel later. Docs: https://docs.goshippo.com/
 *
 * Setup:
 * 1. Create a free account at goshippo.com
 * 2. Connect your UPS account under Settings → Carriers (or use Shippo's
 *    built-in UPS master account — no UPS account needed to start).
 * 3. Put your API token in SHIPPO_API_KEY.
 */

const BASE = "https://api.goshippo.com";

export function shippoConfigured(): boolean {
  return Boolean(process.env.SHIPPO_API_KEY);
}

async function shippoFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shippo ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export interface ShippoAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShippoParcel {
  length: string;
  width: string;
  height: string;
  distance_unit: "cm" | "in";
  weight: string;
  mass_unit: "kg" | "lb";
}

/** Creates a shipment and returns available rates (UPS included). */
export async function getRates(
  addressTo: ShippoAddress,
  parcels: ShippoParcel[],
  addressFrom?: ShippoAddress
) {
  const from: ShippoAddress = addressFrom ?? {
    name: "Mad Mojo Studio",
    street1: process.env.SHIP_FROM_STREET ?? "Rynek 1",
    city: process.env.SHIP_FROM_CITY ?? "Krakow",
    zip: process.env.SHIP_FROM_ZIP ?? "31-042",
    country: process.env.SHIP_FROM_COUNTRY ?? "PL",
  };

  return shippoFetch("/shipments/", {
    method: "POST",
    body: JSON.stringify({
      address_from: from,
      address_to: addressTo,
      parcels,
      async: false,
    }),
  });
}

/** Buys a label for a given rate id. */
export async function buyLabel(rateId: string) {
  return shippoFetch("/transactions/", {
    method: "POST",
    body: JSON.stringify({
      rate: rateId,
      label_file_type: "PDF",
      async: false,
    }),
  });
}
