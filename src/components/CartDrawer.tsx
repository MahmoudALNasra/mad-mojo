"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  cartSubtotalCents,
  formatUsd,
  useCart,
} from "@/lib/cart";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function CartDrawer() {
  const { t, pick, locale } = useLocale();
  const { items, isOpen, close, remove, setQty } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartSubtotalCents(items);
  const freeShipRemaining = FREE_SHIPPING_THRESHOLD_CENTS - subtotal;
  const progress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD_CENTS) * 100
  );

  async function checkout() {
    setCheckingOut(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setCheckingOut(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        className="animate-fade-in absolute inset-0 bg-ink/40"
        onClick={close}
        aria-label="Close"
      />
      <aside className="animate-drawer-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold">{t("cart.title")}</h2>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-sand"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Free shipping progress */}
        <div className="border-b border-ink/10 px-5 py-3">
          <p className="mb-2 text-xs font-medium">
            {freeShipRemaining <= 0 ? (
              <span className="font-bold text-jungle">
                {t("cart.freeShipUnlocked")}
              </span>
            ) : (
              <>
                <span className="font-bold">
                  {formatUsd(freeShipRemaining)}
                </span>{" "}
                {t("cart.freeShipProgress")}
              </>
            )}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-jungle transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-ink/60">{t("cart.empty")}</p>
              <Link
                href="/shop"
                onClick={close}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-mojo"
              >
                {t("cart.emptyCta")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}`} className="flex gap-4">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={close}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-sand"
                  >
                    <ProductImage
                      src={item.image}
                      alt={pick(item.nameEn, item.nameEs)}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={close}
                        className="text-sm font-semibold leading-snug hover:text-mojo"
                      >
                        {pick(item.nameEn, item.nameEs)}
                      </Link>
                      <span className="text-sm font-bold">
                        {formatUsd(item.priceCents * item.qty)}
                      </span>
                    </div>
                    {item.size && (
                      <p className="mt-0.5 text-xs text-ink/60">
                        {t("product.size")}: {item.size}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button
                          className="flex h-7 w-7 items-center justify-center text-sm hover:text-mojo"
                          onClick={() =>
                            setQty(item.productId, item.size, item.qty - 1)
                          }
                          aria-label="−"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">
                          {item.qty}
                        </span>
                        <button
                          className="flex h-7 w-7 items-center justify-center text-sm hover:text-mojo"
                          onClick={() =>
                            setQty(item.productId, item.size, item.qty + 1)
                          }
                          aria-label="+"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item.productId, item.size)}
                        className="text-xs text-ink/50 underline hover:text-mojo"
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-ink/10 px-5 py-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">{t("cart.subtotal")}</span>
              <span className="font-display text-lg font-bold">
                {formatUsd(subtotal)}
              </span>
            </div>
            <p className="mb-3 text-xs text-ink/50">{t("cart.shippingNote")}</p>
            {error && (
              <p className="mb-3 rounded-lg bg-mojo/10 px-3 py-2 text-xs font-medium text-mojo-dark">
                {error}
              </p>
            )}
            <button
              onClick={checkout}
              disabled={checkingOut}
              className="w-full rounded-full bg-mojo py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-mojo-dark disabled:opacity-60"
            >
              {checkingOut ? t("cart.processing") : t("cart.checkout")}
            </button>
            <div className="mt-3 flex items-center justify-center gap-2 text-ink/40">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span className="text-[11px]">{t("footer.paymentNote")}</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
