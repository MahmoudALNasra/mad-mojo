"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import {
  cartSubtotalCents,
  formatUsd,
  useCart,
} from "@/lib/cart";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function CartPageView() {
  const { t, pick, locale } = useLocale();
  const { items, remove, setQty } = useCart();
  const [hydrated, setHydrated] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setHydrated(true), []);

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
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setCheckingOut(false);
    }
  }

  if (!hydrated) return <div className="min-h-[50vh]" />;

  const subtotal = cartSubtotalCents(items);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        {t("cart.title")}
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-ink/10 bg-white p-12 text-center">
          <p className="text-ink/60">{t("cart.empty")}</p>
          <Link
            href="/shop"
            className="mt-5 inline-block rounded-full bg-mojo px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-mojo-dark"
          >
            {t("cart.emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-ink/10">
            {items.map((item) => (
              <li key={`${item.productId}-${item.size}`} className="flex gap-5 py-5">
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-sand"
                >
                  <ProductImage
                    src={item.image}
                    alt={pick(item.nameEn, item.nameEs)}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-semibold hover:text-mojo"
                    >
                      {pick(item.nameEn, item.nameEs)}
                    </Link>
                    <span className="font-bold">
                      {formatUsd(item.priceCents * item.qty)}
                    </span>
                  </div>
                  {item.size && (
                    <p className="mt-0.5 text-sm text-ink/60">
                      {t("product.size")}: {item.size}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-full border border-ink/15">
                      <button
                        className="flex h-8 w-8 items-center justify-center hover:text-mojo"
                        onClick={() => setQty(item.productId, item.size, item.qty - 1)}
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">
                        {item.qty}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center hover:text-mojo"
                        onClick={() => setQty(item.productId, item.size, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(item.productId, item.size)}
                      className="text-sm text-ink/50 underline hover:text-mojo"
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl bg-sand p-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("cart.subtotal")}</span>
              <span className="font-display text-2xl font-bold">
                {formatUsd(subtotal)}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/50">{t("cart.shippingNote")}</p>
            {error && (
              <p className="mt-3 rounded-lg bg-mojo/10 px-4 py-3 text-sm font-medium text-mojo-dark">
                {error}
              </p>
            )}
            <button
              onClick={checkout}
              disabled={checkingOut}
              className="mt-4 w-full rounded-full bg-mojo py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-mojo-dark disabled:opacity-60"
            >
              {checkingOut ? t("cart.processing") : t("cart.checkout")}
            </button>
            <Link
              href="/shop"
              className="mt-3 block text-center text-sm font-medium underline-offset-4 hover:text-mojo hover:underline"
            >
              {t("cart.continue")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
