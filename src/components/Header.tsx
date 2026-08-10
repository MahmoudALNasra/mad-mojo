"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cartCount, useCart } from "@/lib/cart";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { SunLogo } from "./SunLogo";

const NAV = [
  { href: "/shop", key: "nav.shop" as const },
  { href: "/shop/paintings", key: "nav.paintings" as const },
  { href: "/shop/clothing", key: "nav.clothing" as const },
  { href: "/about", key: "nav.about" as const },
  { href: "/contact", key: "nav.contact" as const },
];

export function Header() {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [count, setCount] = useState(0);

  // Avoid hydration mismatch: cart is read from localStorage on the client.
  useEffect(() => {
    setCount(cartCount(items));
  }, [items]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mojo text-white">
            <SunLogo className="sun-spin h-7 w-7" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Mad Mojo
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-mojo ${
                pathname === item.href ? "text-mojo" : "text-ink"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === "en" ? "es" : "en")}
            className="flex h-10 items-center justify-center rounded-full px-2.5 text-xs font-bold uppercase tracking-wider hover:bg-sand"
            aria-label={t("footer.language")}
            title={t("footer.language")}
          >
            {locale === "en" ? "ES" : "EN"}
          </button>

          {/* Account */}
          <Link
            href="/account"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand"
            aria-label={t("nav.account")}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </svg>
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand"
            aria-label={t("cart.title")}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Z" />
              <path d="M9 10V6a3 3 0 0 1 6 0v4" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-mojo px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="animate-fade-in border-t border-ink/10 bg-cream px-4 py-4 lg:hidden">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 font-display text-lg font-semibold hover:bg-sand"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
