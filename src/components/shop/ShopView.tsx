"use client";

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Category, Product } from "@/lib/types";

export function ShopView({
  products,
  categories,
  activeCategory,
}: {
  products: Product[];
  categories: Category[];
  activeCategory?: string;
}) {
  const { t, pick } = useLocale();

  const activeName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          {activeName ? pick(activeName.nameEn, activeName.nameEs) : t("nav.shop")}
        </h1>
        <p className="mt-1 text-sm text-ink/50">
          {products.length} {products.length === 1 ? "item" : "items"}
        </p>
      </header>

      {/* Category filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            !activeCategory
              ? "border-ink bg-ink text-cream"
              : "border-ink/15 hover:border-ink"
          }`}
        >
          {t("nav.shop")}
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop/${cat.slug}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              activeCategory === cat.slug
                ? "border-ink bg-ink text-cream"
                : "border-ink/15 hover:border-ink"
            }`}
          >
            {pick(cat.nameEn, cat.nameEs)}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < 8} />
        ))}
      </div>
    </div>
  );
}
