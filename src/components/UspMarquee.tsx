"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { SunLogo } from "./SunLogo";

const ITEMS: DictKey[] = ["usp.1", "usp.2", "usp.3", "usp.4", "usp.5"];

export function UspMarquee({ dark = false }: { dark?: boolean }) {
  const { t } = useLocale();

  const row = (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((key) => (
        <span key={key} className="flex items-center">
          <span className="whitespace-nowrap px-6 text-[11px] font-bold uppercase tracking-[0.18em] sm:text-xs">
            {t(key)}
          </span>
          <SunLogo className="h-4 w-4 shrink-0 opacity-70" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`overflow-hidden border-y py-2.5 ${
        dark
          ? "border-ink/10 bg-sun text-ink"
          : "border-ink/10 bg-cream text-ink"
      }`}
      aria-hidden="true"
    >
      <div className="animate-marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}
