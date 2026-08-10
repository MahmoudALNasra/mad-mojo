"use client";

import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { formatUsd } from "@/lib/cart";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { t, pick } = useLocale();

  const badgeLabel =
    product.badge === "new"
      ? t("product.badge.new")
      : product.badge === "bestseller"
        ? t("product.badge.bestseller")
        : product.badge === "restocked"
          ? t("product.badge.restocked")
          : null;

  const onSale =
    product.compareAtCents !== null &&
    product.compareAtCents > product.priceCents;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
        {product.images[0] && (
          <ProductImage
            src={product.images[0]}
            alt={pick(product.nameEn, product.nameEs)}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        {product.images[1] && (
          <ProductImage
            src={product.images[1]}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-400 group-hover:opacity-100"
          />
        )}
        {badgeLabel && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-white ${
              product.badge === "bestseller" ? "bg-jungle" : "bg-mojo"
            }`}
          >
            {badgeLabel}
          </span>
        )}
        {product.stock === 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white">
            {t("product.original")}
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">
            {t("product.soldOut")}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-semibold leading-snug group-hover:text-mojo">
          {pick(product.nameEn, product.nameEs)}
        </h3>
        <p className="text-sm">
          {onSale && (
            <span className="mr-2 text-ink/40 line-through">
              {formatUsd(product.compareAtCents!)}
            </span>
          )}
          <span className={`font-bold ${onSale ? "text-mojo" : ""}`}>
            {formatUsd(product.priceCents)}
          </span>
        </p>
      </div>
    </Link>
  );
}
