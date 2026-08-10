"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SunLogo } from "@/components/SunLogo";
import { useCart } from "@/lib/cart";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function SuccessView() {
  const { t } = useLocale();
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-jungle text-white">
        <SunLogo className="h-14 w-14" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">
        {t("success.title")}
      </h1>
      <p className="mt-4 leading-relaxed text-ink/70">{t("success.body")}</p>
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-full bg-ink px-8 py-4 text-sm font-bold uppercase tracking-widest text-cream transition-colors hover:bg-mojo"
      >
        {t("success.cta")}
      </Link>
    </div>
  );
}
