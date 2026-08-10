import { notFound } from "next/navigation";
import { ShopView } from "@/components/shop/ShopView";
import { getCategories, getProducts } from "@/lib/data";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = await getCategories();
  const active = categories.find((c) => c.slug === category);
  if (!active) notFound();

  const products = await getProducts({ categorySlug: category });

  return (
    <ShopView
      products={products}
      categories={categories}
      activeCategory={category}
    />
  );
}
