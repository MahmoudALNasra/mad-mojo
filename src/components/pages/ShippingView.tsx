"use client";

import { ZipChecker } from "@/components/ZipChecker";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function ShippingView() {
  const { t } = useLocale();

  const regions = [
    { flag: "🇺🇸", title: t("ship.us"), body: t("shippage.us.body"), eta: "3–7" },
    { flag: "🇨🇦", title: t("ship.ca"), body: t("shippage.ca.body"), eta: "4–8" },
    { flag: "🇲🇽", title: t("ship.mx"), body: t("shippage.mx.body"), eta: "5–9" },
    { flag: "🇪🇺", title: t("ship.eu"), body: t("shippage.eu.body"), eta: "2–5" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          {t("shippage.title")}
        </h1>
        <p className="mt-3 text-ink/60">{t("shippage.sub")}</p>
      </header>

      <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-ink/10 bg-white p-5">
        <ZipChecker />
      </div>

      <h2 className="mt-14 font-display text-2xl font-bold">
        {t("shippage.where.title")}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {regions.map((region) => (
          <div
            key={region.title}
            className="rounded-2xl border border-ink/10 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{region.flag}</span>
              <span className="rounded-full bg-jungle/10 px-3 py-1 text-xs font-bold text-jungle">
                {region.eta} {t("ship.days")}
              </span>
            </div>
            <h3 className="mt-3 font-display text-xl font-bold">
              {region.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
              {region.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-sand p-6">
          <h3 className="font-display text-xl font-bold">
            {t("shippage.times.title")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            {t("shippage.times.processing")}
          </p>
        </div>
        <div className="rounded-2xl bg-sand p-6">
          <h3 className="font-display text-xl font-bold">
            {t("shippage.returns.title")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            {t("shippage.returns.body")}
          </p>
        </div>
      </div>
    </div>
  );
}
