/**
 * Delivery estimation.
 *
 * When SHIPPO_API_KEY is set, /api/shipping/estimate asks Shippo for live UPS
 * rates and transit times. Without a key we fall back to this zone table so
 * the estimator works from day one.
 *
 * Origin: the Mad Mojo studio in Poland (UPS Worldwide Saver / Expedited).
 */

export interface DeliveryEstimate {
  country: "US" | "CA" | "MX" | "EU";
  countryLabel: string;
  region: string;
  city?: string;
  minDays: number;
  maxDays: number;
  carrier: string;
  source: "shippo" | "zones";
}

/** First-digit ZIP zone → US region + UPS international transit from Poland. */
const US_ZONES: Record<
  string,
  { region: string; states: string; min: number; max: number }
> = {
  "0": { region: "New England", states: "CT, MA, ME, NH, NJ, RI, VT", min: 3, max: 5 },
  "1": { region: "Northeast", states: "DE, NY, PA", min: 3, max: 5 },
  "2": { region: "Mid-Atlantic & South", states: "DC, MD, NC, SC, VA, WV", min: 3, max: 6 },
  "3": { region: "Southeast", states: "AL, FL, GA, MS, TN", min: 4, max: 6 },
  "4": { region: "Midwest", states: "IN, KY, MI, OH", min: 4, max: 6 },
  "5": { region: "Upper Midwest", states: "IA, MN, MT, ND, SD, WI", min: 4, max: 7 },
  "6": { region: "Central US", states: "IL, KS, MO, NE", min: 4, max: 6 },
  "7": { region: "South Central", states: "AR, LA, OK, TX", min: 4, max: 7 },
  "8": { region: "Mountain West", states: "AZ, CO, ID, NM, NV, UT, WY", min: 4, max: 7 },
  "9": { region: "West Coast", states: "AK, CA, HI, OR, WA", min: 4, max: 7 },
};

const CA_PROVINCES: Record<string, string> = {
  A: "Newfoundland and Labrador",
  B: "Nova Scotia",
  C: "Prince Edward Island",
  E: "New Brunswick",
  G: "Québec",
  H: "Montréal, Québec",
  J: "Québec",
  K: "Eastern Ontario",
  L: "Central Ontario",
  M: "Toronto, Ontario",
  N: "Southwestern Ontario",
  P: "Northern Ontario",
  R: "Manitoba",
  S: "Saskatchewan",
  T: "Alberta",
  V: "British Columbia",
  X: "Northern Canada",
  Y: "Yukon",
};

export function estimateFromPostalCode(raw: string): DeliveryEstimate | null {
  const code = raw.trim().toUpperCase();

  // US ZIP: 5 digits (optionally ZIP+4)
  const usMatch = code.match(/^(\d{5})(-\d{4})?$/);
  if (usMatch) {
    const zone = US_ZONES[usMatch[1][0]];
    if (!zone) return null;
    return {
      country: "US",
      countryLabel: "United States",
      region: `${zone.region} (${zone.states})`,
      minDays: zone.min,
      maxDays: zone.max,
      carrier: "UPS Worldwide Expedited",
      source: "zones",
    };
  }

  // Canadian postal code: A1A 1A1
  const caMatch = code.match(/^([A-Z])\d[A-Z]\s?\d[A-Z]\d$/);
  if (caMatch) {
    const province = CA_PROVINCES[caMatch[1]];
    if (!province) return null;
    return {
      country: "CA",
      countryLabel: "Canada",
      region: province,
      minDays: 4,
      maxDays: 8,
      carrier: "UPS Worldwide Expedited",
      source: "zones",
    };
  }

  // Mexican postal code: 5 digits — indistinguishable from US by format alone,
  // so we accept "MX 12345" or trailing "MX" markers, plus plain "CP 12345".
  const mxMatch = code.match(/^(?:MX\s?|CP\s?)(\d{5})$/);
  if (mxMatch) {
    return {
      country: "MX",
      countryLabel: "Mexico",
      region: "Mexico",
      minDays: 5,
      maxDays: 9,
      carrier: "UPS Worldwide Expedited",
      source: "zones",
    };
  }

  // Rough EU formats (e.g. "00-950", "28013", "75001" are ambiguous — treat
  // digit groups of 4-5 with country hints or dash formats as EU).
  const euMatch = code.match(/^\d{2}-\d{3}$/) || code.match(/^[A-Z]{1,2}\d{4,5}$/);
  if (euMatch) {
    return {
      country: "EU",
      countryLabel: "Europe",
      region: "Europe",
      minDays: 2,
      maxDays: 5,
      carrier: "UPS Standard",
      source: "zones",
    };
  }

  return null;
}

export function businessDaysFromNow(days: number): Date {
  const date = new Date();
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return date;
}

export function formatEtaDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}
