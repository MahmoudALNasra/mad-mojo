"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  businessDaysFromNow,
  formatEtaDate,
  type DeliveryEstimate,
} from "@/lib/shipping";

export function ZipChecker({ compact = false }: { compact?: boolean }) {
  const { t, locale } = useLocale();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeliveryEstimate | null>(null);
  const [invalid, setInvalid] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setInvalid(false);
    setResult(null);
    try {
      const res = await fetch(
        `/api/shipping/estimate?postal=${encodeURIComponent(code.trim())}`
      );
      const data = await res.json();
      if (!res.ok || !data.estimate) {
        setInvalid(true);
      } else {
        setResult(data.estimate);
      }
    } catch {
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }

  const etaMin = result ? businessDaysFromNow(result.minDays + 2) : null;
  const etaMax = result ? businessDaysFromNow(result.maxDays + 3) : null;

  return (
    <div className={compact ? "" : "mx-auto max-w-xl"}>
      <form onSubmit={check} className="flex gap-2">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("ship.placeholder")}
            inputMode="text"
            autoComplete="postal-code"
            className={`w-full rounded-full border bg-white py-3 pl-11 pr-4 text-sm font-medium focus:outline-none ${
              invalid
                ? "border-mojo ring-2 ring-mojo/20"
                : "border-ink/15 focus:border-ink"
            } ${compact ? "py-2.5" : ""}`}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`shrink-0 rounded-full bg-ink px-5 text-sm font-bold text-cream transition-colors hover:bg-mojo disabled:opacity-60 ${
            compact ? "py-2.5" : "py-3"
          }`}
        >
          {loading ? t("ship.checking") : t("ship.check")}
        </button>
      </form>

      {invalid && (
        <p className="mt-2 text-sm font-medium text-mojo-dark">
          {t("ship.invalid")}
        </p>
      )}

      {result && etaMin && etaMax && (
        <div className="animate-rise-in mt-3 rounded-2xl border border-jungle/25 bg-jungle/5 p-4 text-left">
          <p className="flex items-center gap-2 text-sm font-bold text-jungle">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
            {t("ship.deliversTo")} {result.region}
            {result.country !== "EU" ? `, ${result.countryLabel}` : ""}
          </p>
          <p className="mt-1.5 text-sm">
            {t("ship.etaShort")}{" "}
            <span className="font-bold">
              {formatEtaDate(etaMin, locale)} – {formatEtaDate(etaMax, locale)}
            </span>{" "}
            <span className="text-ink/60">({t("ship.via")})</span>
          </p>
          <p className="mt-1 text-xs font-medium text-jungle">
            {t("ship.free")}
          </p>
        </div>
      )}
    </div>
  );
}
