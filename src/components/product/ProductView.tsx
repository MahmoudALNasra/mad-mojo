"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { ZipChecker } from "@/components/ZipChecker";
import { formatUsd, useCart } from "@/lib/cart";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Product } from "@/lib/types";

export function ProductView({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { t, pick } = useLocale();
  const add = useCart((s) => s.add);
  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState<string | null>(
    product.sizes ? product.sizes[0] : null
  );
  const [justAdded, setJustAdded] = useState(false);

  const soldOut = product.stock <= 0;
  const onSale =
    product.compareAtCents !== null &&
    product.compareAtCents > product.priceCents;

  const badgeLabel =
    product.badge === "new"
      ? t("product.badge.new")
      : product.badge === "bestseller"
        ? t("product.badge.bestseller")
        : product.badge === "restocked"
          ? t("product.badge.restocked")
          : null;

  function addToCart() {
    add({
      productId: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameEs: product.nameEs,
      priceCents: product.priceCents,
      image: product.images[0] ?? "",
      size,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
            {product.images[imageIndex] && (
              <ProductImage
                src={product.images[imageIndex]}
                alt={pick(product.nameEn, product.nameEs)}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            )}
            {badgeLabel && (
              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold tracking-wider text-white ${
                  product.badge === "bestseller" ? "bg-jungle" : "bg-mojo"
                }`}
              >
                {badgeLabel}
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {product.images.map((image, i) => (
                <button
                  key={image}
                  onClick={() => setImageIndex(i)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === imageIndex ? "border-ink" : "border-transparent"
                  }`}
                  aria-label={`Image ${i + 1}`}
                >
                  <ProductImage src={image} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            {pick(product.nameEn, product.nameEs)}
          </h1>

          <p className="mt-3 text-xl">
            {onSale && (
              <span className="mr-2.5 text-ink/40 line-through">
                {formatUsd(product.compareAtCents!)}
              </span>
            )}
            <span className={`font-bold ${onSale ? "text-mojo" : ""}`}>
              {formatUsd(product.priceCents)}
            </span>
            {product.stock === 1 && (
              <span className="ml-3 rounded-full bg-sun px-3 py-1 text-xs font-bold uppercase tracking-wider">
                {t("product.original")}
              </span>
            )}
          </p>

          <p className="mt-5 leading-relaxed text-ink/75">
            {pick(product.descriptionEn, product.descriptionEs)}
          </p>

          {/* Size selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider">
                {t("product.size")}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-12 rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                      size === s
                        ? "border-ink bg-ink text-cream"
                        : "border-ink/15 hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={addToCart}
            disabled={soldOut}
            className={`mt-7 w-full rounded-full py-4 text-sm font-bold uppercase tracking-widest text-white transition-all ${
              soldOut
                ? "cursor-not-allowed bg-ink/30"
                : justAdded
                  ? "bg-jungle"
                  : "bg-mojo hover:bg-mojo-dark"
            }`}
          >
            {soldOut
              ? t("product.soldOut")
              : justAdded
                ? `✓ ${t("product.added")}`
                : t("product.addToCart")}
          </button>

          {/* Zip delivery estimate */}
          <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-jungle" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="17" r="1.6" />
                <circle cx="17" cy="17" r="1.6" />
              </svg>
              {t("product.checkDelivery")}
            </p>
            <ZipChecker compact />
          </div>

          {/* Accordions */}
          <div className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
            <Accordion title={t("product.details")} defaultOpen>
              {pick(product.detailsEn, product.detailsEs)}
            </Accordion>
            <Accordion title={t("product.shippingReturns")}>
              {t("product.shippingReturnsBody")}
            </Accordion>
            <Accordion title={t("product.artistNote")}>
              {t("product.artistNoteBody")}
            </Accordion>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">
            {t("product.youMayLike")}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-bold uppercase tracking-wider"
        aria-expanded={open}
      >
        {title}
        <span
          className={`text-lg transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      {open && (
        <p className="animate-fade-in pb-4 text-sm leading-relaxed text-ink/70">
          {children}
        </p>
      )}
    </div>
  );
}
