"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { SunLogo } from "./SunLogo";

export function Footer() {
  const { t, locale, setLocale } = useLocale();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mojo text-white">
                <SunLogo className="h-7 w-7" />
              </span>
              <span className="font-display text-2xl font-bold">Mad Mojo</span>
            </div>
            <p className="mt-3 text-sm text-cream/60">{t("footer.tagline")}</p>
            <div className="mt-4 flex gap-2 text-[11px] font-semibold uppercase tracking-wider text-cream/50">
              <span className="rounded-full border border-cream/20 px-2.5 py-1">🇺🇸 {t("ship.badge.us")}</span>
              <span className="rounded-full border border-cream/20 px-2.5 py-1">🇨🇦</span>
              <span className="rounded-full border border-cream/20 px-2.5 py-1">🇲🇽</span>
              <span className="rounded-full border border-cream/20 px-2.5 py-1">🇪🇺</span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-cream/50">
              {t("footer.shop")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/shop" className="hover:text-sun">{t("nav.shop")}</Link></li>
              <li><Link href="/shop/paintings" className="hover:text-sun">{t("nav.paintings")}</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-cream/50">
              {t("footer.help")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/shipping" className="hover:text-sun">{t("footer.shipping")}</Link></li>
              <li><Link href="/contact" className="hover:text-sun">{t("footer.contact")}</Link></li>
              <li><Link href="/about" className="hover:text-sun">{t("footer.about")}</Link></li>
              <li><Link href="/account" className="hover:text-sun">{t("nav.account")}</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-2 font-display text-lg font-bold">
              {t("footer.newsletter")}
            </h3>
            <p className="mb-4 text-sm text-cream/60">
              {t("footer.newsletterSub")}
            </p>
            {subscribed ? (
              <p className="rounded-lg bg-jungle/30 px-4 py-3 text-sm font-medium text-cream">
                {t("footer.subscribed")}
              </p>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.includes("@")) setSubscribed(true);
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email")}
                  className="w-full rounded-full border border-cream/20 bg-transparent px-4 py-2.5 text-sm placeholder:text-cream/40 focus:border-sun focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-sun px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-mojo hover:text-white"
                >
                  {t("footer.subscribe")}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-6 sm:flex-row">
          <p className="text-xs text-cream/40">
            © {new Date().getFullYear()} Mad Mojo. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocale(locale === "en" ? "es" : "en")}
              className="text-xs font-semibold uppercase tracking-wider text-cream/60 hover:text-sun"
            >
              {locale === "en" ? "Español" : "English"}
            </button>
            <span className="text-xs text-cream/40">·</span>
            <span className="text-xs text-cream/40">{t("footer.paymentNote")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
