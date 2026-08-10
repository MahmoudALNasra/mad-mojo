"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Product } from "@/lib/types";
import { ProductRow } from "./HomeSections";

export function HomeRows({
  newDrop,
  bestSellers,
}: {
  newDrop: Product[];
  bestSellers: Product[];
}) {
  const { t } = useLocale();
  return (
    <>
      <ProductRow
        title={t("home.newDrop")}
        subtitle={t("home.newDropSub")}
        products={newDrop}
        href="/shop"
      />
      <ProductRow
        title={t("home.bestSellers")}
        products={bestSellers}
        href="/shop"
      />
    </>
  );
}
